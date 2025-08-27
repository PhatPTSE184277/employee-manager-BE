import { db } from '../utils/firebase';

interface ChatMessage {
    id?: string;
    roomId: string;
    senderId: string;
    senderName: string;
    senderRole: 'owner' | 'employee';
    message: string;
    timestamp: number;
    isRead: boolean;
}

interface ChatRoom {
    id?: string;
    ownerId: string;
    employeeId: string;
    ownerName: string;
    employeeName: string;
    lastMessage?: string;
    lastMessageTime?: number;
    unreadCount?: number;
    createdAt: number;
    updatedAt: number;
}

const getOrCreateChatRoom = async (ownerId: string, employeeId: string) => {
    try {
        const roomQuery = await db
            .collection('chatRooms')
            .where('ownerId', '==', ownerId)
            .where('employeeId', '==', employeeId)
            .get();

        if (!roomQuery.empty) {
            const roomDoc = roomQuery.docs[0];
            return {
                id: roomDoc.id,
                ...roomDoc.data()
            };
        }

        const [ownerDoc, employeeDoc] = await Promise.all([
            db.collection('users').doc(ownerId).get(),
            db.collection('users').doc(employeeId).get()
        ]);

        if (!ownerDoc.exists || !employeeDoc.exists) {
            throw new Error('Owner or Employee not found');
        }

        const ownerData = ownerDoc.data();
        const employeeData = employeeDoc.data();

        if (ownerData?.role !== 'owner' || employeeData?.role !== 'employee') {
            throw new Error('Invalid user roles for chat');
        }

        const roomData: ChatRoom = {
            ownerId,
            employeeId,
            ownerName: ownerData.name || 'Owner',
            employeeName: employeeData.name || 'Employee',
            unreadCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const roomRef = await db.collection('chatRooms').add(roomData);

        return {
            id: roomRef.id,
            ...roomData
        };
    } catch (error) {
        console.error('Error in getOrCreateChatRoom:', error);
        throw error;
    }
};

const sendMessage = async (
    roomId: string,
    senderId: string,
    message: string
) => {
    try {
        const roomDoc = await db.collection('chatRooms').doc(roomId).get();
        if (!roomDoc.exists) {
            throw new Error('Chat room not found');
        }

        const roomData = roomDoc.data();

        if (
            roomData?.ownerId !== senderId &&
            roomData?.employeeId !== senderId
        ) {
            throw new Error(
                'You are not authorized to send messages in this room'
            );
        }

        const senderDoc = await db.collection('users').doc(senderId).get();
        if (!senderDoc.exists) {
            throw new Error('Sender not found');
        }

        const senderData = senderDoc.data();

        const messageData: ChatMessage = {
            roomId,
            senderId,
            senderName: senderData?.name || 'Unknown',
            senderRole: senderData?.role,
            message: message.trim(),
            timestamp: Date.now(),
            isRead: false
        };

        const messageRef = await db.collection('chatMessages').add(messageData);

        await db
            .collection('chatRooms')
            .doc(roomId)
            .update({
                lastMessage: message.trim(),
                lastMessageTime: Date.now(),
                unreadCount: (roomData?.unreadCount || 0) + 1,
                updatedAt: Date.now()
            });

        return {
            id: messageRef.id,
            ...messageData
        };
    } catch (error) {
        console.error('Error in sendMessage:', error);
        throw error;
    }
};

const getMessages = async (
    roomId: string,
    userId: string,
    page: number = 1,
    pageSize: number = 50
) => {
    try {
        const roomDoc = await db.collection('chatRooms').doc(roomId).get();
        if (!roomDoc.exists) {
            throw new Error('Chat room not found');
        }

        const roomData = roomDoc.data();
        if (roomData?.ownerId !== userId && roomData?.employeeId !== userId) {
            throw new Error(
                'You are not authorized to view messages in this room'
            );
        }

        const messagesQuery = await db
            .collection('chatMessages')
            .where('roomId', '==', roomId)
            .orderBy('timestamp', 'desc')
            .limit(pageSize)
            .offset((page - 1) * pageSize)
            .get();

        const messages = messagesQuery.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            roomId,
            messages: messages.reverse(),
            page,
            pageSize,
            total: messages.length
        };
    } catch (error) {
        console.error('Error in getMessages:', error);
        throw error;
    }
};

const getChatRooms = async (userId: string) => {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        let roomsQuery;

        if (userData?.role === 'owner') {
            roomsQuery = db
                .collection('chatRooms')
                .where('ownerId', '==', userId);
        } else if (userData?.role === 'employee') {
            roomsQuery = db
                .collection('chatRooms')
                .where('employeeId', '==', userId);
        } else {
            throw new Error('Invalid user role');
        }

        const roomsSnapshot = await roomsQuery
            .orderBy('updatedAt', 'desc')
            .get();

        return roomsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error in getChatRooms:', error);
        throw error;
    }
};

const markMessagesAsRead = async (roomId: string, userId: string) => {
    try {
        const roomDoc = await db.collection('chatRooms').doc(roomId).get();
        if (!roomDoc.exists) {
            throw new Error('Chat room not found');
        }

        const roomData = roomDoc.data();
        if (roomData?.ownerId !== userId && roomData?.employeeId !== userId) {
            throw new Error('Unauthorized access');
        }

        const messagesQuery = await db
            .collection('chatMessages')
            .where('roomId', '==', roomId)
            .where('senderId', '!=', userId)
            .where('isRead', '==', false)
            .get();

        const batch = db.batch();
        messagesQuery.docs.forEach((doc) => {
            batch.update(doc.ref, { isRead: true });
        });

        batch.update(db.collection('chatRooms').doc(roomId), {
            unreadCount: 0
        });

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
        throw error;
    }
};

const getUnreadCount = async (userId: string) => {
    try {
        const rooms = await getChatRooms(userId);
        let totalUnread = 0;

        for (const room of rooms) {
            totalUnread += (room as any).unreadCount || 0;
        }

        return { totalUnread };
    } catch (error) {
        console.error('Error in getUnreadCount:', error);
        throw error;
    }
};

export const chatService = {
    getOrCreateChatRoom,
    sendMessage,
    getMessages,
    getChatRooms,
    markMessagesAsRead,
    getUnreadCount
};
