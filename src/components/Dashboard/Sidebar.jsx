import React from 'react';
import { TextWithEmojis } from '../TextWithEmojis';
import styles from './Sidebar.module.css';

export function Sidebar({ currentView, onNavigate, unreadCount }) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <div className={styles.sidebarLogoCircle}></div>
                <span className={styles.sidebarTitle}>Lumen</span>
            </div>

            <nav className={styles.navMenu}>
                <div
                    className={`${styles.navItem} ${currentView === 'feed' ? styles.active : ''}`}
                    onClick={() => onNavigate('feed')}
                >
                    <span className={styles.navIcon}><TextWithEmojis text="🏠" size={20} /></span>
                    <span>Feed</span>
                </div>
                <div className={styles.navItem}>
                    <span className={styles.navIcon}><TextWithEmojis text="🔥" size={20} /></span>
                    <span>Trending</span>
                </div>
                <div
                    className={`${styles.navItem} ${currentView === 'chat' ? styles.active : ''}`}
                    onClick={() => onNavigate('chat')}
                >
                    <span className={styles.navIcon}><TextWithEmojis text="💬" size={20} /></span>
                    <span>Mensagens</span>
                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                </div>
                <div className={styles.navItem}>
                    <span className={styles.navIcon}><TextWithEmojis text="⚙️" size={20} /></span>
                    <span>Ajustes</span>
                </div>
            </nav>
        </aside>
    );
}
