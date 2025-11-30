import React, { useEffect, useState } from 'react';
import { usePosts } from '../../hooks/usePosts';
import { useUserFriends } from '../../hooks/useUserFriends';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import styles from './Feed.module.css';

export function Feed({ user, onShowAlert, onShowConfirm, initialPostId, initialCommentId, onUserClick }) {
    const [feedMode, setFeedMode] = useState('global'); // 'global' | 'friends'
    const { friends, loading: friendsLoading } = useUserFriends(user.uid);

    // Extrair UIDs dos amigos para filtro
    const friendIds = friends.map(f => f.uid);

    // Passar friendIds apenas se estiver no modo 'friends'
    const { posts, loading, error } = usePosts(null, feedMode === 'friends' ? friendIds : null);

    useEffect(() => {
        if (!loading && initialPostId) {
            const element = document.getElementById(`post-${initialPostId}`);
            const container = element?.closest(`.${styles.feedContainer}`);

            if (element && container) {
                const top = element.offsetTop - container.offsetTop - 20;
                container.scrollTo({ top, behavior: 'smooth' });

                element.style.transition = 'all 0.5s ease';
                element.style.setProperty('box-shadow', '0 0 20px rgba(59, 130, 246, 0.5)', 'important');
                element.style.setProperty('border', '1px solid rgba(59, 130, 246, 0.5)', 'important');
                element.style.borderRadius = '12px';

                setTimeout(() => {
                    element.style.removeProperty('box-shadow');
                    element.style.removeProperty('border');
                    element.style.removeProperty('border-radius');
                }, 3000);
            }
        }
    }, [loading, initialPostId]);

    if (loading && feedMode === 'global') {
        return <div className={styles.loading}>Carregando feed...</div>;
    }

    if (error) {
        return <div className={styles.error}>Erro ao carregar posts: {error.message}</div>;
    }

    return (
        <div className={styles.feedContainer}>
            <div className={styles.feedHeader}>
                <div className={styles.feedTabs}>
                    <button
                        className={`${styles.feedTab} ${feedMode === 'global' ? styles.activeTab : ''}`}
                        onClick={() => setFeedMode('global')}
                    >
                        Global
                    </button>
                    <button
                        className={`${styles.feedTab} ${feedMode === 'friends' ? styles.activeTab : ''}`}
                        onClick={() => setFeedMode('friends')}
                    >
                        Amigos
                    </button>
                </div>
            </div>

            <CreatePost user={user} onShowAlert={onShowAlert} />

            {feedMode === 'friends' && friendIds.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Você ainda não tem amigos adicionados.</p>
                    <p>Adicione amigos para ver seus posts aqui!</p>
                </div>
            ) : posts.length === 0 && !loading ? (
                <div className={styles.emptyState}>
                    <p>Nenhum post encontrado.</p>
                </div>
            ) : (
                posts.map(post => (
                    <div key={post.id} id={`post-${post.id}`}>
                        <PostCard
                            post={post}
                            user={user}
                            onShowAlert={onShowAlert}
                            onShowConfirm={onShowConfirm}
                            targetCommentId={initialPostId === post.id ? initialCommentId : null}
                            onUserClick={onUserClick}
                        />
                    </div>
                ))
            )}
        </div>
    );
}
