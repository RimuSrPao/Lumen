import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useUserComments(userId) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const fetchUserComments = async () => {
            try {
                // Busca os últimos 50 posts para encontrar comentários recentes
                // Nota: Em uma app real com muitos dados, o ideal seria ter uma coleção 'comments' 
                // ou um campo 'commentAuthorIds' nos posts para filtrar no banco.
                const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
                const snapshot = await getDocs(q);

                let userComments = [];

                snapshot.docs.forEach(doc => {
                    const post = doc.data();
                    const postId = doc.id;

                    if (post.comments) {
                        post.comments.forEach(comment => {
                            // Verifica se o comentário é do usuário
                            if (comment.uid === userId) {
                                userComments.push({
                                    id: comment.id,
                                    text: comment.text,
                                    createdAt: comment.createdAt,
                                    postId: postId,
                                    postAuthor: post.author?.name || 'Usuário',
                                    type: 'comment'
                                });
                            }

                            // Verifica respostas (replies)
                            if (comment.replies) {
                                comment.replies.forEach(reply => {
                                    if (reply.uid === userId) {
                                        userComments.push({
                                            id: reply.id,
                                            text: reply.text,
                                            createdAt: reply.createdAt,
                                            postId: postId,
                                            postAuthor: post.author?.name || 'Usuário',
                                            type: 'reply',
                                            replyTo: reply.replyToAuthor
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

                // Ordena por data (mais recente primeiro)
                userComments.sort((a, b) => b.createdAt - a.createdAt);

                setComments(userComments);
                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar comentários do usuário:", err);
                setError(err);
                setLoading(false);
            }
        };

        fetchUserComments();
    }, [userId]);

    return { comments, loading, error };
}
