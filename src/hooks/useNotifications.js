import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';

export function useNotifications(userId) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));

            // Ordenação no cliente para evitar necessidade de índice composto
            notifs.sort((a, b) => b.createdAt - a.createdAt);

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar notificações:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const markAsRead = async (notificationId) => {
        try {
            const notifRef = doc(db, 'notifications', notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error("Erro ao marcar como lida:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            const unreadNotifs = notifications.filter(n => !n.read);

            unreadNotifs.forEach(notif => {
                const notifRef = doc(db, 'notifications', notif.id);
                batch.update(notifRef, { read: true });
            });

            if (unreadNotifs.length > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error("Erro ao marcar todas como lidas:", error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            const batch = writeBatch(db);
            notifications.forEach(notif => {
                const notifRef = doc(db, 'notifications', notif.id);
                batch.delete(notifRef);
            });

            if (notifications.length > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error("Erro ao limpar notificações:", error);
        }
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead, clearAllNotifications };
}
