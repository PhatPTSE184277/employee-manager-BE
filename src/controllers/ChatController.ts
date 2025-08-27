import { Request, Response } from 'express';
import { chatService } from '../services/ChatService';
import { db } from '../utils/firebase';

export const getOrCreateChatRoom = async (req: Request, res: Response) => {
    try {
        const { ownerId, employeeId } = req.body;
        const currentUserId = (req as any).user.userId;
        const currentUserRole = (req as any).user.role;

        if (currentUserRole === 'employee') {
            const ownerQuery = await db
                .collection('users')
                .where('role', '==', 'owner')
                .limit(1)
                .get();

            if (ownerQuery.empty) {
                return res.status(404).json({
                    success: false,
                    message: 'No owner found in the system'
                });
            }

            const ownerDoc = ownerQuery.docs[0];
            const autoOwnerId = ownerDoc.id;

            const room = await chatService.getOrCreateChatRoom(
                autoOwnerId,
                currentUserId
            );
            
            return res.status(200).json({
                success: true,
                data: room,
                message: 'Chat room created successfully'
            });
        }

        if (currentUserRole === 'owner') {
            if (!employeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'employeeId is required for owner'
                });
            }

            const room = await chatService.getOrCreateChatRoom(
                currentUserId,
                employeeId
            );
            
            return res.status(200).json({
                success: true,
                data: room,
                message: 'Chat room created successfully'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Invalid user role'
        });

    } catch (error: any) {
        console.error('Error creating chat room:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create chat room'
        });
    }
};

export const getChatRooms = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.userId;

        const rooms = await chatService.getChatRooms(currentUserId);

        res.status(200).json({
            success: true,
            data: rooms,
            message: 'Chat rooms retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting chat rooms:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get chat rooms'
        });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const { page = 1, pageSize = 50 } = req.query;

        const currentUserId = (req as any).user.userId;

        const messages = await chatService.getMessages(
            roomId,
            currentUserId,
            parseInt(page as string),
            parseInt(pageSize as string)
        );

        res.status(200).json({
            success: true,
            data: messages,
            message: 'Messages retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting messages:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get messages'
        });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        const currentUserId = (req as any).user.userId;

        const savedMessage = await chatService.sendMessage(
            roomId,
            currentUserId,
            message
        );

        res.status(201).json({
            success: true,
            data: savedMessage,
            message: 'Message sent successfully'
        });
    } catch (error: any) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send message'
        });
    }
};

export const markMessagesAsRead = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const currentUserId = (req as any).user.userId;

        await chatService.markMessagesAsRead(roomId, currentUserId);

        res.status(200).json({
            success: true,
            message: 'Messages marked as read successfully'
        });
    } catch (error: any) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark messages as read'
        });
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.userId;

        const result = await chatService.getUnreadCount(currentUserId);

        res.status(200).json({
            success: true,
            data: result,
            message: 'Unread count retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get unread count'
        });
    }
};

export const getChatRoomById = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const currentUserId = (req as any).user.userId;

        const roomDoc = await db.collection('chatRooms').doc(roomId).get();

        if (!roomDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }

        const roomData = roomDoc.data();

        if (
            roomData?.ownerId !== currentUserId &&
            roomData?.employeeId !== currentUserId
        ) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this chat room'
            });
        }

        const room = {
            id: roomDoc.id,
            ...roomData
        };

        res.status(200).json({
            success: true,
            data: room,
            message: 'Chat room details retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error getting chat room details:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get chat room details'
        });
    }
};