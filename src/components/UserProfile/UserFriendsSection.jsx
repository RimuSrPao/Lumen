import React from 'react';
import styles from './UserProfile.module.css';

export function UserFriendsSection({ friends, loading, error, onFriendClick }) {
    if (loading) {
        return <div className={styles.loading}>Carregando amigos...</div>;
    }

    if (error) {
        return <div className={styles.error}>Erro ao carregar amigos.</div>;
    }

    if (friends.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>Nenhum amigo encontrado.</p>
            </div>
        );
    }

    return (
        <div className={styles.friendsGrid}>
            {friends.map(friend => (
                <div
                    key={friend.id}
                    className={styles.friendCard}
                    onClick={() => onFriendClick(friend)}
                >
                    <div className={styles.friendAvatarContainer}>
                        {friend.photoURL ? (
                            <img src={friend.photoURL} alt={friend.displayName} className={styles.friendAvatar} />
                        ) : (
                            <div className={styles.friendAvatarPlaceholder}>
                                {friend.displayName ? friend.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>
                    <div className={styles.friendInfo}>
                        <h3 className={styles.friendName}>{friend.displayName || 'Usuário'}</h3>
                        {friend.bio && <p className={styles.friendBio}>{friend.bio.substring(0, 50)}{friend.bio.length > 50 ? '...' : ''}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}
