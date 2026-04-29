import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type WorkspacePackage = {
  name: string;
  dir: string;
  packageJson: Record<string, any>;
  workspaceDeps: string[];
};

const WORKSPACE_ROOTS = ["packages", "tracks", "apps"];

export function loadWorkspacePackages(root = process.cwd()): WorkspacePackage[] {
  const packages: WorkspacePackage[] = [];

  for (const workspaceRoot of WORKSPACE_ROOTS) {
    const absoluteRoot = join(root, workspaceRoot);
    if (!existsSync(absoluteRoot)) continue;

    for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const dir = join(absoluteRoot, entry.name);
      const manifestPath = join(dir, "package.json");
      if (!existsSync(manifestPath)) continue;

      const packageJson = JSON.parse(readFileSync(manifestPath, "utf8"));
      const dependencyMaps = [
        packageJson.dependencies ?? {},
        packageJson.devDependencies ?? {},
        packageJson.peerDependencies ?? {},
      ];
      const workspaceDeps = dependencyMaps
        .flatMap((deps) => Object.entries(deps))
        .filter(([, version]) => typeof version === "string" && version.startsWith("workspace:"))
        .map(([name]) => name);

      packages.push({
        name: packageJson.name,
        dir,
        packageJson,
        workspaceDeps,
      });
    }
  }

  return topologicalSort(packages);
}

function topologicalSort(packages: WorkspacePackage[]): WorkspacePackage[] {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const sorted: WorkspacePackage[] = [];

  const visit = (pkg: WorkspacePackage) => {
    if (visited.has(pkg.name)) return;
    if (visiting.has(pkg.name)) {
      throw new Error(`Workspace dependency cycle detected at ${pkg.name}`);
    }

    visiting.add(pkg.name);
    for (const depName of pkg.workspaceDeps) {
      const dep = byName.get(depName);
      if (dep) visit(dep);
    }
    visiting.delete(pkg.name);
    visited.add(pkg.name);
    sorted.push(pkg);
  };

  for (const pkg of packages) visit(pkg);
  return sorted;
}
