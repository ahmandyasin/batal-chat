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

function generateAnonymousNumber() {
  return Math.floor(1000 + Math.random() * 9000);
}

function pairUsers(socket, partnerSocket) {
  const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const socketNumber = generateAnonymousNumber();
  let partnerNumber = generateAnonymousNumber();
  while (partnerNumber === socketNumber) {
    partnerNumber = generateAnonymousNumber();
  }

  socket.join(roomId);
  partnerSocket.join(roomId);

  activePairs.set(socket.id, {
    partnerId: partnerSocket.id,
    roomId,
    yourNumber: socketNumber,
    partnerNumber,
  });

  activePairs.set(partnerSocket.id, {
    partnerId: socket.id,
    roomId,
    yourNumber: partnerNumber,
    partnerNumber: socketNumber,
  });

  socket.emit('matched', { yourNumber: socketNumber, partnerNumber });
  partnerSocket.emit('matched', { yourNumber: partnerNumber, partnerNumber: socketNumber });
}

io.on('connection', (socket) => {
  broadcastOnlineCount();

  socket.on('find-partner', () => {
    const existingPair = activePairs.get(socket.id);
    if (existingPair && typeof existingPair.yourNumber === 'number') {
      socket.emit('matched', {
        yourNumber: existingPair.yourNumber,
        partnerNumber: existingPair.partnerNumber,
      });
      return;
    }

    removeFromQueue(socket.id);

    while (waitingQueue.length > 0) {
      const partnerId = waitingQueue.shift();
      if (partnerId === socket.id) continue;

      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (!partnerSocket) continue;

      pairUsers(socket, partnerSocket);
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

    socket.to(pair.roomId).emit('message', {
      text: trimmed,
      fromNumber: pair.yourNumber,
    });
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
