import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { dbRealtime } from '../firebase';
import './UserPresenceIndicator.css';

export const UserPresenceIndicator = ({ userId, size = 10, showText = false, className = '' }) => {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const statusRef = ref(dbRealtime, '/status/' + userId);
        const unsubscribe = onValue(statusRef, (snapshot) => {
            const status = snapshot.val();
            setIsOnline(status?.state === 'online');
        });

        return () => unsubscribe();
    }, [userId]);

    return (
        <div className={`user-presence-indicator ${className} ${isOnline ? 'online' : 'offline'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span
                className="status-dot"
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: isOnline ? '#10b981' : '#6b7280',
                    display: 'inline-block',
                    border: '2px solid var(--lumen-surface, #1a1a1a)'
                }}
            />
            {showText && (
                <span className="status-text" style={{ fontSize: '0.8rem', color: isOnline ? '#10b981' : '#9ca3af' }}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            )}
        </div>
    );
};
