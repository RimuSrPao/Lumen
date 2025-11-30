import React from 'react';
import styles from './UserPostsSection.module.css';
import { LumenSpark } from '../Icons';
import { TextWithEmojis } from '../TextWithEmojis';
import { RichTextRenderer } from '../RichTextRenderer';

export function UserPostsSection({ posts, loading, error, userId, onPostClick }) {
    if (loading) {
        return <div className={styles.loading}>Carregando timeline...</div>;
    }

    if (error) {
        return <div className={styles.error}>Erro ao carregar posts.</div>;
    }

    if (posts.length === 0) {
        return (
            <div className={styles.postsSection}>
                <h2 className={styles.sectionTitle}>Linha do Tempo</h2>
                <div className={styles.emptyState}>
                    Nenhum post publicado ainda.
                </div>
            </div>
        );
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.postsSection}>
            <h2 className={styles.sectionTitle}>Linha do Tempo</h2>

            <div className={styles.timelineContainer}>
                {posts.map((post) => (
                    <div key={post.id} className={styles.timelineItem}>
                        <div className={styles.timelineDot}></div>
                        <div
                            className={styles.postCard}
                            onClick={() => onPostClick && onPostClick(post.id)}
                            title="Clique para ver no feed"
                        >
                            <span className={styles.postDate}>{formatDate(post.createdAt)}</span>


                            <div className={styles.postContent}>
                                <RichTextRenderer text={post.text} />
                            </div>

                            {post.imageUrl && (
                                <img src={post.imageUrl} alt="Post attachment" className={styles.postImage} />
                            )}

                            <div className={styles.postStats}>
                                <div className={`${styles.stat} ${post.likes?.includes(userId) ? styles.liked : ''}`}>
                                    <LumenSpark filled={post.likes?.includes(userId)} size={18} />
                                    <span>{post.likes ? post.likes.length : 0} curtidas</span>
                                </div>
                                <div className={styles.stat}>
                                    <TextWithEmojis text="💬" size={16} />
                                    <span>{((post.comments?.length || 0) + (post.comments?.reduce((acc, comment) => acc + (comment.replies?.length || 0), 0) || 0))} comentários</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
