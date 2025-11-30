import React from 'react';
import { TextWithEmojis } from '../TextWithEmojis';
import { LumenSpark } from '../Icons';
import { useFriendship } from '../../hooks/useFriendship';
import styles from './Notifications.module.css';

const NotificationItem = ({ notification, onMarkAsRead, onNavigateToPost, getIcon, getMessage }) => {
    const { acceptFriendRequest, rejectFriendRequest, friendshipStatus } = useFriendship(notification.senderId);

    // Se a notificação é de pedido de amizade, verificamos se ainda está pendente para mostrar botões
    // Mas o hook retorna o status atual. Se já foi aceito, não mostramos botões.
    // O status 'pending_received' indica que EU recebi e ainda não respondi.

    const showActions = notification.type === 'friend_request' && friendshipStatus === 'pending_received';

    const handleClick = () => {
        if (!notification.read && onMarkAsRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.type !== 'friend_request') {
            onNavigateToPost(notification.postId, notification.commentId);
        }
    };

    const handleAccept = (e) => {
        e.stopPropagation();
        acceptFriendRequest();
    };

    const handleReject = (e) => {
        e.stopPropagation();
        rejectFriendRequest();
    };

    return (
        <div
            className={`${styles.item} ${notification.read ? styles.read : styles.unread}`}
            onClick={handleClick}
        >
            <div className={styles.avatar}>
                {notification.senderAvatar ? (
                    <img src={notification.senderAvatar} alt={notification.senderName} />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        {notification.senderName ? notification.senderName.charAt(0).toUpperCase() : '?'}
                    </div>
                )}
                {getIcon(notification.type)}
            </div>
            <div className={styles.content}>
                <p className={styles.text}>
                    <span className={styles.name}>{notification.senderName}</span> {getMessage(notification)}
                </p>
                {showActions && (
                    <div className={styles.notificationActions}>
                        <button onClick={handleAccept} className={`${styles.actionBtn} ${styles.acceptBtn}`}>Aceitar</button>
                        <button onClick={handleReject} className={`${styles.actionBtn} ${styles.rejectBtn}`}>Recusar</button>
                    </div>
                )}
                <span className={styles.time}>
                    {notification.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            {!notification.read && <div className={styles.dot}></div>}
        </div>
    );
};

export function Notifications({ notifications, loading, onMarkAllAsRead, onNavigateToPost, onMarkAsRead, onClearHistory }) {
    if (loading) {
        return <div className={styles.loading}>Carregando notificações...</div>;
    }

    if (notifications.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 4 5l5.5-1.5 2.5 2.5 2.5-2.5L20 5s2 2 2 4.5V17z" />
                        <path d="M2 12h20" />
                    </svg>
                </div>
                <h3>Tudo tranquilo por aqui</h3>
                <p>Nenhuma notificação nova no momento.</p>
            </div>
        );
    }

    // Helper para agrupar notificações
    const groupNotifications = (notifs) => {
        const groups = {
            'Novas': [],
            'Ontem': [],
            'Anteriores': []
        };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        notifs.forEach(notif => {
            const date = notif.createdAt;
            const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
            const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

            if (isToday) {
                groups['Novas'].push(notif);
            } else if (isYesterday) {
                groups['Ontem'].push(notif);
            } else {
                groups['Anteriores'].push(notif);
            }
        });

        return groups;
    };

    const groupedNotifications = groupNotifications(notifications);

    const getIcon = (type) => {
        switch (type) {
            case 'like':
                return (
                    <div className={`${styles.typeIcon} ${styles.typeLike}`}>
                        <LumenSpark filled={true} size={14} color="white" />
                    </div>
                );
            case 'comment':
                return (
                    <div className={`${styles.typeIcon} ${styles.typeComment}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                    </div>
                );
            case 'reply':
                return (
                    <div className={`${styles.typeIcon} ${styles.typeReply}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 14 4 9 9 4" />
                            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                        </svg>
                    </div>
                );
            case 'friend_request':
            case 'friend_accepted':
                return (
                    <div className={`${styles.typeIcon} ${styles.typeFriend}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                    </div>
                );
            case 'friend_post':
                return (
                    <div className={`${styles.typeIcon} ${styles.typeLike}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className={`${styles.typeIcon} ${styles.typeDefault}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                );
        }
    };

    const getMessage = (notification) => {
        switch (notification.type) {
            case 'like':
                return <span>curtiu seu post: <span className={styles.highlight}>{notification.content}</span></span>;
            case 'comment':
                return <span>comentou no seu post: <span className={styles.highlight}>{notification.content}</span></span>;
            case 'reply':
                return <span>respondeu seu comentário: <span className={styles.highlight}>{notification.content}</span></span>;
            case 'friend_request':
                return <span>enviou uma solicitação de amizade.</span>;
            case 'friend_accepted':
                return <span>aceitou sua solicitação de amizade.</span>;
            case 'friend_post':
                return <span>publicou um novo post: <span className={styles.highlight}>{notification.content}</span></span>;
            default:
                return <span>interagiu com você.</span>;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Notificações</h2>
                <div className={styles.headerActions}>
                    <button onClick={onMarkAllAsRead} className={styles.markAllBtn} title="Marcar todas como lidas">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Ler todas</span>
                    </button>
                    <button onClick={onClearHistory} className={styles.clearBtn} title="Limpar histórico">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.list}>
                {Object.entries(groupedNotifications).map(([group, items]) => (
                    items.length > 0 && (
                        <div key={group} className={styles.section}>
                            <div className={styles.sectionTitle}>{group}</div>
                            {items.map(notif => (
                                <NotificationItem
                                    key={notif.id}
                                    notification={notif}
                                    onMarkAsRead={onMarkAsRead}
                                    onNavigateToPost={onNavigateToPost}
                                    getIcon={getIcon}
                                    getMessage={getMessage}
                                />
                            ))}
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}
