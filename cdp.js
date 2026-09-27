const expr = process.argv[2];
const http = require("http");
function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}
async function main() {
  const pages = await getJson("http://localhost:9222/json/list");
  const page = pages.find((p) => p.title.includes("Dhikr") || p.url === "https://localhost/") || pages.find((p) => p.type === "page");
  if (!page) { console.error("no page"); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.onopen = () => {
    const msg = (method, params) => {
      const mid = ++id;
      pending.set(mid, {});
      ws.send(JSON.stringify({ id: mid, method, params }));
      return new Promise((res, rej) => { pending.set(mid, { res, rej }); });
    };
    (async () => {
      try {
        const r = await msg("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) console.log("EXC", JSON.stringify(r.exceptionDetails.exception));
        else console.log(JSON.stringify(r.result && r.result.result && r.result.result.value, null, 2));
      } catch (e) { console.error("ERR", e.message); }
      ws.close();
    })();
  };
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.rej(new Error(m.error.message)); else p.res(m); }
  };
}
main();