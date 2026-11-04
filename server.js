// A JoJo's Game - servidor de emparejamiento + relé de entradas (WebSocket).  node server.js
const http = require('http');
const { WebSocketServer } = require('ws');

const PROTO = 1;                       // debe coincidir con Config.PROTOCOL de la app
const PORT = process.env.PORT || 8080;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const queue = [];                      // sockets en partida rápida
const rooms = new Map();               // código -> socket host

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`A JoJo's Game relay OK\nplayers: ${wss.clients.size}  queue: ${queue.length}  rooms: ${rooms.size}\n`);
});
const wss = new WebSocketServer({ server, maxPayload: 2048 });

const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
const code = () => { let c; do { c = Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * 32)]).join(''); } while (rooms.has(c)); return c; };

function drop(ws) {
  const i = queue.indexOf(ws); if (i >= 0) queue.splice(i, 1);
  if (ws.room && rooms.get(ws.room) === ws) rooms.delete(ws.room);
  if (ws.peer) { send(ws.peer, { t: 'left' }); ws.peer.peer = null; ws.peer = null; }
}

function pair(host, guest) {
  host.peer = guest; guest.peer = host;
  const room = host.room || code();
  send(host,  { t: 'matched', role: 0, room, char: guest.info.char, map: host.info.map });
  send(guest, { t: 'matched', role: 1, room, char: host.info.char,  map: host.info.map });
}

wss.on('connection', (ws) => {
  ws.isAlive = true; ws.peer = null; ws.room = null; ws.info = null;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data) => {
    const s = data.toString();
    if (s[0] === 'i' || s[0] === 'h') { if (ws.peer) ws.peer.send(s); return; }   // entradas / hashes: reenviar tal cual
    let m; try { m = JSON.parse(s); } catch { return; }
    if (m.t === 'bye') { drop(ws); return; }
    if (!['quick', 'create', 'join'].includes(m.t) || ws.info) return;
    if (m.proto !== PROTO) { send(ws, { t: 'err', msg: 'Update the game to play online' }); return; }
    ws.info = { char: String(m.char || 'shadow_dio').slice(0, 24), map: String(m.map || '').slice(0, 40) };
    if (m.t === 'quick') {
      const other = queue.shift();
      if (other && other.readyState === 1) pair(other, ws);
      else { queue.push(ws); send(ws, { t: 'queued' }); }
    } else if (m.t === 'create') {
      ws.room = code(); rooms.set(ws.room, ws); send(ws, { t: 'created', room: ws.room });
    } else {
      const host = rooms.get(String(m.room || '').toUpperCase());
      if (!host || host.peer || host.readyState !== 1) { ws.info = null; send(ws, { t: 'err', msg: 'Room not found or full' }); return; }
      rooms.delete(host.room); pair(host, ws);
    }
  });
  ws.on('close', () => drop(ws));
  ws.on('error', () => drop(ws));
});

setInterval(() => {                      // keepalive: cierra sockets muertos
  wss.clients.forEach((ws) => { if (!ws.isAlive) return ws.terminate(); ws.isAlive = false; ws.ping(); });
}, 25000);

server.listen(PORT, () => console.log('relay listening on ' + PORT));
