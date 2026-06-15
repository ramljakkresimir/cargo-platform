// Kills any process listening on the dev server ports before startup.
//
// Root cause this prevents: on Windows, closing a terminal (VS Code "Kill
// Terminal", window X button, etc.) sends CTRL_CLOSE_EVENT to attached
// processes, but deep grandchildren (vite, nest) spawned 4+ levels down
// via cmd.exe /s /c wrappers can survive as headless orphans.
// concurrently's tree-kill also runs taskkill asynchronously, so if
// concurrently's own process exits first (common when Ctrl+C is used),
// the taskkill never fires and Vite stays alive on port 5173.
//
// npm runs this via the "predev" hook before "dev" starts.

'use strict';
const { execSync } = require('child_process');

const DEV_PORTS = [3000, 5173];

for (const port of DEV_PORTS) {
  try {
    if (process.platform === 'win32') {
      // Find PIDs of LISTENING processes on this port.
      // The trailing space in ":${port} " prevents matching longer port numbers
      // (e.g. :51730 should not match :5173).
      const out = execSync(
        `netstat -ano | findstr ":${port} " | findstr "LISTENING"`,
        { encoding: 'utf8' }
      );
      const pids = new Set(
        out.trim().split('\n')
          .map(line => line.trim().split(/\s+/).pop())
          .filter(pid => pid && /^\d+$/.test(pid) && pid !== '0')
      );
      for (const pid of pids) {
        try {
          // /T kills the entire process tree rooted at pid, /F forces it.
          execSync(`taskkill /T /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[predev] Killed stale process tree (PID ${pid}) on port ${port}`);
        } catch (_) {
          // Process already gone between netstat and taskkill — fine.
        }
      }
    } else {
      // Unix: lsof lists PIDs listening on the port, xargs kills them.
      execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: 'ignore', shell: true });
      console.log(`[predev] Cleared port ${port}`);
    }
  } catch (_) {
    // netstat/lsof found no process on this port — nothing to do.
  }
}
