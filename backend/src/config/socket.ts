import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // adjust in production
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté (Socket.IO):', socket.id);
    
    // The user can join a room with their user ID so we can emit directly to them
    socket.on('join', (userId: string) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} a rejoint la room: ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Utilisateur déconnecté:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io n\'est pas initialisé!');
  }
  return io;
};
