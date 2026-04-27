/**
 * MemoHub V1.1 自动构建引擎 (Final Stable)
 */
import { build, spawn } from "bun";

const entry = "./apps/cli/src/index.ts";
const outdir = "./dist";
const binaryName = "mhub";

console.log(`\n📦 Starting MemoHub Bundling...`);

const result = await build({
  entrypoints: [entry],
  outdir,
  target: "bun",
  bundle: true,
  minify: true,
  // 核心：所有内部代码内联，外部原生依赖保持 external
  external: ["@lancedb/lancedb", "web-tree-sitter", "signal-exit", "restore-cursor", "chalk", "commander", "ora"],
});

if (!result.success) {
  console.error("\n❌ Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`✅ JS Bundle generated at ${outdir}/index.js`);

console.log(`🚀 Compiling to single binary [${binaryName}]...`);
// 关键：在编译阶段也带上 --bundle，并且必须再次声明 external 以避开 native 库
const proc = spawn([
  "bun", "build", 
  "--compile", 
  "--bundle", 
  "--minify",
  "--external", "@lancedb/lancedb",
  "--external", "web-tree-sitter",
  "--external", "signal-exit",
  "--external", "restore-cursor",
  `${outdir}/index.js`, 
  "--outfile", `${outdir}/${binaryName}`
]);

const exitCode = await proc.exited;
if (exitCode === 0) {
  console.log(`\n🎉 Success! Binary is ready at: ${outdir}/${binaryName}`);
} else {
  console.error(`\n❌ Compilation failed with code ${exitCode}`);
}
