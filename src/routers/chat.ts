import { Router } from 'express';
import {
    getOrCreateChatRoom,
    getChatRooms,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    getUnreadCount,
    getChatRoomById
} from '../controllers/ChatController';
import { VerifyToken } from '../middlewares/VerifyToken';

const router = Router();

router.use(VerifyToken);

router.post('/rooms', getOrCreateChatRoom);
router.get('/rooms', getChatRooms);
router.get('/rooms/:roomId', getChatRoomById);

router.get('/rooms/:roomId/messages', getMessages);
router.post('/rooms/:roomId/messages', sendMessage);
router.patch('/rooms/:roomId/read', markMessagesAsRead);

router.get('/unread-count', getUnreadCount);

export default router;
