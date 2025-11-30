import React from 'react';
import styles from './UserPostsSection.module.css'; // Reutilizando estilos
import { TextWithEmojis } from '../TextWithEmojis';
import { RichTextRenderer } from '../RichTextRenderer';

export function UserCommentsSection({ comments, loading, error, onCommentClick }) {
    if (loading) {
        return <div className={styles.loading}>Carregando comentários...</div>;
    }

    if (error) {
        return <div className={styles.error}>Erro ao carregar comentários.</div>;
    }

    if (comments.length === 0) {
        return (
            <div className={styles.postsSection}>
                <h2 className={styles.sectionTitle}>Comentários Recentes</h2>
                <div className={styles.emptyState}>
                    Nenhum comentário recente encontrado.
                </div>
            </div>
        );
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.postsSection}>
            <h2 className={styles.sectionTitle}>Comentários Recentes</h2>

            <div className={styles.timelineContainer}>
                {comments.map((comment) => (
                    <div key={comment.id} className={styles.timelineItem}>
                        <div className={styles.timelineDot} style={{ backgroundColor: '#2563eb', borderColor: '#121212' }}></div>
                        <div
                            className={styles.postCard}
                            onClick={() => onCommentClick && onCommentClick(comment.postId, comment.id)}
                            title="Clique para ver no feed"
                        >
                            <span className={styles.postDate}>{formatDate(comment.createdAt)}</span>

                            <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>
                                {comment.type === 'reply' ? (
                                    <>Respondeu a <strong>{comment.replyTo}</strong> no post de <strong>{comment.postAuthor}</strong></>
                                ) : (
                                    <>Comentou no post de <strong>{comment.postAuthor}</strong></>
                                )}
                            </div>


                            <div className={styles.postContent} style={{ fontStyle: 'italic', color: '#ccc' }}>
                                <RichTextRenderer text={`"${comment.text}"`} />
                            </div>

                            <div className={styles.postStats}>
                                <span className={styles.stat}>
                                    <TextWithEmojis text="🔗" size={16} />
                                    Ver post original
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
