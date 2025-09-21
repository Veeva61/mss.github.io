const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('connect', socket.id);

  socket.on('join-room', ({ room, name }) => {
    socket.join(room);
    socket.data.name = name || socket.id;
    socket.to(room).emit('user-joined', { id: socket.id, name: socket.data.name });
  });

  socket.on('chat-message', ({ room, msg, name }) => {
    io.to(room).emit('chat-message', { id: socket.id, msg, name });
  });

  socket.on('webrtc-offer', ({ room, offer, to }) => {
    if (to) io.to(to).emit('webrtc-offer', { from: socket.id, offer });
    else socket.to(room).emit('webrtc-offer', { from: socket.id, offer });
  });
  socket.on('webrtc-answer', ({ to, answer }) => {
    io.to(to).emit('webrtc-answer', { from: socket.id, answer });
  });
  socket.on('webrtc-ice', ({ to, candidate }) => {
    if (to) io.to(to).emit('webrtc-ice', { from: socket.id, candidate });
    else socket.broadcast.emit('webrtc-ice', { from: socket.id, candidate });
  });

  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(room => socket.to(room).emit('user-left', { id: socket.id }));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server listening on', PORT));
