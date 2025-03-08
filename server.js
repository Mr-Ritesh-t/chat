const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store connected users with their details
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining with authentication
  socket.on('user_join', (userData) => {
    const userInfo = {
      id: socket.id,
      name: userData.name,
      email: userData.email
    };
    
    connectedUsers.set(socket.id, userInfo);
    console.log(`${userData.name} joined the chat`);
    
    // Broadcast updated users list
    io.emit('users_update', Array.from(connectedUsers.values()));
  });

  // Handle messages with user info
  socket.on('send_message', (messageData) => {
    const user = connectedUsers.get(socket.id);
    const enrichedMessage = {
      ...messageData,
      sender: user?.name || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString()
    };
    
    io.emit('receive_message', enrichedMessage);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    console.log(`User disconnected: ${user?.name || 'Anonymous'}`);
    connectedUsers.delete(socket.id);
    io.emit('users_update', Array.from(connectedUsers.values()));
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 