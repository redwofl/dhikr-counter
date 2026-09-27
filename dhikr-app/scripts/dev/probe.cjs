const WebSocket = require('ws');
const pageId = process.env.PD || '286B6376D60DA300F02853FD66E4A9D3';
const expr = process.argv.slice(2).join(' ') || 'EXPR_MISSING';
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/' + pageId, {handshakeTimeout:5000, perMessageDeflate:false});
const pending = new Map();
let seq = 0;
ws.on('message', (data) => {
  let m;
  try { m = JSON.parse(data); } catch { return; }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
ws.on('open', () => {
  const id = ++seq;
  pending.set(id, (msg) => {
    if (msg.error) { console.error(JSON.stringify(msg.error)); process.exitCode = 1; }
    else if (msg.result && msg.result.exceptionDetails) {
      console.error('EXC:', JSON.stringify(msg.result.exceptionDetails.exception && msg.result.exceptionDetails.exception.description || msg.result.exceptionDetails));
    }
    else if (msg.result && msg.result.result) {
      const r = msg.result.result;
      console.log(r.value !== undefined ? (typeof r.value === 'string' ? r.value : JSON.stringify(r.value)) : JSON.stringify(msg.result));
    }
    try { ws.close(); } catch {}
  });
  ws.send(JSON.stringify({id, method:'Runtime.evaluate', params:{expression:expr, returnByValue:true, awaitPromise:true}}));
  setTimeout(() => { console.error('CDP timeout'); process.exitCode = 2; try { ws.close(); } catch {} }, 10000);
});
ws.on('error', (e) => { console.error('WSE', e.message); process.exitCode = 1; });
setTimeout(() => { if (!ws.readyState) { console.error('WS never opened'); process.exitCode = 2; } try { ws.close(); } catch {} }, 11000);