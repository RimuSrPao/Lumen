import React from 'react';
import { useUserFriends } from '../../hooks/useUserFriends';
import styles from './FriendsSidebar.module.css';
import { FriendCard } from './FriendCard';

export function FriendsSidebar({ user, onUserClick }) {
    const { friends, loading, error } = useUserFriends(user?.uid);

    if (loading) {
        return (
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <h3>Amigos</h3>
                </div>
                <div className={styles.loading}>Carregando...</div>
            </div>
        );
    }

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <h3>Amigos</h3>
                <span className={styles.count}>{friends.length}</span>
            </div>

            <div className={styles.list}>
                {friends.length === 0 ? (
                    <div className={styles.empty}>
                        <p>Nenhum amigo ainda.</p>
                    </div>
                ) : (
                    friends.map(friend => (
                        <FriendCard
                            key={friend.uid}
                            userId={friend.uid}
                            initialData={friend}
                            onClick={onUserClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
