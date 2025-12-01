import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { ref, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, dbRealtime } from '../../firebase';

// Componentes Locais
import { Sidebar } from './Sidebar';
import { FriendsSidebar } from './FriendsSidebar';
import { TopBar } from './TopBar';
import { Feed } from './Feed';
import { Modal } from './Modal';
import { UserProfile } from '../UserProfile/UserProfile';
import { Notifications } from './Notifications';
import { useNotifications } from '../../hooks/useNotifications';
import { NewsFeed } from './NewsFeed';
import { Settings } from './Settings';

// Componentes Externos
import { ChatView } from '../Chat/ChatView';
import { useUnreadChatCount } from '../../hooks/useChat';
import { TextWithEmojis } from '../TextWithEmojis';
import { MainLayout } from '../Layout/MainLayout';

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

    const handleLogout = async () => {
        if (user?.uid) {
            try {
                // Definir como offline no Realtime Database antes de sair
                const userStatusDatabaseRef = ref(dbRealtime, '/status/' + user.uid);
                const isOfflineForDatabase = {
                    state: 'offline',
                    last_changed: rtdbServerTimestamp(),
                };
                await set(userStatusDatabaseRef, isOfflineForDatabase);

                // Definir como offline no Firestore
                const userStatusFirestoreRef = doc(db, 'users', user.uid);
                await updateDoc(userStatusFirestoreRef, {
                    isOnline: false,
                    lastSeen: serverTimestamp()
                });
            } catch (error) {
                console.error("Erro ao definir offline antes de sair:", error);
            }
        }

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

    // Configuração de Views
    const renderContent = () => {
        switch (currentView) {
            case 'profile':
                return (
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
                );
            case 'notifications':
                return (
                    <Notifications
                        notifications={notifications}
                        loading={loadingNotifs}
                        onMarkAllAsRead={markAllAsRead}
                        onNavigateToPost={handleGoToPost}
                        onMarkAsRead={markAsRead}
                        onClearHistory={handleClearHistory}
                        onUserClick={handleViewProfile}
                    />
                );
            case 'news':
                return <NewsFeed user={user} />;
            case 'chat':
                return <ChatView user={user} onViewProfile={handleViewProfile} />;
            case 'settings':
                return <Settings user={user} />;
            default: // 'feed'
                return (
                    <Feed
                        user={user}
                        onShowAlert={showAlert}
                        onShowConfirm={showConfirm}
                        initialPostId={targetPostId}
                        initialCommentId={targetCommentId}
                        onUserClick={handleViewProfile}
                    />
                );
        }
    };

    return (
        <>
            {/* Modal Global */}
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />

            <MainLayout
                sidebar={
                    <Sidebar
                        currentView={currentView}
                        onNavigate={handleNavigate}
                        unreadChatCount={unreadChatCount}
                        currentUser={user}
                        onLogout={handleLogout}
                    />
                }
                topbar={
                    <TopBar
                        user={user}
                        onLogout={handleLogout}
                        onNavigate={(view) => {
                            if (view === 'profile') {
                                setViewingUser(user);
                            }
                            handleNavigate(view);
                        }}
                        unreadCount={unreadChatCount}
                    />
                }
                content={renderContent()}
                rightSidebar={
                    currentView !== 'chat' ? (
                        <FriendsSidebar
                            user={user}
                            onUserClick={handleViewProfile}
                        />
                    ) : null
                }
            />
        </>
    );
}
