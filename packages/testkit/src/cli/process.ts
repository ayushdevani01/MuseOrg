import { spawn } from "node:child_process";

export function runProcess(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const packageScript = command === "pnpm" ? process.env.npm_execpath : undefined;
    const child = spawn(
      packageScript ? process.execPath : command,
      packageScript ? [packageScript, ...args] : args,
      { stdio: "inherit", env, shell: false },
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}
