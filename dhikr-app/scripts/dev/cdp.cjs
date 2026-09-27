const WebSocket = require('ws');
const pageId = process.env.PD || '286B6376D60DA300F02853FD66E4A9D3';
const expr = process.argv.slice(2).join(' ');
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/' + pageId, {handshakeTimeout:5000});
let seq = 0;
const pending = new Map();
ws.on('message', (data) => {
  let msg;
  try { msg = JSON.parse(data); } catch { return; }
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
ws.on('open', () => {
  const callId = ++seq;
  pending.set(callId, (msg) => {
    if (msg.error) { console.error(JSON.stringify(msg.error)); process.exitCode = 1; }
    else if (msg.result.exceptionDetails) {
      console.error('EXC:', JSON.stringify(msg.result.exceptionDetails.exception && msg.result.exceptionDetails.exception.description || msg.result.exceptionDetails));
      try { ws.close(); } catch {}
    }
    else if (msg.result && msg.result.result) {
      const r = msg.result.result;
      console.log(r.value !== undefined ? (typeof r.value === 'string' ? r.value : JSON.stringify(r.value)) : JSON.stringify(msg.result));
    }
    try { ws.close(); } catch {}
  });
  ws.send(JSON.stringify({id:callId, method:'Runtime.evaluate', params:{expression:expr||'EXPR_MISSING', returnByValue:true, awaitPromise:true}}));
  setTimeout(() => { console.error('CDP timeout'); process.exitCode = 2; try { ws.close(); } catch {} }, 9000);
});
ws.on('error', (e) => { console.error('WSERR', e.message); process.exitCode = 1; });
