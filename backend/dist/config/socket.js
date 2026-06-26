"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // adjust in production
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        },
    });
    io.on('connection', (socket) => {
        console.log('Un utilisateur s\'est connecté (Socket.IO):', socket.id);
        // The user can join a room with their user ID so we can emit directly to them
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`Socket ${socket.id} a rejoint la room: ${userId}`);
        });
        socket.on('disconnect', () => {
            console.log('Utilisateur déconnecté:', socket.id);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io n\'est pas initialisé!');
    }
    return io;
};
exports.getIO = getIO;
