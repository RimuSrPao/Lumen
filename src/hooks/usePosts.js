import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    limit,
    where,
    getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { compressImage } from '../utils/compressImage';
import { createNotification } from '../services/notificationService';

export function usePosts(userId = null, filterUsers = null) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Realtime Posts Listener
    useEffect(() => {
        let q;
        if (userId) {
            // Se userId for fornecido, filtra pelos posts desse usuário
            // REMOVIDO orderBy para evitar erro de índice composto no Firestore
            // A ordenação será feita no cliente (JavaScript)
            q = query(
                collection(db, "posts"),
                where("author.uid", "==", userId),
                limit(20)
            );
        } else if (filterUsers && filterUsers.length > 0) {
            // Filtro por múltiplos usuários (Feed de Amigos)
            // Firestore limita 'in' a 10 valores. Pegamos os 10 primeiros para MVP.
            // Para produção real, seria necessário outra estratégia (ex: fan-out).
            const safeFilter = filterUsers.slice(0, 10);
            q = query(
                collection(db, "posts"),
                where("author.uid", "in", safeFilter),
                limit(20)
            );
        } else {
            // Caso contrário, busca o feed geral (índice simples já existe)
            q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                limit(20)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenação no cliente para garantir ordem cronológica correta
            // especialmente importante quando não usamos orderBy na query
            fetchedPosts.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA; // Decrescente
            });

            setPosts(fetchedPosts);
            setLoading(false);
        }, (err) => {
            console.error("Erro ao buscar posts:", err);
            setError(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId, filterUsers ? filterUsers.join(',') : null]);

    const createPost = async (text, imageFile, user) => {
        if (!text.trim() && !imageFile) return;

        try {
            let imageUrl = null;

            if (imageFile) {
                const compressedFile = await compressImage(imageFile, 1920, 1920, 0.7);

                const formData = new FormData();
                formData.append('file', compressedFile);
                formData.append('upload_preset', 'lumen_uploads');

                const response = await fetch('https://api.cloudinary.com/v1_1/dasntpbd3/image/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Falha no upload da imagem');
                }

                const data = await response.json();
                imageUrl = data.secure_url;
            }

            const postRef = await addDoc(collection(db, "posts"), {
                text: text,
                imageUrl: imageUrl,
                author: {
                    uid: auth.currentUser.uid,
                    name: auth.currentUser.displayName || user.displayName || 'Usuário',
                    avatar: auth.currentUser.photoURL || user.photoURL || null
                },
                createdAt: serverTimestamp(),
                likes: [],
                comments: []
            });

            // Notificar amigos
            try {
                const friendshipsRef = collection(db, 'friendships');
                const q = query(
                    friendshipsRef,
                    where('users', 'array-contains', auth.currentUser.uid)
                );
                const snapshot = await getDocs(q);

                const acceptedFriendships = snapshot.docs.filter(doc => doc.data().status === 'accepted');

                const notificationPromises = acceptedFriendships.map(async (friendshipDoc) => {
                    const data = friendshipDoc.data();
                    const friendId = data.users.find(uid => uid !== auth.currentUser.uid);

                    if (friendId) {
                        return createNotification({
                            recipientId: friendId,
                            senderId: auth.currentUser.uid,
                            senderName: auth.currentUser.displayName || user.displayName || 'Usuário',
                            senderAvatar: auth.currentUser.photoURL || user.photoURL,
                            type: 'friend_post',
                            postId: postRef.id,
                            content: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : 'postou uma nova foto'
                        });
                    }
                });

                await Promise.all(notificationPromises);
            } catch (notifError) {
                console.error("Erro ao notificar amigos:", notifError);
                // Não falhar a criação do post se a notificação falhar
            }

            return true;
        } catch (err) {
            console.error("Erro ao criar post:", err);
            throw err;
        }
    };

    const deletePost = async (postId) => {
        try {
            await deleteDoc(doc(db, "posts", postId));
        } catch (err) {
            console.error("Erro ao excluir post:", err);
            throw err;
        }
    };

    const editPost = async (postId, newText, newImageFile, currentImageUrl) => {
        try {
            let finalImageUrl = currentImageUrl;

            if (newImageFile) {
                const compressedFile = await compressImage(newImageFile, 1920, 1920, 0.7);

                const formData = new FormData();
                formData.append('file', compressedFile);
                formData.append('upload_preset', 'lumen_uploads');

                const response = await fetch('https://api.cloudinary.com/v1_1/dasntpbd3/image/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Falha no upload da imagem');
                }

                const data = await response.json();
                finalImageUrl = data.secure_url;
            }

            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, {
                text: newText,
                imageUrl: finalImageUrl,
                editedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Erro ao editar post:", err);
            throw err;
        }
    };

    const toggleLike = async (postId, likes, userId, postAuthorId, postContent) => {
        const postRef = doc(db, "posts", postId);
        const isLiked = likes.includes(userId);

        if (isLiked) {
            await updateDoc(postRef, {
                likes: arrayRemove(userId)
            });
        } else {
            await updateDoc(postRef, {
                likes: arrayUnion(userId)
            });

            // Criar notificação
            if (postAuthorId && postAuthorId !== userId) {
                const currentUser = auth.currentUser;
                await createNotification({
                    recipientId: postAuthorId,
                    senderId: userId,
                    senderName: currentUser.displayName || 'Usuário',
                    senderAvatar: currentUser.photoURL,
                    type: 'like',
                    postId: postId,
                    content: postContent ? (postContent.length > 50 ? postContent.substring(0, 50) + '...' : postContent) : 'seu post'
                });
            }
        }
    };

    return {
        posts,
        loading,
        error,
        createPost,
        deletePost,
        editPost,
        toggleLike
    };
}
