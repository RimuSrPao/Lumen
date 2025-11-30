import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createNotification = async ({
    recipientId,
    senderId,
    senderName,
    senderAvatar,
    type, // 'like', 'comment', 'reply'
    postId,
    commentId,
    friendshipId,
    content
}) => {
    if (!recipientId || !senderId || recipientId === senderId) return;

    try {
        await addDoc(collection(db, 'notifications'), {
            recipientId,
            senderId,
            senderName,
            senderAvatar,
            type,
            postId: postId || null,
            commentId: commentId || null,
            friendshipId: friendshipId || null,
            content: content || '',
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Erro ao criar notificação:", error);
    }
};
