import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { Home, Megaphone, MessageCircle, Settings, User, LogOut, Bell } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { dbRealtime } from '../../firebase';

export function Sidebar({ currentView, onNavigate, unreadCount, currentUser, onLogout }) {
    const [isOnline, setIsOnline] = useState(false);

    // Monitorar status de conexão do próprio usuário
    useEffect(() => {
        const connectedRef = ref(dbRealtime, '.info/connected');
        const unsubscribe = onValue(connectedRef, (snap) => {
            setIsOnline(snap.val() === true);
        });

        return () => unsubscribe();
    }, []);

    const menuItems = [
        { id: 'feed', icon: Home, label: 'Feed', active: true },
        { id: 'news', icon: Megaphone, label: 'Novidades', active: true },
        { id: 'chat', icon: MessageCircle, label: 'Mensagens', badge: unreadCount },
    ];

    const settingsItems = [
        { id: 'notifications', icon: Bell, label: 'Notificações' },
        { id: 'settings', icon: Settings, label: 'Ajustes' },
    ];

    return (
        <aside className={styles.sidebar}>
            {/* Header Premium com Logo */}
            <div className={styles.sidebarHeader}>
                <div className={styles.logoWrapper}>
                    <div className={styles.sidebarLogoCircle}></div>
                    <span className={styles.sidebarTitle}>Lumen</span>
                </div>
            </div>

            {/* Menu Principal */}
            <nav className={styles.navMenu}>
                <div className={styles.menuSection}>
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <div
                                key={item.id}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={() => item.active !== false && onNavigate(item.id)}
                            >
                                <div className={styles.navIconWrapper}>
                                    <Icon size={20} className={styles.navIcon} />
                                </div>
                                <span className={styles.navLabel}>{item.label}</span>
                                {item.badge > 0 && (
                                    <span className={styles.badge}>
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Divider */}
                <div className={styles.divider}></div>

                {/* Settings Section */}
                <div className={styles.menuSection}>
                    <div className={styles.sectionLabel}>Configurações</div>
                    {settingsItems.map(item => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.id}
                                className={styles.navItem}
                            >
                                <div className={styles.navIconWrapper}>
                                    <Icon size={20} className={styles.navIcon} />
                                </div>
                                <span className={styles.navLabel}>{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* User Profile */}
            <div className={styles.userProfile}>
                <div className={styles.userInfo}>
                    <div className={styles.userAvatarWrapper}>
                        {currentUser?.photoURL ? (
                            <img
                                src={currentUser.photoURL}
                                alt={currentUser.displayName}
                                className={styles.userAvatar}
                            />
                        ) : (
                            <div className={styles.userAvatarPlaceholder}>
                                <User size={18} />
                            </div>
                        )}
                        <div
                            className={styles.statusIndicator}
                            style={{ backgroundColor: isOnline ? '#4caf50' : '#666' }}
                        ></div>
                    </div>
                    <div className={styles.userDetails}>
                        <div className={styles.userName}>
                            {currentUser?.displayName || 'Usuário'}
                        </div>
                        <div className={styles.userStatus}>
                            {isOnline ? 'Online' : 'Offline'}
                        </div>
                    </div>
                </div>
                <button className={styles.logoutBtn} title="Sair" onClick={onLogout}>
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}
