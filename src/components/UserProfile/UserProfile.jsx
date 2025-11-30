import React, { useState, useEffect } from 'react';
import styles from './UserProfile.module.css';
import { ConfirmationModal } from '../ConfirmationModal';
import { UserPostsSection } from './UserPostsSection';
import { UserCommentsSection } from './UserCommentsSection';
import { UserFriendsSection } from './UserFriendsSection';
import { usePosts } from '../../hooks/usePosts';
import { useUserComments } from '../../hooks/useUserComments';
import { useUserData } from '../../hooks/useUserData';
import { useFriendship } from '../../hooks/useFriendship';
import { useUserFriends } from '../../hooks/useUserFriends';
import { auth } from '../../firebase';

export function UserProfile({ user: authUser, onBack, onNavigateToPost, onUserClick }) {
    const [activeTab, setActiveTab] = useState('posts');
    const [isEditing, setIsEditing] = useState(false);

    // Componente interno para ações de amizade
    const FriendshipActions = ({ targetUserId }) => {
        const {
            friendshipStatus,
            loading,
            sendFriendRequest,
            acceptFriendRequest,
            rejectFriendRequest,
            cancelFriendRequest,
            removeFriend
        } = useFriendship(targetUserId);

        const [showUnfriendModal, setShowUnfriendModal] = useState(false);

        if (loading) return null;

        switch (friendshipStatus) {
            case 'none':
                return (
                    <button onClick={sendFriendRequest} className={styles.friendButton}>
                        Adicionar Amigo
                    </button>
                );
            case 'pending_sent':
                return (
                    <button onClick={cancelFriendRequest} className={`${styles.friendButton} ${styles.pending}`}>
                        Solicitação Enviada (Cancelar)
                    </button>
                );
            case 'pending_received':
                return (
                    <div className={styles.friendActions}>
                        <button onClick={acceptFriendRequest} className={`${styles.friendButton} ${styles.accept}`}>
                            Aceitar
                        </button>
                        <button onClick={rejectFriendRequest} className={`${styles.friendButton} ${styles.reject}`}>
                            Recusar
                        </button>
                    </div>
                );
            case 'accepted':
                return (
                    <>
                        <button
                            onClick={() => setShowUnfriendModal(true)}
                            className={`${styles.friendButton} ${styles.friends}`}
                        >
                            Amigos (Desfazer)
                        </button>

                        <ConfirmationModal
                            isOpen={showUnfriendModal}
                            onClose={() => setShowUnfriendModal(false)}
                            onConfirm={removeFriend}
                            title="Desfazer Amizade"
                            message="Tem certeza que deseja desfazer a amizade? Vocês deixarão de se seguir."
                            confirmText="Desfazer Amizade"
                            isDangerous={true}
                        />
                    </>
                );
            default:
                return null;
        }
    };

    // Dados do Firestore (Bio, Banner, etc)
    const { userData, loading: userLoading, updateUserData, uploadImage } = useUserData(authUser.uid);

    // Estados locais para edição
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editThemeColor, setEditThemeColor] = useState('#009688'); // Cor padrão
    const [uploading, setUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const { posts, loading: postsLoading, error: postsError } = usePosts(authUser.uid);
    const { comments, loading: commentsLoading, error: commentsError } = useUserComments(authUser.uid);
    const { friends, loading: friendsLoading, error: friendsError } = useUserFriends(authUser.uid);

    // Inicializar estados de edição quando userData carregar
    useEffect(() => {
        if (userData) {
            setEditName(userData.displayName || '');
            setEditBio(userData.bio || '');
            setEditThemeColor(userData.themeColor || '#009688');
        }
    }, [userData]);

    // Scroll to top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const isOwner = auth.currentUser && auth.currentUser.uid === authUser.uid;

    const handleSave = async () => {
        setUploading(true);
        setStatusMessage('Salvando perfil...');
        try {
            await updateUserData({
                displayName: editName,
                bio: editBio,
                themeColor: editThemeColor
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Erro ao salvar alterações.");
        } finally {
            setUploading(false);
            setStatusMessage('');
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setStatusMessage(type === 'avatar' ? 'Enviando avatar...' : 'Enviando capa...');
        try {
            const url = await uploadImage(file);

            setStatusMessage('Atualizando perfil...');
            await updateUserData({
                [type === 'avatar' ? 'photoURL' : 'bannerURL']: url
            });
        } catch (error) {
            console.error(`Erro ao fazer upload de ${type}:`, error);
            alert(error.message || "Erro ao enviar imagem.");
        } finally {
            setUploading(false);
            setStatusMessage('');
        }
    };

    const displayUser = userData || authUser;
    const displayName = displayUser.displayName || 'Usuário Sem Nome';
    const photoURL = displayUser.photoURL;
    const bannerURL = displayUser.bannerURL;
    const bio = displayUser.bio;
    const themeColor = displayUser.themeColor || '#009688';

    const renderAvatar = () => {
        if (photoURL) {
            return <img src={photoURL} alt={displayName} className={styles.avatarLarge} style={{ borderColor: themeColor }} />;
        }
        return (
            <div className={styles.avatarLarge} style={{ borderColor: themeColor }}>
                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
            </div>
        );
    };

    return (
        <div className={styles.profileContainer} style={{ '--profile-theme': themeColor }}>
            <div className={styles.profileCard}>
                <div className={styles.banner}>
                    {bannerURL && <img src={bannerURL} alt="Capa" className={styles.bannerImage} />}
                </div>

                <div className={styles.headerControls}>
                    <button onClick={onBack} className={styles.backButton}>
                        ← Voltar
                    </button>
                    {isOwner && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                            ✏️ Editar Perfil
                        </button>
                    )}

                    {isEditing && (
                        <label className={styles.bannerEditButton}>
                            <span>📷 Alterar Capa</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'banner')}
                                style={{ display: 'none' }}
                            />
                        </label>
                    )}
                </div>

                <div className={styles.profileHeader}>
                    <div className={styles.avatarContainer}>
                        {renderAvatar()}
                        {isEditing && (
                            <label className={`${styles.uploadOverlay} ${styles.avatarOverlay}`}>
                                <span>📷</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'avatar')}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        )}
                    </div>

                    <div className={styles.userInfo}>
                        {isEditing ? (
                            <div className={styles.editForm}>
                                <div className={styles.editField}>
                                    <label>Nome</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className={styles.editInput}
                                        placeholder="Seu Nome"
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>Bio</label>
                                    <textarea
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        className={styles.editTextarea}
                                        placeholder="Sua Biografia"
                                        rows={3}
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>Cor do Tema</label>
                                    <div className={styles.colorPickerContainer}>
                                        <input
                                            type="color"
                                            value={editThemeColor}
                                            onChange={(e) => setEditThemeColor(e.target.value)}
                                            className={styles.colorInput}
                                        />
                                        <span className={styles.colorValue}>{editThemeColor}</span>
                                    </div>
                                </div>
                                <div className={styles.editActions}>
                                    <button onClick={handleSave} className={styles.saveButton} disabled={uploading}>
                                        {uploading ? (statusMessage || 'Salvando...') : 'Salvar'}
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className={styles.cancelButton} disabled={uploading}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className={styles.userName}>{displayName}</h1>

                                {isOwner && <p className={styles.userEmail}>{displayUser.email}</p>}
                                {bio ? (
                                    <p className={styles.userBio}>{bio}</p>
                                ) : (
                                    <p className={styles.userBio}>Programador apaixonado por tecnologia e inovação. Sempre em busca do próximo desafio.</p>
                                )}
                                <span className={styles.userRole}>Membro</span>
                                {!isOwner && (
                                    <div className={styles.friendshipActionsWrapper}>
                                        <FriendshipActions targetUserId={authUser.uid} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className={styles.profileStats}>
                        <div
                            className={`${styles.statItem} ${activeTab === 'posts' ? styles.activeStat : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            <span className={styles.statValue}>{postsLoading ? '-' : posts.length}</span>
                            <span className={styles.statLabel}>Posts</span>
                        </div>
                        <div
                            className={`${styles.statItem} ${activeTab === 'comments' ? styles.activeStat : ''}`}
                            onClick={() => setActiveTab('comments')}
                        >
                            <span className={styles.statValue}>{commentsLoading ? '-' : comments.length}</span>
                            <span className={styles.statLabel}>Comentários</span>
                        </div>
                        <div
                            className={`${styles.statItem} ${activeTab === 'friends' ? styles.activeStat : ''}`}
                            onClick={() => setActiveTab('friends')}
                        >
                            <span className={styles.statValue}>{friendsLoading ? '-' : friends.length}</span>
                            <span className={styles.statLabel}>Amigos</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tabsContainer}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'posts' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Posts
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'comments' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('comments')}
                >
                    Comentários
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'friends' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Amigos
                </button>
            </div>

            <div className={styles.contentArea}>
                {activeTab === 'posts' && (
                    <UserPostsSection
                        posts={posts}
                        loading={postsLoading}
                        error={postsError}
                        userId={authUser.uid}
                        onPostClick={onNavigateToPost}
                    />
                )}
                {activeTab === 'comments' && (
                    <UserCommentsSection
                        comments={comments}
                        loading={commentsLoading}
                        error={commentsError}
                        onCommentClick={onNavigateToPost}
                    />
                )}
                {activeTab === 'friends' && (
                    <UserFriendsSection
                        friends={friends}
                        loading={friendsLoading}
                        error={friendsError}
                        onFriendClick={onUserClick}
                    />
                )}
            </div>
        </div>
    );
}
