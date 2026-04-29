#!/usr/bin/env bun
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { CLI_COMMANDS, CLI_METADATA, MCP_RESOURCES, MCP_TOOLS } from "../../apps/cli/src/interface-metadata";
import { loadWorkspacePackages } from "./workspace";

const root = process.cwd();
const generatedDir = join(root, "docs/generated");
const githubBase = "https://github.com/embaobao/memo-hub/blob/main";
mkdirSync(generatedDir, { recursive: true });

writeFileSync(join(generatedDir, "README.md"), [
  "# Generated Documentation",
  "",
  "This directory contains generated or metadata-driven documentation. Do not hand-edit generated reference content unless the corresponding source metadata is updated.",
  "",
  "- [CLI Reference](cli-reference.md)",
  "- [MCP Reference](mcp-reference.md)",
  "- [Package Index](package-index.md)",
  "- [OpenSpec Change Index](openspec-index.md)",
  "",
].join("\n"));

writeFileSync(join(generatedDir, "cli-reference.md"), renderCliReference());
writeFileSync(join(generatedDir, "mcp-reference.md"), renderMcpReference());
writeFileSync(join(generatedDir, "package-index.md"), renderPackageIndex());
writeFileSync(join(generatedDir, "openspec-index.md"), renderOpenSpecIndex());

console.log("Generated docs into docs/generated.");

function renderCliReference(): string {
  const lines = [
    "# CLI Reference",
    "",
    `Generated from \`apps/cli/src/interface-metadata.ts\`.`,
    "",
    `Command: \`${CLI_METADATA.name}\``,
    "",
    `Version: \`${CLI_METADATA.version}\``,
    "",
    CLI_METADATA.description,
    "",
    "## Commands",
    "",
  ];

  for (const command of CLI_COMMANDS) {
    lines.push(`### ${command.name}`, "", command.description, "");
    if (command.alias) lines.push(`Alias: \`${command.alias}\``, "");
    if (command.arguments?.length) {
      lines.push("Arguments:", "");
      for (const arg of command.arguments) lines.push(`- \`${arg.name}\`: ${arg.description}`);
      lines.push("");
    }
    if (command.options?.length) {
      lines.push("Options:", "");
      for (const option of command.options) {
        const suffix = option.defaultValue ? ` Default: \`${option.defaultValue}\`.` : "";
        lines.push(`- \`${option.name}\`: ${option.description}.${suffix}`);
      }
      lines.push("");
    }
    lines.push("Examples:", "");
    for (const example of command.examples) lines.push(`- \`${example}\``);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function renderMcpReference(): string {
  const lines = [
    "# MCP Reference",
    "",
    "Generated from `apps/cli/src/interface-metadata.ts`.",
    "",
    "## Tools",
    "",
  ];

  for (const tool of MCP_TOOLS) {
    lines.push(`### ${tool.name}`, "", `Status: \`${tool.status}\``, "", tool.description, "", "Inputs:", "");
    for (const input of tool.inputSummary) lines.push(`- \`${input}\``);
    lines.push("");
  }

  lines.push("## Resources", "");
  for (const resource of MCP_RESOURCES) {
    lines.push(`### ${resource.name}`, "", `URI: \`${resource.uri}\``, "", resource.description, "");
  }

  return `${lines.join("\n")}\n`;
}

function renderPackageIndex(): string {
  const lines = [
    "# Package Index",
    "",
    "Generated from workspace package manifests.",
    "",
    "| Package | Directory | Workspace Dependencies |",
    "| --- | --- | --- |",
  ];

  for (const pkg of loadWorkspacePackages(root)) {
    const deps = pkg.workspaceDeps.length ? pkg.workspaceDeps.map((dep) => `\`${dep}\``).join(", ") : "-";
    lines.push(`| \`${pkg.name}\` | \`${relative(root, pkg.dir)}\` | ${deps} |`);
  }

  return `${lines.join("\n")}\n`;
}

function renderOpenSpecIndex(): string {
  const changesDir = join(root, "openspec/changes");
  const specsDir = join(root, "openspec/specs");
  const changes = readdirSync(changesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((change) => exists(join(changesDir, change, "proposal.md")))
    .sort();
  const specs = readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const lines = [
    "# OpenSpec Index",
    "",
    "Generated from `openspec/changes` and `openspec/specs`.",
    "",
    "## Active Changes",
    "",
    ...changes.map((change) => `- [${change}](${githubBase}/openspec/changes/${change}/proposal.md)`),
    "",
    "## Specs",
    "",
    ...specs.map((spec) => `- [${spec}](${githubBase}/openspec/specs/${spec}/spec.md)`),
    "",
  ];

  // Touch a known docs file so this script fails early if the docs tree is missing.
  readFileSync(join(root, "docs/README.md"), "utf8");
  return lines.join("\n");
}

function exists(path: string): boolean {
  try {
    readFileSync(path, "utf8");
    return true;
  } catch {
    return false;
  }
}
