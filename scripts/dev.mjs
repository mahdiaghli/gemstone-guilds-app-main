import { spawn } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error("npm_execpath is unavailable; run this launcher through npm run dev.");
}

const children = ["dev:server", "dev:client"].map((script) =>
  spawn(process.execPath, [npmCli, "run", script], {
    stdio: "inherit",
    shell: false,
  }),
);

let shuttingDown = false;
function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(error);
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (!shuttingDown && (code !== 0 || signal)) shutdown(code || 1);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
