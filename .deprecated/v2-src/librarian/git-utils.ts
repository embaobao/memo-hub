import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * runGit：以 Promise 方式执行 git 命令，并返回 stdout
 *
 * 设计目标：
 * - 统一处理 cwd、编码、错误消息
 * - 便于在 Librarian / Hook / 测试中复用
 */
export async function runGit(
  args: string[],
  options: { cwd?: string } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { cwd } = options ?? {};

  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 20,
    });

    return {
      stdout: String(stdout ?? ""),
      stderr: String(stderr ?? ""),
      exitCode: 0,
    };
  } catch (error: any) {
    const stdout = String(error?.stdout ?? "");
    const stderr = String(error?.stderr ?? error?.message ?? "");
    const exitCode = typeof error?.code === "number" ? error.code : 1;
    return { stdout, stderr, exitCode };
  }
}

/**
 * resolveGitDirs：解析仓库根目录与 .git 目录（支持 worktree）
 *
 * 说明：
 * - `git rev-parse --show-toplevel` 返回仓库根
 * - `git rev-parse --git-dir` 返回 gitDir（可能是相对路径，如 .git 或 .git/worktrees/...）
 */
export async function resolveGitDirs(
  cwd?: string
): Promise<{ repoRoot?: string; gitDir?: string }> {
  const root = await runGit(["rev-parse", "--show-toplevel"], { cwd });
  if (root.exitCode !== 0) {
    return {};
  }

  const gitDir = await runGit(["rev-parse", "--git-dir"], { cwd });
  const repoRoot = root.stdout.trim();

  const gitDirPathRaw = gitDir.stdout.trim();
  const gitDirPath =
    gitDir.exitCode === 0 && gitDirPathRaw
      ? gitDirPathRaw.startsWith("/")
        ? gitDirPathRaw
        : `${repoRoot}/${gitDirPathRaw}`
      : undefined;

  return {
    repoRoot: repoRoot || undefined,
    gitDir: gitDirPath,
  };
}

export interface GitChangedFile {
  status: string;
  filePath: string;
}

/**
 * parseDiffTreeNameStatus：解析 `git diff-tree --name-status` 输出
 *
 * 输出示例：
 * - "M\tsrc/a.ts"
 * - "A\tREADME.md"
 * - "R100\told.ts\tnew.ts"   （重命名，取 new.ts 作为 filePath）
 */
export function parseDiffTreeNameStatus(stdout: string): GitChangedFile[] {
  const text = String(stdout ?? "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const results: GitChangedFile[] = [];
  for (const line of lines) {
    const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
    const status = String(parts[0] ?? "").trim();

    if (!status) {
      continue;
    }

    /**
     * 重命名/复制：格式一般为 <status>\t<old>\t<new>
     * 这里优先使用 new path，保证 context.filePath 更符合当前仓库状态。
     */
    const filePath = String(parts[2] ?? parts[1] ?? "").trim();
    if (!filePath) {
      continue;
    }

    results.push({ status, filePath });
  }

  return results;
}

