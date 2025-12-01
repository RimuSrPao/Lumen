import React, { useState, useEffect, useRef } from 'react';
import { useUserChats, useChatMessages, chatActions } from '../../hooks/useChat';
import { useUserFriends } from '../../hooks/useUserFriends';
import { auth } from '../../firebase';
import { format } from 'date-fns';
import { TextWithEmojis } from '../TextWithEmojis';
import { RichTextRenderer } from '../RichTextRenderer';
import { UserPresenceIndicator } from '../UserPresenceIndicator';
import { RichChatInput } from './RichChatInput';
import styles from './ChatView.module.css';

export function ChatView() {
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    const currentUser = auth.currentUser;
    const { chats, loading: loadingChats } = useUserChats(currentUser?.uid);
    const { friends, loading: loadingFriends } = useUserFriends(currentUser?.uid);
    const { messages, loading: loadingMessages } = useChatMessages(activeChatId);

    const messagesEndRef = useRef(null);

    // Scroll para o fim das mensagens
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeChatId, replyingTo]);

    // Marcar como lido ao abrir o chat
    useEffect(() => {
        if (activeChatId && currentUser) {
            chatActions.markChatAsRead(activeChatId, currentUser.uid);
        }
    }, [activeChatId, messages, currentUser]);

    const handleOpenChat = async (friend) => {
        try {
            const chatId = await chatActions.createOrGetChat(currentUser.uid, friend.uid);
            setActiveChatId(chatId);
            setActiveChatUser(friend);
            setReplyingTo(null);
        } catch (error) {
            console.error("Erro ao abrir chat:", error);
        }
    };

    const handleSendMessage = async (text, image) => {
        if ((!text.trim() && !image) || !activeChatId) return;

        try {
            await chatActions.sendMessage(
                activeChatId,
                text,
                currentUser.uid,
                activeChatUser.uid,
                replyingTo,
                image
            );
            setReplyingTo(null);
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
        }
    };

    const filteredChats = chats.filter(chat => {
        if (!chat.lastMessage || chat.lastMessage === "🚫 Mensagem apagada") return false;
        const otherUserId = chat.participants.find(uid => uid !== currentUser.uid);
        const friend = friends.find(f => f.uid === otherUserId);
        return friend ? friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    });

    const filteredFriends = friends.filter(friend =>
        friend.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Combinar chats existentes com amigos que ainda não têm chat (para a lista lateral)
    // Por simplicidade, vamos mostrar chats ativos primeiro, depois amigos sem chat se houver busca
    const displayList = searchTerm ? filteredFriends : filteredChats;

    return (
        <div className={styles.chatContainer}>
            {/* Sidebar */}
            <div className={styles.chatSidebar}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.sidebarTitle}>Mensagens</h2>
                    <div className={styles.searchWrapper}>
                        <span className={styles.searchIcon}><TextWithEmojis text="🔍" size={16} /></span>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Buscar conversas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.conversationsList}>
                    {searchTerm && filteredFriends.map(friend => (
                        <div key={friend.uid} className={`${styles.conversationItem} ${activeChatUser?.uid === friend.uid ? styles.active : ''}`} onClick={() => handleOpenChat(friend)}>
                            <div className={styles.avatarWrapper}>
                                {friend.photoURL ? (
                                    <img src={friend.photoURL} alt={friend.displayName} className={styles.avatar} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>{friend.displayName.charAt(0)}</div>
                                )}
                                <div className={styles.statusIndicator}>
                                    <UserPresenceIndicator userId={friend.uid} size={10} />
                                </div>
                            </div>
                            <div className={styles.conversationInfo}>
                                <span className={styles.conversationName}>{friend.displayName}</span>
                                <span className={styles.conversationPreview}>Iniciar conversa</span>
                            </div>
                        </div>
                    ))}

                    {!searchTerm && filteredChats.map(chat => {
                        const otherUserId = chat.participants.find(uid => uid !== currentUser.uid);
                        const friend = friends.find(f => f.uid === otherUserId);
                        if (!friend) return null;
                        const unreadCount = chat.unreadCounts?.[currentUser.uid] || 0;

                        return (
                            <div key={chat.id} className={`${styles.conversationItem} ${activeChatId === chat.id ? styles.active : ''}`} onClick={() => handleOpenChat(friend)}>
                                <div className={styles.avatarWrapper}>
                                    {friend.photoURL ? (
                                        <img src={friend.photoURL} alt={friend.displayName} className={styles.avatar} />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>{friend.displayName.charAt(0)}</div>
                                    )}
                                    <div className={styles.statusIndicator}>
                                        <UserPresenceIndicator userId={friend.uid} size={10} />
                                    </div>
                                </div>
                                <div className={styles.conversationInfo}>
                                    <div className={styles.conversationTop}>
                                        <span className={styles.conversationName}>{friend.displayName}</span>
                                        <span className={styles.conversationTime}>
                                            {chat.updatedAt ? format(chat.updatedAt.toDate(), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                    <div className={styles.conversationBottom}>
                                        <p className={`${styles.conversationPreview} ${unreadCount > 0 ? styles.unread : ''}`}>
                                            {chat.lastMessage}
                                        </p>
                                        {unreadCount > 0 && (
                                            <span className={styles.unreadBadge}>{unreadCount}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={styles.chatArea}>
                {activeChatId ? (
                    <>
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderUser}>
                                {activeChatUser?.photoURL ? (
                                    <img src={activeChatUser.photoURL} alt={activeChatUser.displayName} className={styles.avatar} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>{activeChatUser?.displayName?.charAt(0)}</div>
                                )}
                                <div>
                                    <span className={styles.chatUserName}>{activeChatUser?.displayName}</span>
                                    <UserPresenceIndicator userId={activeChatUser?.uid} showText={true} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.chatMessages}>
                            {messages.map(msg => {
                                const isMe = msg.senderId === currentUser.uid;
                                return (
                                    <div key={msg.id} className={`${styles.messageWrapper} ${isMe ? styles.me : styles.other}`}>
                                        <div className={styles.messageBubble}>
                                            {msg.imageUrl && (
                                                <img
                                                    src={msg.imageUrl}
                                                    alt="Anexo"
                                                    className={styles.messageImage}
                                                    onClick={() => window.open(msg.imageUrl, '_blank')}
                                                />
                                            )}
                                            <div className={styles.messageTextContent}>
                                                <RichTextRenderer text={msg.content} />
                                            </div>
                                            <span className={styles.messageMeta}>
                                                {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                                                {isMe && <TextWithEmojis text="✓✓" size={12} />}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {replyingTo && (
                            <div className={styles.replyPreview}>
                                <div className={styles.replyInfo}>
                                    <span className={styles.replyTitle}>
                                        Respondendo a {replyingTo.senderId === currentUser.uid ? 'você' : activeChatUser?.displayName}
                                    </span>
                                    <p className={styles.replyText}>{replyingTo.content}</p>
                                </div>
                                <button className={styles.closeReplyBtn} onClick={() => setReplyingTo(null)}>
                                    <TextWithEmojis text="✕" size={14} />
                                </button>
                            </div>
                        )}

                        <div className={styles.chatFooter}>
                            <RichChatInput onSendMessage={handleSendMessage} />
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}><TextWithEmojis text="💬" size={64} /></span>
                        <h3>Selecione uma conversa</h3>
                        <p>Escolha um contato à esquerda para começar a conversar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
