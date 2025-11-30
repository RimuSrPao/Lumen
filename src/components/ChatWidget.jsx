import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ChatWidget.css';
import { TextWithEmojis } from './TextWithEmojis';
import { useUserChats, useChatMessages, chatActions } from '../hooks/useChat';
import { useUserFriends } from '../hooks/useUserFriends';
import { auth } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserPresenceIndicator } from './UserPresenceIndicator';

const ChatWidget = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'contacts'
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageInput, setMessageInput] = useState('');

    // Estados para funcionalidades avançadas
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
    const [replyingTo, setReplyingTo] = useState(null);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const currentUser = auth.currentUser;
    const { chats, loading: loadingChats } = useUserChats(currentUser?.uid);
    const { friends, loading: loadingFriends } = useUserFriends(currentUser?.uid);

    const { messages, loading: loadingMessages } = useChatMessages(activeChatId);

    const messagesEndRef = useRef(null);
    const chatBodyRef = useRef(null);

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

    // Fechar menu de contexto ao clicar fora - OTIMIZADO
    useEffect(() => {
        if (contextMenu.visible) {
            const handleClickOutside = () => setContextMenu(prev => ({ ...prev, visible: false }));
            window.addEventListener('click', handleClickOutside);
            return () => window.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu.visible]);

    if (!isOpen) return null;

    const handleOpenChat = async (friend) => {
        try {
            const chatId = await chatActions.createOrGetChat(currentUser.uid, friend.uid);
            setActiveChatId(chatId);
            setActiveChatUser(friend);
            setActiveTab('chat');
            setReplyingTo(null);
        } catch (error) {
            console.error("Erro ao abrir chat:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChatId) return;

        const content = messageInput;

        try {
            await chatActions.sendMessage(
                activeChatId,
                content,
                currentUser.uid,
                activeChatUser.uid,
                replyingTo
            );
            setMessageInput('');
            setReplyingTo(null);
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
        }
    };

    const handleBackToList = () => {
        setActiveChatId(null);
        setActiveChatUser(null);
        setActiveTab('conversations');
        setReplyingTo(null);
    };



    // Context Menu Handlers
    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        e.stopPropagation();

        let x = e.clientX;
        let y = e.clientY;

        // Ajustes simples
        if (x + 150 > window.innerWidth) x -= 150;
        if (y + 100 > window.innerHeight) y -= 100;

        setContextMenu({
            visible: true,
            x,
            y,
            message: msg
        });
        setCopyFeedback(false);
    };

    const handleCopy = () => {
        if (contextMenu.message) {
            navigator.clipboard.writeText(contextMenu.message.content);
            setCopyFeedback(true);
            setTimeout(() => {
                setContextMenu(prev => ({ ...prev, visible: false }));
                setCopyFeedback(false);
            }, 1000);
        }
    };

    const handleReply = () => {
        if (contextMenu.message) {
            setReplyingTo(contextMenu.message);
            setContextMenu(prev => ({ ...prev, visible: false }));
            document.querySelector('.chat-message-input')?.focus();
        }
    };

    const handleDelete = () => {
        if (contextMenu.message && activeChatId) {
            setShowDeleteConfirm(true);
            setContextMenu(prev => ({ ...prev, visible: false }));
        }
    };

    const confirmDelete = async () => {
        if (contextMenu.message && activeChatId) {
            try {
                await chatActions.deleteMessage(activeChatId, contextMenu.message.id);
            } catch (error) {
                console.error("Erro ao apagar:", error);
            }
            setShowDeleteConfirm(false);
        }
    };

    const handleScrollToMessage = (messageId) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-message');
            setTimeout(() => element.classList.remove('highlight-message'), 2000);
        }
    };

    // Filtragem de Chats (Inclui lógica para esconder chats vazios ou apenas com mensagens apagadas)
    const filteredChats = chats.filter(chat => {
        // Filtrar chats sem mensagens ou vazios
        if (!chat.lastMessage || chat.lastMessage.trim() === '') return false;

        // Se a última mensagem for a marcação de apagada, esconder da lista principal
        // (O histórico ainda existe se buscar pelo contato, mas não polui a lista de conversas ativas)
        if (chat.lastMessage === "🚫 Mensagem apagada") return false;

        const otherUserId = chat.participants.find(uid => uid !== currentUser.uid);
        const friend = friends.find(f => f.uid === otherUserId);
        return friend ? friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    });

    const filteredFriends = friends.filter(friend =>
        friend.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Renderização do conteúdo principal
    // Renderização do conteúdo principal
    const renderContent = () => {
        if (activeChatId) {
            return (
                <div className="chat-view">
                    <div className="chat-messages-list" ref={chatBodyRef}>
                        {messages.map(msg => {
                            const isMe = msg.senderId === currentUser.uid;
                            const isDeleted = msg.isDeleted;

                            return (
                                <div
                                    key={msg.id}
                                    id={`msg-${msg.id}`}
                                    className={`message-bubble-wrapper ${isMe ? 'me' : 'other'} ${isDeleted ? 'deleted' : ''}`}
                                    onContextMenu={(e) => !isDeleted && handleContextMenu(e, msg)}
                                >
                                    <div className="message-bubble">
                                        {!isDeleted && msg.replyTo && (
                                            <div
                                                className="message-reply-preview-bubble"
                                                onClick={() => handleScrollToMessage(msg.replyTo.id)}
                                                title="Ir para mensagem original"
                                            >
                                                <span className="reply-author">
                                                    {msg.replyTo.senderId === currentUser.uid ? 'Você' : activeChatUser?.displayName}
                                                </span>
                                                <p className="reply-content-preview">{msg.replyTo.content}</p>
                                            </div>
                                        )}
                                        <TextWithEmojis text={msg.content} size={14} />
                                    </div>
                                    <span className="message-time">
                                        {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Área de Preview de Resposta */}
                    {replyingTo && (
                        <div className="reply-preview-area">
                            <div className="reply-info">
                                <span className="reply-title">
                                    Respondendo a {replyingTo.senderId === currentUser.uid ? 'você' : activeChatUser?.displayName}
                                </span>
                                <p className="reply-text">{replyingTo.content}</p>
                            </div>
                            <button className="close-reply-btn" onClick={() => setReplyingTo(null)}>
                                <TextWithEmojis text="✕" size={14} />
                            </button>
                        </div>
                    )}

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Digite sua mensagem..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            className="chat-message-input"
                        />
                        <button type="submit" className="chat-send-btn" disabled={!messageInput.trim()}>
                            <TextWithEmojis text="➤" size={16} />
                        </button>
                    </form>
                </div>
            );
        }

        if (activeTab === 'contacts') {
            return (
                <div className="conversations-list">
                    {filteredFriends.length > 0 ? (
                        filteredFriends.map(friend => (
                            <div key={friend.uid} className="conversation-item" onClick={() => handleOpenChat(friend)}>
                                <div className="conversation-avatar-wrapper">
                                    {friend.photoURL ? (
                                        <img src={friend.photoURL} alt={friend.displayName} className="conversation-avatar" />
                                    ) : (
                                        <div className="conversation-avatar placeholder">
                                            {friend.displayName.charAt(0)}
                                        </div>
                                    )}
                                    <div className="avatar-status-indicator">
                                        <UserPresenceIndicator userId={friend.uid} size={10} />
                                    </div>
                                </div>
                                <div className="conversation-info">
                                    <span className="conversation-name">{friend.displayName}</span>
                                    <span className="conversation-preview">Clique para iniciar conversa</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="chat-empty-state">
                            <p>Nenhum contato encontrado.</p>
                        </div>
                    )}
                </div>
            );
        }

        // Default: Conversations list
        return (
            <div className="conversations-list">
                {filteredChats.length > 0 ? (
                    filteredChats.map(chat => {
                        const otherUserId = chat.participants.find(uid => uid !== currentUser.uid);
                        const friend = friends.find(f => f.uid === otherUserId);
                        const unreadCount = chat.unreadCounts?.[currentUser.uid] || 0;

                        if (!friend) return null;

                        return (
                            <div key={chat.id} className="conversation-item" onClick={() => handleOpenChat(friend)}>
                                <div className="conversation-avatar-wrapper">
                                    {friend.photoURL ? (
                                        <img src={friend.photoURL} alt={friend.displayName} className="conversation-avatar" />
                                    ) : (
                                        <div className="conversation-avatar placeholder">
                                            {friend.displayName.charAt(0)}
                                        </div>
                                    )}
                                    <div className="avatar-status-indicator">
                                        <UserPresenceIndicator userId={friend.uid} size={10} />
                                    </div>
                                </div>
                                <div className="conversation-info">
                                    <div className="conversation-top">
                                        <span className="conversation-name">{friend.displayName}</span>
                                        <span className="conversation-time">
                                            {chat.updatedAt ? format(chat.updatedAt.toDate(), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                    <div className="conversation-bottom">
                                        <p className={`conversation-preview ${unreadCount > 0 ? 'unread' : ''}`}>
                                            {chat.lastMessage}
                                        </p>
                                        {unreadCount > 0 && (
                                            <span className="unread-badge">{unreadCount}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="chat-empty-state">
                        <span className="empty-icon"><TextWithEmojis text="💬" size={48} /></span>
                        <p>Nenhuma conversa iniciada.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {contextMenu.visible && createPortal(
                <div
                    className="chat-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={handleReply}>
                        <TextWithEmojis text="↩️" size={14} /> Responder
                    </button>
                    <button onClick={handleCopy}>
                        {copyFeedback ? (
                            <><TextWithEmojis text="✅" size={14} /> Copiado!</>
                        ) : (
                            <><TextWithEmojis text="📋" size={14} /> Copiar</>
                        )}
                    </button>
                    {contextMenu.message?.senderId === currentUser.uid && (
                        <button onClick={handleDelete} className="delete">
                            <TextWithEmojis text="🗑️" size={14} /> Apagar
                        </button>
                    )}
                </div>,
                document.body
            )}

            <div className="chat-widget-container">
                <div className="chat-header-premium">
                    <div className="chat-header-top">
                        {activeChatId ? (
                            <div className="chat-header-user">
                                <button className="chat-back-btn" onClick={handleBackToList}>
                                    <TextWithEmojis text="←" size={18} />
                                </button>
                                <div className="chat-user-info">
                                    <span className="chat-user-name">{activeChatUser?.displayName}</span>
                                </div>
                            </div>
                        ) : (
                            <h3>Mensagens</h3>
                        )}
                        <div className="chat-header-actions">
                            {!activeChatId && (
                                <button className="chat-action-btn" onClick={() => setActiveTab('contacts')} title="Nova Conversa">
                                    <TextWithEmojis text="✏️" size={18} />
                                </button>
                            )}
                            <button className="chat-action-btn close" onClick={onClose}>
                                <TextWithEmojis text="✕" size={18} />
                            </button>
                        </div>
                    </div>
                    {!activeChatId && (
                        <div className="chat-search-wrapper">
                            <span className="search-icon"><TextWithEmojis text="🔍" size={16} /></span>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="chat-search-input-premium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {showDeleteConfirm && (
                    <div className="chat-confirm-overlay">
                        <div className="chat-confirm-modal">
                            <h3>Apagar mensagem?</h3>
                            <p>Esta ação não pode ser desfeita.</p>
                            <div className="chat-confirm-actions">
                                <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
                                <button className="confirm-btn" onClick={confirmDelete}>Apagar</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="chat-body-premium">
                    {renderContent()}
                </div>

                {!activeChatId && (
                    <div className="chat-footer-premium">
                        <button className={`footer-tab ${activeTab === 'conversations' ? 'active' : ''}`} onClick={() => setActiveTab('conversations')}>
                            <TextWithEmojis text="💬" size={18} /> Conversas
                        </button>
                        <button className={`footer-tab ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
                            <TextWithEmojis text="👥" size={18} /> Contatos
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ChatWidget;
