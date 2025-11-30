import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { db, dbRealtime } from '../../firebase';
import styles from './FriendsSidebar.module.css';

export function FriendCard({ userId, initialData, onClick }) {
    const [userData, setUserData] = useState(initialData);
    const [isOnline, setIsOnline] = useState(initialData?.isOnline || false);

    useEffect(() => {
        if (!userId) return;

        // Listen for user data changes (profile, name, etc) from Firestore
        const unsubscribeFirestore = onSnapshot(doc(db, 'users', userId), (doc) => {
            if (doc.exists()) {
                setUserData({ id: doc.id, uid: doc.id, ...doc.data() });
            }
        });

        // Listen for presence changes from Realtime Database
        const statusRef = ref(dbRealtime, '/status/' + userId);
        const unsubscribeRealtime = onValue(statusRef, (snapshot) => {
            const status = snapshot.val();
            setIsOnline(status?.state === 'online');
        });

        return () => {
            unsubscribeFirestore();
            unsubscribeRealtime();
        };
    }, [userId]);

    const themeColor = userData?.themeColor || '#009688';

    return (
        <div
            className={`${styles.friendCard} ${!isOnline ? styles.offline : ''}`}
            onClick={() => onClick({ ...userData, uid: userId })}
            style={{ '--friend-theme': themeColor }}
        >
            <div className={styles.cardContent}>
                <div className={styles.avatar}>
                    {userData?.photoURL ? (
                        <img src={userData.photoURL} alt={userData.displayName} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {userData?.displayName?.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                    {/* Indicador de status opcional na foto, se desejar */}
                </div>
                <div className={styles.info}>
                    <span className={styles.name}>{userData?.displayName || 'Usuário'}</span>

                    <span className={styles.status}>
                        <span className={`${styles.statusDot} ${isOnline ? styles.onlineDot : styles.offlineDot}`}></span>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
        </div>
    );
}
