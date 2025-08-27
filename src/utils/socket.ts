import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { chatService } from '../services/ChatService';

interface AuthenticatedSocket extends Socket {
    userId: string;
    userRole: string;
    userName: string;
}

export const setupSocket = (server: any) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket: any, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET as string
            ) as any;
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            socket.userName = decoded.name || 'Unknown';
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    const onlineUsers = new Map();

    io.on('connection', (socket: any) => {
        console.log(
            `User ${socket.userName} (${socket.userRole}) connected with ID: ${socket.id}`
        );

        onlineUsers.set(socket.userId, {
            socketId: socket.id,
            userId: socket.userId,
            userName: socket.userName,
            userRole: socket.userRole
        });

        socket.join(socket.userId);

        socket.broadcast.emit('user-online', {
            userId: socket.userId,
            userName: socket.userName,
            userRole: socket.userRole
        });

        socket.emit('online-users', Array.from(onlineUsers.values()));

        socket.on('join-chat-room', async (data: { roomId: string }) => {
            try {
                console.log(
                    `User ${socket.userName} trying to join room: ${data.roomId}`
                );
                const { db } = require('../utils/firebase');

                const roomDoc = await db
                    .collection('chatRooms')
                    .doc(data.roomId)
                    .get();

                if (!roomDoc.exists) {
                    socket.emit('error', { message: 'Chat room not found' });
                    return;
                }

                const roomData = roomDoc.data();
                if (
                    roomData?.ownerId !== socket.userId &&
                    roomData?.employeeId !== socket.userId
                ) {
                    socket.emit('error', {
                        message: 'Unauthorized access to chat room'
                    });
                    return;
                }

                socket.join(data.roomId);
                socket.currentRoom = data.roomId;
                socket.emit('joined-chat-room', { roomId: data.roomId });

                await chatService.markMessagesAsRead(
                    data.roomId,
                    socket.userId
                );

                socket.to(data.roomId).emit('user-joined-room', {
                    userId: socket.userId,
                    userName: socket.userName
                });

                console.log(
                    `User ${socket.userName} successfully joined room: ${data.roomId}`
                );
            } catch (error: any) {
                console.error('Error joining chat room:', error);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on(
            'send-message',
            async (data: { roomId: string; message: string }) => {
                try {
                    if (!data.message || data.message.trim().length === 0) {
                        socket.emit('error', {
                            message: 'Message cannot be empty'
                        });
                        return;
                    }

                    console.log(
                        `User ${socket.userName} sending message to room ${data.roomId}: ${data.message}`
                    );

                    const result = await chatService.sendMessage(
                        data.roomId,
                        socket.userId,
                        data.message
                    );

                    io.to(data.roomId).emit('new-message', result);

                    const { db } = require('../utils/firebase');
                    const roomDoc = await db
                        .collection('chatRooms')
                        .doc(data.roomId)
                        .get();
                    const roomData = roomDoc.data();

                    const recipientId =
                        roomData?.ownerId === socket.userId
                            ? roomData?.employeeId
                            : roomData?.ownerId;

                    if (recipientId) {
                        io.to(recipientId).emit('message-notification', {
                            roomId: data.roomId,
                            senderName: socket.userName,
                            senderRole: socket.userRole,
                            message: data.message,
                            timestamp: result.timestamp
                        });
                    }

                    console.log(
                        `Message sent successfully from ${socket.userName} in room ${data.roomId}`
                    );
                } catch (error: any) {
                    console.error('Error sending message:', error);
                    socket.emit('error', { message: error.message });
                }
            }
        );

        socket.on('leave-chat-room', (data: { roomId: string }) => {
            socket.leave(data.roomId);
            socket.currentRoom = null;
            socket.emit('left-chat-room', { roomId: data.roomId });

            socket.to(data.roomId).emit('user-left-room', {
                userId: socket.userId,
                userName: socket.userName
            });

            console.log(`User ${socket.userName} left room: ${data.roomId}`);
        });

        socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
            socket.to(data.roomId).emit('user-typing', {
                userId: socket.userId,
                userName: socket.userName,
                isTyping: data.isTyping
            });
        });

        socket.on('mark-as-read', async (data: { roomId: string }) => {
            try {
                await chatService.markMessagesAsRead(
                    data.roomId,
                    socket.userId
                );
                socket.emit('messages-marked-read', { roomId: data.roomId });

                socket.to(data.roomId).emit('messages-read-by-user', {
                    userId: socket.userId,
                    userName: socket.userName,
                    roomId: data.roomId
                });
            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('get-unread-count', async () => {
            try {
                const result = await chatService.getUnreadCount(socket.userId);
                socket.emit('unread-count', result);
            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User ${socket.userName} disconnected`);

            onlineUsers.delete(socket.userId);

            socket.broadcast.emit('user-offline', {
                userId: socket.userId,
                userName: socket.userName
            });

            if (socket.currentRoom) {
                socket.to(socket.currentRoom).emit('user-left-room', {
                    userId: socket.userId,
                    userName: socket.userName
                });
            }
        });
    });

    return io;
};
