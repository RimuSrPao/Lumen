import React, { useState } from 'react';
import { TextWithEmojis } from '../TextWithEmojis';
import { RichTextRenderer } from '../RichTextRenderer';
import { LumenSpark, EditIcon, DeleteIcon, BoldIcon, ItalicIcon, StrikeIcon, CodeIcon } from '../Icons';
import { CommentItem } from '../CommentItem';
import { CommentInput } from '../CommentInput';
import { CodeEditorDialog } from '../CodeEditorDialog';
import styles from './PostCard.module.css';
import { usePosts } from '../../hooks/usePosts';
import { useComments } from '../../hooks/useComments';

const CollapsibleContent = ({ children, maxHeight = 400 }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [shouldCollapse, setShouldCollapse] = React.useState(false);
    const contentRef = React.useRef(null);

    React.useEffect(() => {
        if (contentRef.current && contentRef.current.scrollHeight > maxHeight) {
            setShouldCollapse(true);
        }
    }, [children, maxHeight]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            <div
                ref={contentRef}
                style={{
                    maxHeight: !isExpanded && shouldCollapse ? `${maxHeight}px` : 'none',
                    overflow: 'hidden',
                    position: 'relative',
                    width: '100%',
                    transition: 'max-height 0.3s ease'
                }}
            >
                {children}
                {!isExpanded && shouldCollapse && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '80px',
                        background: 'linear-gradient(to bottom, transparent, var(--lumen-bg, #0f0f0f))',
                        pointerEvents: 'none'
                    }} />
                )}
            </div>
            {shouldCollapse && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--lumen-primary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        marginTop: '0.5rem',
                        padding: '0',
                        fontWeight: '500'
                    }}
                >
                    {isExpanded ? 'Ler menos' : 'Ler mais'}
                </button>
            )}
        </div>
    );
};

export function PostCard({ post, user, onShowAlert, onShowConfirm, targetCommentId, onUserClick }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ text: post.text, image: null, imageUrl: post.imageUrl });
    const [showComments, setShowComments] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const editInputRef = React.useRef(null);

    const insertFormat = (prefix, suffix) => {
        const textarea = editInputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = before + prefix + selection + suffix + after;
        setEditForm(prev => ({ ...prev, text: newText }));

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const handleCodeInsert = (codeBlock) => {
        const textarea = editInputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);

        const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
        const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';

        const newText = before + prefix + codeBlock + suffix + after;
        setEditForm(prev => ({ ...prev, text: newText }));

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + codeBlock.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Auto-resize do textarea de edição
    React.useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.style.height = 'auto';
            editInputRef.current.style.height = editInputRef.current.scrollHeight + 'px';
        }
    }, [editForm.text, isEditing]);

    // Efeito para abrir comentários e focar no comentário alvo
    React.useEffect(() => {
        if (targetCommentId) {
            setShowComments(true);
            // Pequeno delay para garantir que o DOM foi renderizado
            setTimeout(() => {
                const element = document.getElementById(`comment-${targetCommentId}`);
                // Encontrar o container de scroll (feedContainer)
                // Como o PostCard está dentro do Feed, podemos buscar pelo pai que tem overflow-y auto
                // Uma forma segura é buscar pelo elemento que tem a classe do container do feed
                // Mas como não temos acesso direto ao styles do Feed aqui, podemos buscar pelo elemento 'main' ou pelo container específico
                // Vamos tentar buscar pelo elemento pai mais próximo que seja scrollable
                const getScrollParent = (node) => {
                    if (node == null) {
                        return null;
                    }
                    if (node.scrollHeight > node.clientHeight && (getComputedStyle(node).overflowY === 'auto' || getComputedStyle(node).overflowY === 'scroll')) {
                        return node;
                    }
                    return getScrollParent(node.parentNode);
                };

                const container = getScrollParent(element);

                if (element && container) {
                    // Cálculo manual
                    // Precisamos da posição do elemento relativa ao container
                    const elementRect = element.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const offset = elementRect.top - containerRect.top;
                    const currentScroll = container.scrollTop;
                    const targetScroll = currentScroll + offset - (container.clientHeight / 2) + (element.clientHeight / 2);

                    container.scrollTo({ top: targetScroll, behavior: 'smooth' });

                    element.style.transition = 'all 0.5s ease';
                    element.style.setProperty('box-shadow', '0 0 15px rgba(59, 130, 246, 0.4)', 'important');
                    element.style.setProperty('border', '1px solid rgba(59, 130, 246, 0.4)', 'important');
                    element.style.borderRadius = '8px';

                    setTimeout(() => {
                        element.style.removeProperty('box-shadow');
                        element.style.removeProperty('border');
                        element.style.removeProperty('border-radius');
                    }, 3000);
                }
            }, 300);
        }
    }, [targetCommentId]);

    const { editPost, deletePost, toggleLike } = usePosts();
    const { addComment, deleteComment, likeComment, replyToComment, likeReply, deleteReply, editComment, editReply } = useComments();

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Agora';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return `${diff}s atrás`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
        return date.toLocaleDateString();
    };

    const handleSaveEdit = async () => {
        try {
            await editPost(post.id, editForm.text, editForm.image, editForm.imageUrl);
            setIsEditing(false);
        } catch (error) {
            onShowAlert("Erro", `Erro ao salvar edição: ${error.message}`);
        }
    };

    const handleDelete = async () => {
        onShowConfirm("Excluir Post", "Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.", async () => {
            try {
                await deletePost(post.id);
            } catch (error) {
                onShowAlert("Erro", "Não foi possível excluir o post.");
            }
        });
    };

    return (
        <div className={styles.postCard}>
            <div className={styles.postHeader}>
                <div
                    className={styles.headerAvatar}
                    onClick={() => onUserClick && onUserClick(post.author)}
                    style={{ cursor: 'pointer' }}
                >
                    {post.author.avatar ? (
                        <img src={post.author.avatar} alt="Avatar" className={styles.avatarImg} />
                    ) : (
                        (post.author.name || 'U').charAt(0).toUpperCase()
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div
                        className={styles.postAuthorName}
                        onClick={() => onUserClick && onUserClick(post.author)}
                        style={{ cursor: 'pointer' }}
                    >
                        {post.author.name}
                        {post.editedAt && <span className={styles.postEditedLabel}> (editado)</span>}
                    </div>
                    <div className={styles.postTime}>{formatTime(post.createdAt)}</div>
                </div>
                {post.author.uid === user.uid && (
                    <div className={styles.postActionsMenu}>
                        <button className={styles.editPostBtn} onClick={() => setIsEditing(true)} title="Editar post">
                            <EditIcon size={18} />
                        </button>
                        <button className={styles.deletePostBtn} onClick={handleDelete} title="Excluir post">
                            <DeleteIcon size={18} />
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className={styles.editPostForm}>
                    <div className={styles.formatToolbar}>
                        <button className={styles.formatBtn} onClick={() => insertFormat('**', '**')} title="Negrito">
                            <BoldIcon size={16} />
                        </button>
                        <button className={styles.formatBtn} onClick={() => insertFormat('*', '*')} title="Itálico">
                            <ItalicIcon size={16} />
                        </button>
                        <button className={styles.formatBtn} onClick={() => insertFormat('~~', '~~')} title="Tachado">
                            <StrikeIcon size={16} />
                        </button>
                        <button className={styles.formatBtn} onClick={() => setShowCodeEditor(true)} title="Código">
                            <CodeIcon size={16} />
                        </button>
                    </div>
                    <textarea
                        ref={editInputRef}
                        className={styles.editPostInput}
                        value={editForm.text}
                        onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                        rows="3"
                    />
                    {(editForm.imageUrl || editForm.image) && (
                        <div className={styles.editImagePreview}>
                            <img
                                src={editForm.image ? URL.createObjectURL(editForm.image) : editForm.imageUrl}
                                alt="Preview"
                            />
                            <button
                                className={styles.removeImageBtn}
                                onClick={() => setEditForm({ ...editForm, imageUrl: null, image: null })}
                            >
                                <TextWithEmojis text="✕" size={16} />
                            </button>
                        </div>
                    )}
                    <div className={styles.editPostActions}>
                        <label className={styles.iconBtn} title="Alterar Imagem">
                            <TextWithEmojis text="📷" size={22} />
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files[0]) {
                                        setEditForm({ ...editForm, image: e.target.files[0] });
                                    }
                                }}
                            />
                        </label>
                        <div className={styles.editButtons}>
                            <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancelar</button>
                            <button className={styles.saveBtn} onClick={handleSaveEdit}>Salvar</button>
                        </div>
                    </div>
                    <CodeEditorDialog
                        isOpen={showCodeEditor}
                        onClose={() => setShowCodeEditor(false)}
                        onInsert={handleCodeInsert}
                    />
                </div>
            ) : (

                <>
                    <div className={styles.postBody}>
                        <CollapsibleContent>
                            <RichTextRenderer text={post.text} />
                        </CollapsibleContent>
                    </div>
                    {post.imageUrl && (
                        <div className={styles.postImageContainer}>
                            <img src={post.imageUrl} alt="Post content" className={styles.postImage} loading="lazy" />
                        </div>
                    )}
                </>
            )}

            <div className={styles.postFooter}>
                <button
                    className={`${styles.postAction} ${post.likes?.includes(user.uid) ? styles.liked : ''}`}
                    onClick={() => toggleLike(post.id, post.likes || [], user.uid, post.author.uid, post.text)}
                >
                    <LumenSpark filled={post.likes?.includes(user.uid)} size={20} />
                    <span>{post.likes?.length || 0}</span>
                </button>
                <button
                    className={`${styles.postAction} ${showComments ? styles.active : ''}`}
                    onClick={() => setShowComments(!showComments)}
                >
                    <TextWithEmojis text="💬" size={18} /> {((post.comments?.length || 0) + (post.comments?.reduce((acc, comment) => acc + (comment.replies?.length || 0), 0) || 0))}
                </button>
                <button className={styles.postAction}><TextWithEmojis text="🔄" size={18} /> Compartilhar</button>
            </div>

            {showComments && (
                <div className={styles.commentsSection}>
                    <div className={styles.commentsList}>
                        {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment, index) => {
                                // Recursive component to render replies
                                const RecursiveReplies = ({ replies, parentId }) => {
                                    const children = replies.filter(r => r.replyToId === parentId);

                                    if (children.length === 0) return null;

                                    return (
                                        <div className={styles.repliesList} style={{ marginLeft: '0', paddingLeft: '0', borderLeft: 'none' }}>
                                            {children.map((reply) => (
                                                <div key={reply.id} id={`comment-${reply.id}`} style={{ position: 'relative' }}>
                                                    {/* Connecting line for nested replies */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: '-12px',
                                                        top: '0',
                                                        bottom: '0',
                                                        width: '2px',
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        borderTopLeftRadius: '4px',
                                                        borderBottomLeftRadius: '4px',
                                                        display: 'none' // Hidden for now, can be enabled for tree view lines
                                                    }} />

                                                    <CommentItem
                                                        comment={reply}
                                                        postId={post.id}
                                                        currentUser={user}
                                                        formatTime={formatTime}
                                                        isReply={true}
                                                        onLike={(pid, _, rid) => likeReply(pid, comment.id, rid, user.uid)}
                                                        onReply={(r) => setReplyingTo({ postId: post.id, commentId: comment.id, author: r.author, uid: r.uid, replyId: r.id, text: r.text })}
                                                        onDelete={(pid, c) => deleteReply(pid, comment.id, c.id)}
                                                        onEdit={(pid, rid, _, text) => editReply(pid, comment.id, rid, text)}
                                                        onUserClick={onUserClick}
                                                    >
                                                        {/* Render input if replying to this specific reply */}
                                                        {replyingTo?.replyId === reply.id && (
                                                            <div className={styles.replyInputWrapper} style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <CommentInput
                                                                    placeholder={`Respondendo a ${replyingTo.author}...`}
                                                                    onSubmit={(text) => {
                                                                        replyToComment(post.id, comment.id, text, user, replyingTo, replyingTo.uid);
                                                                        setReplyingTo(null);
                                                                    }}
                                                                    autoFocus={true}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Recursive call for children of this reply */}
                                                        <div style={{ paddingLeft: '1.5rem' }}>
                                                            <RecursiveReplies replies={replies} parentId={reply.id} />
                                                        </div>
                                                    </CommentItem>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                };

                                return (
                                    <div key={index} id={`comment-${comment.id}`} className={styles.commentItemContainer}>
                                        <CommentItem
                                            comment={comment}
                                            postId={post.id}
                                            currentUser={user}
                                            formatTime={formatTime}
                                            onLike={(pid, cid) => likeComment(pid, cid, user.uid)}
                                            onReply={(c) => setReplyingTo(replyingTo?.commentId === c.id && !replyingTo?.replyId ? null : { postId: post.id, commentId: c.id, author: c.author, uid: c.uid, text: c.text })}
                                            onDelete={deleteComment}
                                            onEdit={(pid, cid, _, text) => editComment(pid, cid, text)}
                                            onUserClick={onUserClick}
                                        >
                                            {/* Render input if replying to the main comment */}
                                            {replyingTo?.commentId === comment.id && !replyingTo?.replyId && (
                                                <div className={styles.replyInputWrapper}>
                                                    <CommentInput
                                                        placeholder={`Respondendo a ${replyingTo.author}...`}
                                                        onSubmit={(text) => {
                                                            replyToComment(post.id, comment.id, text, user, replyingTo, replyingTo.uid);
                                                            setReplyingTo(null);
                                                        }}
                                                        autoFocus={true}
                                                    />
                                                </div>
                                            )}

                                            {/* Render recursive replies starting from the comment ID */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                                    <RecursiveReplies replies={comment.replies} parentId={comment.id} />
                                                </div>
                                            )}
                                        </CommentItem>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles.noComments}>
                                <p>Seja o primeiro a comentar!</p>
                            </div>
                        )}
                    </div>
                    <div className={styles.commentInputWrapper}>
                        <CommentInput
                            placeholder="Escreva um comentário..."
                            onSubmit={(text) => addComment(post.id, text, user, post.author.uid)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
