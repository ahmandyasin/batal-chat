const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: false },
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

/** @type {string[]} */
const waitingQueue = [];

/** @type {Map<string, { partnerId: string, roomId: string }>} */
const activePairs = new Map();

function getOnlineCount() {
  return io.sockets.sockets.size;
}

function broadcastOnlineCount() {
  io.emit('online-count', { count: getOnlineCount() });
}

function removeFromQueue(socketId) {
  const index = waitingQueue.indexOf(socketId);
  if (index !== -1) {
    waitingQueue.splice(index, 1);
  }
}

function notifyPartnerDisconnected(partnerId) {
  const partnerSocket = io.sockets.sockets.get(partnerId);
  if (partnerSocket) {
    partnerSocket.emit('partner-disconnected');
  }
}

function cleanupPair(socketId) {
  const pair = activePairs.get(socketId);
  if (!pair) return;

  activePairs.delete(socketId);
  activePairs.delete(pair.partnerId);

  const socket = io.sockets.sockets.get(socketId);
  const partnerSocket = io.sockets.sockets.get(pair.partnerId);

  if (socket) socket.leave(pair.roomId);
  if (partnerSocket) partnerSocket.leave(pair.roomId);
}

io.on('connection', (socket) => {
  broadcastOnlineCount();

  socket.on('find-partner', () => {
    if (activePairs.has(socket.id)) {
      socket.emit('already-connected');
      return;
    }

    removeFromQueue(socket.id);

    while (waitingQueue.length > 0) {
      const partnerId = waitingQueue.shift();
      if (partnerId === socket.id) continue;

      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (!partnerSocket) continue;

      const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      socket.join(roomId);
      partnerSocket.join(roomId);

      activePairs.set(socket.id, { partnerId, roomId });
      activePairs.set(partnerId, { partnerId: socket.id, roomId });

      socket.emit('matched');
      partnerSocket.emit('matched');
      return;
    }

    waitingQueue.push(socket.id);
    socket.emit('waiting');
  });

  socket.on('message', (text) => {
    const pair = activePairs.get(socket.id);
    if (!pair || typeof text !== 'string') return;

    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 2000) return;

    socket.to(pair.roomId).emit('message', { text: trimmed });
  });

  socket.on('leave-chat', () => {
    const pair = activePairs.get(socket.id);
    if (pair) {
      notifyPartnerDisconnected(pair.partnerId);
      cleanupPair(socket.id);
    }
    removeFromQueue(socket.id);
  });

  socket.on('disconnect', () => {
    removeFromQueue(socket.id);

    const pair = activePairs.get(socket.id);
    if (pair) {
      notifyPartnerDisconnected(pair.partnerId);
      cleanupPair(socket.id);
    }

    setImmediate(broadcastOnlineCount);
  });
});

server.listen(PORT, () => {
  console.log(`Batal chat server running at http://localhost:${PORT}`);
});
