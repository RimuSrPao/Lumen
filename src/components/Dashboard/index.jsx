import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

// Componentes Locais
import { Sidebar } from './Sidebar';
import { FriendsSidebar } from './FriendsSidebar';
import { TopBar } from './TopBar';
import { Feed } from './Feed';
import { Modal } from './Modal';
import { UserProfile } from '../UserProfile/UserProfile';
import { Notifications } from './Notifications';
import { useNotifications } from '../../hooks/useNotifications';

// Componentes Externos
import { ChatView } from '../Chat/ChatView'; // Importando ChatView
import { useUnreadChatCount } from '../../hooks/useChat';
import { TextWithEmojis } from '../TextWithEmojis';

// Estilos
import styles from './DashboardLayout.module.css';

export function Dashboard({ user }) {
    const [currentView, setCurrentView] = useState('feed'); // 'feed' | 'profile' | 'notifications' | 'chat'
    const [viewingUser, setViewingUser] = useState(null); // Usuário sendo visualizado no perfil

    // Hook de Notificações
    const { notifications, unreadCount, loading: loadingNotifs, markAllAsRead, markAsRead, clearAllNotifications } = useNotifications(user?.uid);
    const unreadChatCount = useUnreadChatCount(user?.uid);

    const [targetPostId, setTargetPostId] = useState(null);
    const [targetCommentId, setTargetCommentId] = useState(null);

    // Estado do Modal
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'alert', // 'alert' ou 'confirm'
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Maximize window on load
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.maximizeWindow();
        }
    }, []);

    const handleLogout = () => {
        signOut(auth).catch((error) => console.error("Erro ao sair:", error));
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const showAlert = (title, message) => {
        setModalConfig({
            isOpen: true,
            type: 'alert',
            title,
            message,
            onConfirm: closeModal
        });
    };

    const showConfirm = (title, message, onConfirmAction) => {
        setModalConfig({
            isOpen: true,
            type: 'confirm',
            title,
            message,
            onConfirm: () => {
                onConfirmAction();
                closeModal();
            }
        });
    };

    const handleNavigate = (view) => {
        setCurrentView(view);
    };

    const handleGoToPost = (postId, commentId = null) => {
        setTargetPostId(postId);
        setTargetCommentId(commentId);
        setCurrentView('feed');
    };

    const handleViewProfile = (targetUser) => {
        setViewingUser(targetUser);
        setCurrentView('profile');
    };

    const handleClearHistory = () => {
        showConfirm(
            "Limpar Histórico",
            "Tem certeza que deseja apagar todas as notificações? Esta ação não pode ser desfeita.",
            clearAllNotifications
        );
    };

    return (
        <div className={styles.dashboardContainer}>
            {/* Modal Global */}
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />

            {/* Sidebar */}
            <Sidebar
                currentView={currentView}
                onNavigate={handleNavigate}
                unreadChatCount={unreadChatCount}
            />

            {/* Main Content */}
            <main className={styles.mainContent}>
                <TopBar
                    user={user}
                    onLogout={handleLogout}
                    onNavigate={(view) => {
                        if (view === 'profile') {
                            setViewingUser(user);
                        }
                        handleNavigate(view);
                    }}
                    unreadCount={unreadCount}
                />

                {currentView === 'profile' ? (
                    <UserProfile
                        key={viewingUser ? viewingUser.uid : user.uid}
                        user={viewingUser || user}
                        onBack={() => {
                            setViewingUser(null);
                            setCurrentView('feed');
                        }}
                        onNavigateToPost={handleGoToPost}
                        onUserClick={handleViewProfile}
                    />
                ) : currentView === 'notifications' ? (
                    <Notifications
                        notifications={notifications}
                        loading={loadingNotifs}
                        onMarkAllAsRead={markAllAsRead}
                        onNavigateToPost={handleGoToPost}
                        onMarkAsRead={markAsRead}
                        onClearHistory={handleClearHistory}
                        onUserClick={handleViewProfile}
                    />
                ) : currentView === 'chat' ? (
                    <ChatView />
                ) : (
                    <Feed
                        user={user}
                        onShowAlert={showAlert}
                        onShowConfirm={showConfirm}
                        initialPostId={targetPostId}
                        initialCommentId={targetCommentId}
                        onUserClick={handleViewProfile}
                    />
                )}
            </main>

            {/* Friends Sidebar (Right) - Hide on chat view if needed, but keeping for now */}
            {currentView !== 'chat' && (
                <FriendsSidebar
                    user={user}
                    onUserClick={handleViewProfile}
                />
            )}
        </div >
    );
}
