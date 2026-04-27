import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

export class ContentAddressableStorage {
  private rootPath: string;
  private initialized = false;

  constructor(rootPath: string) {
    const expanded = String(rootPath ?? "").replace(/^~/, os.homedir());
    this.rootPath = path.resolve(expanded);
  }

  computeHash(content: string): string {
    return createHash("sha256")
      .update(String(content ?? ""))
      .digest("hex");
  }

  public blobPath(hash: string): string {
    const prefix = hash.slice(0, 2) || "__";
    return path.join(this.rootPath, prefix, hash);
  }

  private async ensureDir(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(this.rootPath, { recursive: true });
    this.initialized = true;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async safeUnlink(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // best-effort cleanup
    }
  }

  async write(content: string): Promise<string> {
    await this.ensureDir();
    const hash = this.computeHash(content);
    const filePath = this.blobPath(hash);
    const dir = path.dirname(filePath);

    if (await this.fileExists(filePath)) {
      return hash;
    }

    await fs.mkdir(dir, { recursive: true });

    const tmpPath = `${filePath}.tmp.${randomUUID()}`;
    await fs.writeFile(tmpPath, content, { encoding: "utf8" });

    try {
      await fs.rename(tmpPath, filePath);
    } catch (renameError) {
      if (await this.fileExists(filePath)) {
        await this.safeUnlink(tmpPath);
        return hash;
      }
      throw renameError;
    }

    return hash;
  }

  async read(hash: string): Promise<string> {
    const filePath = this.blobPath(hash);
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      throw new Error(`Blob not found: ${hash}`);
    }
  }

  async has(hash: string): Promise<boolean> {
    try {
      await fs.access(this.blobPath(hash));
      return true;
    } catch {
      return false;
    }
  }

  async delete(hash: string): Promise<void> {
    try {
      await fs.unlink(this.blobPath(hash));
    } catch {
      // idempotent
    }
  }

  async listAllHashes(): Promise<string[]> {
    const hashes: string[] = [];

    try {
      const shards = await fs.readdir(this.rootPath, { withFileTypes: true });
      for (const shard of shards) {
        if (!shard.isDirectory()) continue;
        const shardDir = path.join(this.rootPath, shard.name);
        const files = await fs.readdir(shardDir, { withFileTypes: true });
        for (const f of files) {
          if (!f.isFile()) continue;
          const name = String(f.name ?? "").trim();
          if (name) hashes.push(name);
        }
      }
    } catch {
      return [];
    }

    return hashes;
  }

  async readVerified(hash: string): Promise<string | null> {
    const filePath = this.blobPath(hash);
    let content: string;
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      return null;
    }

    const actual = this.computeHash(content);
    return actual === hash ? content : null;
  }

  buildContentRef(hash: string): string {
    return `sha256:${String(hash ?? "").trim()}`;
  }

  parseHashFromRef(ref: string): string | null {
    const r = String(ref ?? "").trim();
    if (!r) return null;

    if (r.startsWith("sha256:")) {
      const hash = r.slice("sha256:".length).trim();
      return hash || null;
    }

    return r;
  }
}
