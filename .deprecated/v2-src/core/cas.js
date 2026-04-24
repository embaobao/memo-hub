import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
/**
 * ContentAddressableStorage：内容寻址存储（CAS）
 *
 * 目标：
 * - 输入原文 text → 计算 sha256 → 以 hash 命名落盘
 * - 通过 contentRef 引用原文，便于后续“灵肉分离”：索引可重建、原文可去重
 *
 * 约定：
 * - contentHash：sha256 十六进制字符串
 * - contentRef：统一使用 `sha256:<hash>` 形式（不包含物理路径，便于迁移根目录）
 * - 文件落盘：<root>/<hash前2位>/<hash>（分片目录避免单目录过多文件）
 */
export class ContentAddressableStorage {
    rootPath;
    constructor(config) {
        const { root_path } = config ?? { root_path: "" };
        const expandedRoot = String(root_path ?? "").replace(/^~/, os.homedir());
        this.rootPath = path.resolve(expandedRoot);
    }
    /**
     * 计算 sha256（十六进制）
     *
     * 注意：
     * - 这里不复用 src/lib/utils.ts 的 computeHash，是为了避免引入 Tree-sitter 等可选依赖，
     *   保持 CAS 为一个轻量、可独立复用的基础设施模块
     */
    computeSha256(text) {
        return createHash("sha256").update(String(text ?? "")).digest("hex");
    }
    /**
     * 构造 contentRef（不包含物理路径）
     */
    buildContentRef(hash) {
        const normalizedHash = String(hash ?? "").trim();
        return `sha256:${normalizedHash}`;
    }
    /**
     * 从 contentRef 解析 hash
     *
     * 兼容策略：
     * - 支持 `sha256:<hash>`（推荐）
     * - 支持直接传 `<hash>`（用于历史/调试场景）
     */
    parseHashFromRef(contentRef) {
        const ref = String(contentRef ?? "").trim();
        if (!ref) {
            return null;
        }
        if (ref.startsWith("sha256:")) {
            const hash = ref.slice("sha256:".length).trim();
            return hash || null;
        }
        return ref;
    }
    /**
     * 根据 hash 计算落盘路径
     */
    resolvePathByHash(hash) {
        const normalizedHash = String(hash ?? "").trim();
        const shard = normalizedHash.slice(0, 2) || "__";
        return path.join(this.rootPath, shard, normalizedHash);
    }
    /**
     * 写入原文（幂等）：同 hash 内容只会落盘一次
     */
    async putText(text) {
        const source = String(text ?? "");
        const contentHash = this.computeSha256(source);
        const contentRef = this.buildContentRef(contentHash);
        const finalPath = this.resolvePathByHash(contentHash);
        const dir = path.dirname(finalPath);
        try {
            await fs.mkdir(dir, { recursive: true });
            /**
             * 幂等写入策略：
             * - 先判断最终文件是否存在（存在则直接返回）
             * - 否则写入临时文件，再 rename 到最终文件，尽量保证“要么完整写入，要么不写入”
             * - 并发情况下可能出现多方同时写入同 hash：rename 失败时清理临时文件并视作成功
             */
            const exists = await this.fileExists(finalPath);
            if (exists) {
                return { contentHash, contentRef };
            }
            const tmpPath = `${finalPath}.tmp.${randomUUID()}`;
            await fs.writeFile(tmpPath, source, { encoding: "utf8" });
            try {
                await fs.rename(tmpPath, finalPath);
            }
            catch (renameError) {
                const finalExists = await this.fileExists(finalPath);
                if (!finalExists) {
                    throw renameError;
                }
                await this.safeUnlink(tmpPath);
            }
        }
        catch (error) {
            /**
             * 写入链路容错：
             * - CAS 是“增强能力”，不能阻塞主链路（与 Embedder 失败返回零向量的策略一致）
             * - 上层可选择记录 error，但此处不抛出，避免 CLI/MCP 行为退化
             */
            return { contentHash, contentRef };
        }
        return { contentHash, contentRef };
    }
    /**
     * 读取原文
     */
    async getTextByRef(contentRef) {
        const hash = this.parseHashFromRef(contentRef);
        if (!hash) {
            return null;
        }
        const p = this.resolvePathByHash(hash);
        try {
            const buf = await fs.readFile(p);
            return buf.toString("utf8");
        }
        catch {
            return null;
        }
    }
    /**
     * 校验并读取原文（校验失败返回 null）
     */
    async getTextVerified(options) {
        const { contentRef, contentHash } = options ?? { contentRef: "" };
        const text = await this.getTextByRef(contentRef);
        if (text == null) {
            return null;
        }
        const expectedHash = String(contentHash ?? "").trim();
        if (!expectedHash) {
            return text;
        }
        const actual = this.computeSha256(text);
        return actual === expectedHash ? text : null;
    }
    /**
     * 遍历 CAS 内的所有 hash（用于索引重建/巡检）
     */
    async listAllHashes() {
        const hashes = [];
        try {
            const shards = await fs.readdir(this.rootPath, { withFileTypes: true });
            for (const shard of shards) {
                if (!shard.isDirectory()) {
                    continue;
                }
                const shardDir = path.join(this.rootPath, shard.name);
                const files = await fs.readdir(shardDir, { withFileTypes: true });
                for (const f of files) {
                    if (!f.isFile()) {
                        continue;
                    }
                    const name = String(f.name ?? "").trim();
                    if (name) {
                        hashes.push(name);
                    }
                }
            }
        }
        catch {
            return [];
        }
        return hashes;
    }
    async fileExists(filePath) {
        try {
            await fs.stat(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async safeUnlink(filePath) {
        try {
            await fs.unlink(filePath);
        }
        catch {
            return;
        }
    }
}
//# sourceMappingURL=cas.js.map