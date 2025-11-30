import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    setDoc,
    doc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    getDoc,
    increment,
    deleteDoc,
    limit
} from 'firebase/firestore';

// Hook para listar as conversas do usuário
export function useUserChats(userId) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setChats([]);
            setLoading(false);
            return;
        }

        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenar no cliente para evitar necessidade de índice composto no Firestore
            chatsData.sort((a, b) => {
                const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt ? Date.now() : 0);
                const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt ? Date.now() : 0);
                return timeB - timeA;
            });

            setChats(chatsData);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar chats:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { chats, loading };
}

// Hook para contar total de mensagens não lidas
export function useUnreadChatCount(userId) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) {
            setUnreadCount(0);
            return;
        }

        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let total = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.unreadCounts && data.unreadCounts[userId]) {
                    total += data.unreadCounts[userId];
                }
            });
            setUnreadCount(total);
        });

        return () => unsubscribe();
    }, [userId]);

    return unreadCount;
}

// Hook para listar mensagens de um chat específico
export function useChatMessages(chatId) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        // Aqui orderBy é seguro pois é uma subcoleção simples
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar mensagens:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    return { messages, loading };
}

// Funções de ação do chat
export const chatActions = {
    // Enviar mensagem
    sendMessage: async (chatId, content, senderId, recipientId, replyTo = null) => {
        if (!content.trim()) return;

        const chatRef = doc(db, 'chats', chatId);
        const messagesRef = collection(chatRef, 'messages');

        try {
            // 1. Adicionar mensagem na subcoleção
            const messageData = {
                senderId,
                content,
                timestamp: serverTimestamp(),
                read: false
            };

            if (replyTo) {
                messageData.replyTo = {
                    id: replyTo.id,
                    content: replyTo.content,
                    senderId: replyTo.senderId
                };
            }

            await addDoc(messagesRef, messageData);

            // 2. Atualizar o documento do chat (lastMessage, timestamp e unreadCounts)
            // Usamos setDoc com merge para garantir que campos faltantes (em chats antigos) sejam criados
            const updateData = {
                lastMessage: content,
                updatedAt: serverTimestamp(),
                unreadCounts: {
                    [recipientId]: increment(1)
                }
            };

            await setDoc(chatRef, updateData, { merge: true });

        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            throw error;
        }
    },

    // Deletar mensagem (Soft Delete para manter histórico)
    deleteMessage: async (chatId, messageId) => {
        if (!chatId || !messageId) return;

        const chatRef = doc(db, 'chats', chatId);
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);

        try {
            // 1. Soft Delete: Marcar como deletada e limpar conteúdo visível
            await updateDoc(messageRef, {
                deletedAt: serverTimestamp(),
                content: "🚫 Mensagem apagada", // Opcional: manter texto original em outro campo se auditoria for necessária
                isDeleted: true
            });

            // 2. Atualizar lastMessage do Chat
            // Precisamos buscar a última mensagem válida para atualizar o chat
            const messagesRef = collection(chatRef, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));

            // Nota: Como acabamos de atualizar a mensagem atual para "Mensagem apagada", 
            // ela ainda será a última se for a mais recente. 
            // Se quisermos que o chat mostre "Mensagem apagada" no preview, isso já resolve.
            // Se quisermos que mostre a PENÚLTIMA mensagem, a lógica seria mais complexa.
            // Assumindo que "Mensagem apagada" é um status válido para o preview.

            // Atualizamos o lastMessage para refletir que foi apagada
            await updateDoc(chatRef, {
                lastMessage: "🚫 Mensagem apagada",
                updatedAt: serverTimestamp()
            });

        } catch (error) {
            console.error("Erro ao deletar mensagem:", error);
            throw error;
        }
    },

    // Marcar chat como lido (zerar contador do usuário)
    markChatAsRead: async (chatId, userId) => {
        if (!chatId || !userId) return;

        const chatRef = doc(db, 'chats', chatId);
        try {
            await setDoc(chatRef, {
                unreadCounts: {
                    [userId]: 0
                }
            }, { merge: true });
        } catch (error) {
            console.error("Erro ao marcar como lido:", error);
        }
    },

    // Criar ou obter chat existente
    createOrGetChat: async (currentUserId, friendId) => {
        // ID determinístico para garantir chat único entre 2 usuários
        const sortedIds = [currentUserId, friendId].sort();
        const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
        const chatRef = doc(db, 'chats', chatId);

        try {
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                // Criar novo chat se não existir
                await setDoc(chatRef, {
                    participants: [currentUserId, friendId],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastMessage: '',
                    unreadCounts: {
                        [currentUserId]: 0,
                        [friendId]: 0
                    }
                });
            }

            return chatId;
        } catch (error) {
            console.error("Erro ao criar/obter chat:", error);
            throw error;
        }
    }
};
