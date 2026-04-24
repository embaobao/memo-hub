import { createHash } from "node:crypto";
import * as path from "node:path";
import type { MemoEngine } from "../pipeline/engine.js";
import type { MemoRecord } from "../types/index.js";
import { FileIdempotencyStore } from "./file-idempotency-store.js";
import { parseDiffTreeNameStatus, resolveGitDirs, runGit } from "./git-utils.js";

export interface IngestGitCommitOptions {
  /**
   * 仓库工作目录（默认 process.cwd()）
   */
  cwd?: string;

  /**
   * 目标提交（默认 HEAD）
   */
  commit?: string;

  /**
   * dry-run：只展示将处理的文件，不实际写入
   */
  dryRun?: boolean;

  /**
   * 限制最多处理的文件数（避免一次提交过大导致写入压力过高）
   */
  maxFiles?: number;

  /**
   * 限制单文件 diff 最大字节数（超过则跳过该文件）
   *
   * 说明：
   * - Hook 场景要尽量快，避免阻塞开发者 commit 流程
   * - 大文件 diff 通常噪声高，后续可做更细粒度的策略（例如只抽取符号/摘要）
   */
  maxDiffBytes?: number;
}

export interface IngestGitCommitResult {
  commit: string;
  repoRoot?: string;
  processed: number;
  skipped: number;
  reasons: Array<{ filePath: string; reason: string }>;
  records: MemoRecord[];
}

/**
 * ingestGitCommit：把某次提交的“增量 diff”转为记忆写入
 *
 * 核心约束（Task9）：
 * - 捕捉增量变更：使用 `git show <commit> -- <file>` 得到每个文件的 patch
 * - 触发写入管：通过 MemoEngine.ingest 进入统一写入管
 * - 内容哈希幂等：对每个“文件 diff 文本”计算 sha256，落盘记录已处理 key，避免重复写入
 */
export async function ingestGitCommit(
  engine: MemoEngine,
  options: IngestGitCommitOptions = {}
): Promise<IngestGitCommitResult> {
  const {
    cwd = process.cwd(),
    commit: commitInput,
    dryRun = false,
    maxFiles = 50,
    maxDiffBytes = 200_000,
  } = options ?? {};

  const commit =
    typeof commitInput === "string" && String(commitInput ?? "").trim() !== ""
      ? String(commitInput).trim()
      : "HEAD";

  const { repoRoot, gitDir } = await resolveGitDirs(cwd);

  /**
   * 幂等键存储位置：
   * - 优先放在 .git 目录下（天然“按仓库隔离”，并且不会被误提交）
   * - worktree 场景：gitDir 可能是 .git/worktrees/...，同样有效
   */
  const idempotencyFilePath = gitDir
    ? path.join(gitDir, "memohub", "post-commit-idempotency.ndjson")
    : path.join(repoRoot ?? cwd, ".git", "memohub", "post-commit-idempotency.ndjson");
  const store = new FileIdempotencyStore({ filePath: idempotencyFilePath });

  const diffTree = await runGit(["diff-tree", "--no-commit-id", "--name-status", "-r", commit], {
    cwd,
  });

  const files = parseDiffTreeNameStatus(diffTree.stdout).slice(0, Math.max(0, Number(maxFiles) || 0));

  let processed = 0;
  let skipped = 0;
  const reasons: Array<{ filePath: string; reason: string }> = [];
  const records: MemoRecord[] = [];

  for (const file of files) {
    const { filePath, status } = file ?? { filePath: "", status: "" };
    const resolvedFilePath = String(filePath ?? "").trim();
    if (!resolvedFilePath) {
      continue;
    }

    /**
     * 删除文件（D）无法从 commit 中取到内容，直接跳过
     * - 未来可扩展为“写入删除事件”，用于治理/清理
     */
    if (String(status ?? "").startsWith("D")) {
      skipped += 1;
      reasons.push({ filePath: resolvedFilePath, reason: "删除文件无可写入内容，已跳过" });
      continue;
    }

    const show = await runGit(["show", `${commit}`, "--format=", "--", resolvedFilePath], { cwd });
    const diffText = String(show.stdout ?? "");
    const diffBytes = Buffer.byteLength(diffText, "utf-8");

    if (!diffText.trim()) {
      skipped += 1;
      reasons.push({ filePath: resolvedFilePath, reason: "diff 为空，已跳过" });
      continue;
    }

    if (diffBytes > Math.max(1, Number(maxDiffBytes) || 1)) {
      skipped += 1;
      reasons.push({
        filePath: resolvedFilePath,
        reason: `diff 过大(${diffBytes} bytes)，超过限制(${maxDiffBytes})，已跳过`,
      });
      continue;
    }

    /**
     * 内容哈希幂等：
     * - 这里以“单文件 diff 文本”为最小幂等单位
     * - key 中带上 filePath，避免不同文件出现相同 diff 片段造成误判
     */
    const contentHash = createHash("sha256").update(diffText).digest("hex");
    const key = `git:diff:${resolvedFilePath}:sha256:${contentHash}`;

    if (await store.has(key)) {
      skipped += 1;
      reasons.push({ filePath: resolvedFilePath, reason: "内容哈希已处理，已跳过" });
      continue;
    }

    if (dryRun) {
      processed += 1;
      continue;
    }

    const text = [
      "【Git 增量变更】",
      `commit: ${commit}`,
      `file: ${resolvedFilePath}`,
      `status: ${status}`,
      "",
      diffText.trimEnd(),
    ].join("\n");

    const record = await engine.ingest({
      text,
      context: {
        /**
         * 关键：把 filePath 透传给写入管路由阶段
         * - 代码文件会自动路由到 ClawMem
         * - 其它文件默认进入 GBrain
         */
        filePath: resolvedFilePath,
        project: repoRoot,
        source: "git_post_commit",
      },
      metadata: {
        /**
         * 元信息尽量以 tags/category 表达：
         * - provider 层会把 tags/category 落库；
         * - 其它自定义字段可能会被旧版 schema/返回结构裁剪，因此这里不依赖它们。
         */
        category: "project-catalog",
        tags: ["git", "post-commit", `commit:${commit.slice(0, 12)}`, `file:${resolvedFilePath}`],
      },
    });

    await store.mark(key);
    records.push(record);
    processed += 1;
  }

  return {
    commit,
    repoRoot,
    processed,
    skipped,
    reasons,
    records,
  };
}

