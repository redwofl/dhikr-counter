/**
 * Evaluate JavaScript inside the app's WebView over the Chrome DevTools
 * Protocol.
 *
 * The only way to see what the page actually thinks — uiautomator and
 * screenshots both describe the pixels, not the DOM, so they cannot tell
 * "the .dark class was never added" apart from "the CSS ignores it".
 *
 * Usage: node cdp-eval.mjs '<expression>' ['<expression>' ...]
 */
const TARGET = "https://localhost/";
const PORT = 9222;

// Find the app's page (not the AdMob iframe).
const list = await (await fetch(`http://localhost:${PORT}/json`)).json();
const page = list.find((t) => t.type === "page" && t.url.startsWith(TARGET));
if (!page) {
  console.error("app page not found; targets:", list.map((t) => t.url));
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();

const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const msgId = ++id;
    pending.set(msgId, { res, rej });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  }
});

await new Promise((r) => ws.addEventListener("open", r, { once: true }));

for (const expr of process.argv.slice(2)) {
  const r = await send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  const v = r.result?.value;
  console.log(`${expr}\n  => ${JSON.stringify(v)}`);
}

ws.close();
