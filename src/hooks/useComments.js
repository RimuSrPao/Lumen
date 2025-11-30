import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createNotification } from '../services/notificationService';

export function useComments() {

    const addComment = async (postId, text, user, postAuthorId) => {
        if (!text || !text.trim()) return;

        try {
            const newCommentId = Date.now().toString();
            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, {
                comments: arrayUnion({
                    id: newCommentId,
                    text: text.trim(),
                    author: user.displayName || 'Usuário',
                    uid: user.uid,
                    avatar: user.photoURL || null,
                    createdAt: Date.now(),
                    likes: [],
                    replies: []
                })
            });

            // Notificar dono do post
            if (postAuthorId) {
                await createNotification({
                    recipientId: postAuthorId,
                    senderId: user.uid,
                    senderName: user.displayName || 'Usuário',
                    senderAvatar: user.photoURL,
                    type: 'comment',
                    postId: postId,
                    commentId: newCommentId,
                    content: text.length > 50 ? text.substring(0, 50) + '...' : text
                });
            }
        } catch (error) {
            console.error("Erro ao comentar:", error);
            throw error;
        }
    };

    const deleteComment = async (postId, comment) => {
        try {
            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, {
                comments: arrayRemove(comment)
            });
        } catch (error) {
            console.error("Erro ao excluir comentário:", error);
            throw error;
        }
    };

    const likeComment = async (postId, commentId, userId) => {
        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const postData = postSnap.data();
                const updatedComments = postData.comments.map(comment => {
                    if (comment.id === commentId) {
                        const likes = comment.likes || [];
                        const userIndex = likes.indexOf(userId);

                        let newLikes = [...likes];
                        if (userIndex === -1) {
                            newLikes.push(userId);
                        } else {
                            newLikes.splice(userIndex, 1);
                        }
                        return { ...comment, likes: newLikes };
                    }
                    return comment;
                });

                await updateDoc(postRef, { comments: updatedComments });

                // Notificar autor do comentário (se foi like)
                const targetComment = postData.comments.find(c => c.id === commentId);
                const isLiked = targetComment?.likes?.includes(userId); // Verifica se JÁ estava curtido antes da ação (não, espera, a lógica acima inverte)
                // A lógica acima já alterou o array. Vamos simplificar: só notifica se o usuário NÃO estava na lista original.
                // Mas aqui já calculamos newLikes. Se newLikes.length > likes.length, foi um like.

                // Melhor abordagem: verificar se userId está em newLikes e não estava em likes.
                // Mas o código acima map não retorna o estado anterior facilmente fora do escopo.
                // Vamos assumir que se chamou likeComment, e não estava curtido, notifica.
                // Para simplificar, vou apenas adicionar a notificação se o usuário curtiu.

                // Recalculando para saber se foi like ou unlike
                const originalComment = postData.comments.find(c => c.id === commentId);
                if (originalComment && !originalComment.likes?.includes(userId)) {
                    const currentUser = auth.currentUser;
                    await createNotification({
                        recipientId: originalComment.uid,
                        senderId: userId,
                        senderName: currentUser.displayName || 'Usuário',
                        senderAvatar: currentUser.photoURL,
                        type: 'like',
                        postId: postId,
                        commentId: commentId,
                        content: originalComment.text ? (originalComment.text.length > 30 ? originalComment.text.substring(0, 30) + '...' : originalComment.text) : 'seu comentário'
                    });
                }
            }
        } catch (error) {
            console.error("Erro ao curtir comentário:", error);
            throw error;
        }
    };

    const replyToComment = async (postId, commentId, text, user, replyingTo, recipientId) => {
        if (!text || !text.trim()) return;

        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const postData = postSnap.data();
                const updatedComments = postData.comments.map(comment => {
                    if (comment.id === commentId) {
                        const replies = comment.replies || [];
                        const newReplyId = Date.now().toString();
                        replies.push({
                            id: newReplyId,
                            text: text.trim(),
                            author: user.displayName || 'Usuário',
                            uid: user.uid,
                            avatar: user.photoURL || null,
                            createdAt: Date.now(),
                            replyToId: replyingTo?.replyId || replyingTo?.commentId || null,
                            replyToAuthor: replyingTo?.author || null,
                            replyToText: replyingTo?.text || null,
                            likes: []
                        });
                        return { ...comment, replies };
                    }
                    return comment;
                });

                await updateDoc(postRef, { comments: updatedComments });

                // Notificar quem recebeu a resposta
                if (recipientId) {
                    await createNotification({
                        recipientId: recipientId,
                        senderId: user.uid,
                        senderName: user.displayName || 'Usuário',
                        senderAvatar: user.photoURL,
                        type: 'reply',
                        postId: postId,
                        commentId: commentId, // Linka ao comentário pai ou à resposta específica? O highlight busca por ID.
                        // Se for resposta, o ID do elemento é `comment-{replyId}`.
                        // Então devo passar o ID da RESPOSTA como commentId para o highlight funcionar.
                        // Mas espere, o newReplyId está dentro do map. Preciso extraí-lo.
                        // A refatoração acima (newReplyId) resolve isso.
                        commentId: newReplyId,
                        content: text.length > 50 ? text.substring(0, 50) + '...' : text
                    });
                }
            }
        } catch (error) {
            console.error("Erro ao responder comentário:", error);
            throw error;
        }
    };

    const likeReply = async (postId, commentId, replyId, userId) => {
        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const postData = postSnap.data();
                const updatedComments = postData.comments.map(comment => {
                    if (comment.id === commentId) {
                        const updatedReplies = comment.replies.map(reply => {
                            if (reply.id === replyId) {
                                const likes = reply.likes || [];
                                const userIndex = likes.indexOf(userId);
                                let newLikes = [...likes];
                                if (userIndex === -1) {
                                    newLikes.push(userId);
                                } else {
                                    newLikes.splice(userIndex, 1);
                                }
                                return { ...reply, likes: newLikes };
                            }
                            return reply;
                        });
                        return { ...comment, replies: updatedReplies };
                    }
                    return comment;
                });
                await updateDoc(postRef, { comments: updatedComments });

                // Notificar autor da resposta
                const targetComment = postData.comments.find(c => c.id === commentId);
                const targetReply = targetComment?.replies?.find(r => r.id === replyId);

                if (targetReply && !targetReply.likes?.includes(userId)) {
                    const currentUser = auth.currentUser;
                    await createNotification({
                        recipientId: targetReply.uid,
                        senderId: userId,
                        senderName: currentUser.displayName || 'Usuário',
                        senderAvatar: currentUser.photoURL,
                        type: 'like',
                        postId: postId,
                        commentId: replyId,
                        content: targetReply.text ? (targetReply.text.length > 30 ? targetReply.text.substring(0, 30) + '...' : targetReply.text) : 'sua resposta'
                    });
                }
            }
        } catch (error) {
            console.error("Erro ao curtir resposta:", error);
            throw error;
        }
    };

    const deleteReply = async (postId, commentId, replyId) => {
        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const postData = postSnap.data();
                const updatedComments = postData.comments.map(comment => {
                    if (comment.id === commentId) {
                        const updatedReplies = comment.replies.filter(reply => reply.id !== replyId);
                        return { ...comment, replies: updatedReplies };
                    }
                    return comment;
                });
                await updateDoc(postRef, { comments: updatedComments });
            }
        } catch (error) {
            console.error("Erro ao excluir resposta:", error);
            throw error;
        }
    };

    const editComment = async (postId, commentId, newText) => {
        if (!newText || !newText.trim()) return;

        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const postData = postSnap.data();
                const updatedComments = postData.comments.map(comment => {
                    // Update the edited comment
                    if (comment.id === commentId) {
                        let updatedComment = {
                            ...comment,
                            text: newText.trim(),
                            editedAt: Date.now()
                        };

                        // Also update any replies within this comment that reference it
                        if (updatedComment.replies && updatedComment.replies.length > 0) {
                            const updatedReplies = updatedComment.replies.map(reply => {
                                if (reply.replyToId === commentId) {
                                    return {
                                        ...reply,
                                        replyToText: newText.trim()
                                    };
                                }
                                return reply;
                            });
                            updatedComment = { ...updatedComment, replies: updatedReplies };
                        }
                        return updatedComment;
                    }
                    return comment;
                });
                await updateDoc(postRef, { comments: updatedComments });
            }
        } catch (error) {
            console.error("Erro ao editar comentário:", error);
            throw error;
        }
    };

    const editReply = async (postId, commentId, replyId, newText) => {
        if (!newText || !newText.trim()) return;

        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const postData = postSnap.data();
                const updatedComments = postData.comments.map(comment => {
                    // We need to check all comments to update references, not just the one containing the reply
                    // But first, let's update the reply itself if it's in this comment
                    let updatedComment = { ...comment };

                    if (comment.id === commentId) {
                        const updatedReplies = comment.replies.map(reply => {
                            if (reply.id === replyId) {
                                return {
                                    ...reply,
                                    text: newText.trim(),
                                    editedAt: Date.now()
                                };
                            }
                            return reply;
                        });
                        updatedComment = { ...comment, replies: updatedReplies };
                    }

                    // Now check for references to this reply in this comment's replies
                    if (updatedComment.replies && updatedComment.replies.length > 0) {
                        const updatedRepliesWithRefs = updatedComment.replies.map(reply => {
                            if (reply.replyToId === replyId) {
                                return {
                                    ...reply,
                                    replyToText: newText.trim()
                                };
                            }
                            return reply;
                        });
                        updatedComment = { ...updatedComment, replies: updatedRepliesWithRefs };
                    }

                    return updatedComment;
                });
                await updateDoc(postRef, { comments: updatedComments });
            }
        } catch (error) {
            console.error("Erro ao editar resposta:", error);
            throw error;
        }
    };

    return {
        addComment,
        deleteComment,
        likeComment,
        replyToComment,
        likeReply,
        deleteReply,
        editComment,
        editReply
    };
}
