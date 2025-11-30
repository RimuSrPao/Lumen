import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { createNotification } from '../services/notificationService';

export function useFriendship(targetUserId) {
    const [friendshipStatus, setFriendshipStatus] = useState('none'); // 'none', 'pending_sent', 'pending_received', 'accepted'
    const [friendshipId, setFriendshipId] = useState(null);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;

    // Monitorar status da amizade
    useEffect(() => {
        if (!currentUser || !targetUserId || currentUser.uid === targetUserId) {
            setLoading(false);
            return;
        }

        // Usar query para encontrar a amizade independentemente do ID do documento
        const friendshipsRef = collection(db, 'friendships');
        const q = query(friendshipsRef, where('users', 'array-contains', currentUser.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const friendshipDoc = snapshot.docs.find(doc => {
                const data = doc.data();
                return data.users && data.users.includes(targetUserId);
            });

            if (friendshipDoc) {
                const data = friendshipDoc.data();
                setFriendshipId(friendshipDoc.id);

                if (data.status === 'accepted') {
                    setFriendshipStatus('accepted');
                } else if (data.status === 'pending') {
                    if (data.requesterId === currentUser.uid) {
                        setFriendshipStatus('pending_sent');
                    } else {
                        setFriendshipStatus('pending_received');
                    }
                }
            } else {
                setFriendshipStatus('none');
                setFriendshipId(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, targetUserId]);

    const sendFriendRequest = async () => {
        if (!currentUser || !targetUserId) return;

        const uids = [currentUser.uid, targetUserId].sort();
        const docId = `${uids[0]}_${uids[1]}`;
        const friendshipRef = doc(db, 'friendships', docId);

        try {
            await import('firebase/firestore').then(({ setDoc }) => {
                return setDoc(friendshipRef, {
                    users: uids,
                    requesterId: currentUser.uid,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            // Criar notificação
            await createNotification({
                type: 'friend_request',
                recipientId: targetUserId,
                content: 'enviou uma solicitação de amizade.',
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
                senderAvatar: currentUser.photoURL,
                friendshipId: docId
            });

        } catch (error) {
            console.error("Erro ao enviar solicitação de amizade:", error);
            throw error;
        }
    };

    const acceptFriendRequest = async () => {
        if (!friendshipId) return;
        const friendshipRef = doc(db, 'friendships', friendshipId);

        try {
            await updateDoc(friendshipRef, {
                status: 'accepted',
                updatedAt: serverTimestamp()
            });

            // Notificar quem enviou o pedido que foi aceito
            await createNotification({
                type: 'friend_accepted', // Novo tipo para diferenciar
                recipientId: targetUserId, // O target agora é quem enviou o pedido original
                content: 'aceitou sua solicitação de amizade.',
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
                senderAvatar: currentUser.photoURL,
                friendshipId: friendshipId
            });

        } catch (error) {
            console.error("Erro ao aceitar solicitação:", error);
            throw error;
        }
    };

    const rejectFriendRequest = async () => {
        if (!friendshipId) return;
        const friendshipRef = doc(db, 'friendships', friendshipId);

        try {
            await deleteDoc(friendshipRef);
        } catch (error) {
            console.error("Erro ao recusar solicitação:", error);
            throw error;
        }
    };

    const cancelFriendRequest = async () => {
        if (!friendshipId) return;
        const friendshipRef = doc(db, 'friendships', friendshipId);

        try {
            await deleteDoc(friendshipRef);
        } catch (error) {
            console.error("Erro ao cancelar solicitação:", error);
            throw error;
        }
    };

    const removeFriend = async () => {
        if (!friendshipId) return;
        const friendshipRef = doc(db, 'friendships', friendshipId);

        try {
            await deleteDoc(friendshipRef);
        } catch (error) {
            console.error("Erro ao desfazer amizade:", error);
            throw error;
        }
    };

    return {
        friendshipStatus,
        loading,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        cancelFriendRequest,
        removeFriend
    };
}
