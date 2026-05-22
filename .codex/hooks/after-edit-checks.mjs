import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function runCheck(scriptName) {
  const result = spawnSync(npmCommand, ["run", scriptName], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`Failed to run npm run ${scriptName}: ${result.error.message}`);
  }

  return result.status ?? 1;
}

const checks = ["lint", "typecheck"];

for (const check of checks) {
  const status = runCheck(check);

  if (status !== 0) {
    console.error(
      `Codex post-edit check failed: npm run ${check}. Review the output above before continuing.`,
    );
    process.exit(2);
  }
}
