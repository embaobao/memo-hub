import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
/**
 * FileGovernanceEventQueue：最小可用的“本地文件队列”
 *
 * 说明：
 * - 该实现只负责“追加写”，不负责消费/ACK（后续可演进为真正队列）
 * - 为了兼容现有系统：写入失败不会在治理阶段抛错（由调用方决定是否吞错）
 */
export class FileGovernanceEventQueue {
    filePath;
    ensureReadyPromise = null;
    constructor(options) {
        const { filePath = "" } = options ?? {};
        this.filePath = expandHomePath(filePath);
    }
    getPath() {
        return this.filePath;
    }
    async append(event) {
        await this.ensureReady();
        const line = `${JSON.stringify(event)}\n`;
        await fs.appendFile(this.filePath, line, "utf-8");
    }
    async ensureReady() {
        if (this.ensureReadyPromise) {
            return this.ensureReadyPromise;
        }
        this.ensureReadyPromise = (async () => {
            const dir = path.dirname(this.filePath);
            await fs.mkdir(dir, { recursive: true });
            try {
                await fs.access(this.filePath);
            }
            catch {
                await fs.writeFile(this.filePath, "", "utf-8");
            }
        })();
        return this.ensureReadyPromise;
    }
}
function expandHomePath(inputPath) {
    const raw = String(inputPath ?? "").trim();
    if (!raw) {
        return raw;
    }
    if (raw === "~") {
        return os.homedir();
    }
    if (raw.startsWith("~/")) {
        return path.join(os.homedir(), raw.slice(2));
    }
    return raw;
}
//# sourceMappingURL=file-event-queue.js.map