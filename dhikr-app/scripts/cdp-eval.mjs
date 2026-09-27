/**
 * Dev helper: evaluate a JS expression in the app's WebView via the Chrome
 * DevTools Protocol (requires `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`).
 *
 * Usage: node scripts/cdp-eval.mjs "<expression>"
 */
import { WebSocket } from "ws";
import { execSync } from "node:child_process";

const list = JSON.parse(execSync("curl -s http://localhost:9222/json/list", { encoding: "utf8" }));
const page = list.find((p) => p.type === "page" && p.url === "https://localhost/");
if (!page) {
  console.error("No page found");
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
const expr = process.argv[2] || "document.title";

const timeout = setTimeout(() => {
  console.error("timeout");
  process.exit(1);
}, 10000);

ws.on("open", () => {
  ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true, awaitPromise: true } }));
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id === 1) {
    clearTimeout(timeout);
    if (msg.result && msg.result.exceptionDetails) {
      console.error(JSON.stringify(msg.result.exceptionDetails, null, 2));
    } else {
      console.log(JSON.stringify(msg.result?.result?.value, null, 2));
    }
    ws.close();
    process.exit(0);
  }
});

ws.on("error", (e) => {
  clearTimeout(timeout);
  console.error("ws error:", e.message);
  process.exit(1);
});
