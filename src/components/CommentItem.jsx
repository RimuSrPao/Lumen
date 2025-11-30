import React, { useState, useRef, useEffect } from 'react';
import { TextWithEmojis } from './TextWithEmojis';
import { LumenSpark, ReplyIcon, DeleteIcon, EditIcon, BoldIcon, ItalicIcon, StrikeIcon, CodeIcon } from './Icons';
import { RichTextRenderer } from './RichTextRenderer';
import { CodeEditorDialog } from './CodeEditorDialog';
import styles from './CommentItem.module.css';

const CollapsibleContent = ({ children, maxHeight = 300 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [shouldCollapse, setShouldCollapse] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current && contentRef.current.scrollHeight > maxHeight) {
            setShouldCollapse(true);
        }
    }, [children, maxHeight]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
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
                        height: '60px',
                        background: 'linear-gradient(to bottom, transparent, var(--lumen-bg-secondary, #1e1e1e))', // Ajuste a cor conforme o tema
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
                        fontSize: '0.85rem',
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

export const CommentItem = ({
    comment,
    postId,
    currentUser,
    onLike,
    onReply,
    onDelete,
    onEdit,
    formatTime,
    isReply = false,
    onUserClick,
    children
}) => {
    const isOwner = comment.uid === currentUser.uid;
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const editInputRef = useRef(null);

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
        setEditText(newText);

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
        setEditText(newText);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + codeBlock.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Auto-resize do textarea de edição
    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.style.height = 'auto';
            editInputRef.current.style.height = editInputRef.current.scrollHeight + 'px';
        }
    }, [editText, isEditing]);

    const handleSaveEdit = () => {
        if (editText.trim() !== comment.text) {
            onEdit(postId, comment.id, isReply ? comment.id : null, editText);
        }
        setIsEditing(false);
    };

    return (
        <div className={styles.commentItemWrapper}>
            <div className={`${isReply ? styles.replyItem : styles.commentItem} ${isOwner ? styles.ownItem : ''}`}>
                <div
                    className={`${isReply ? styles.replyAvatar : styles.commentAvatar} ${onUserClick ? styles.clickable : ''}`}
                    onClick={() => onUserClick && onUserClick({ uid: comment.uid, name: comment.author, avatar: comment.avatar })}
                >
                    {comment.avatar ? (
                        <img src={comment.avatar} alt="Avatar" loading="lazy" />
                    ) : (
                        (comment.author || 'U').charAt(0).toUpperCase()
                    )}
                </div>

                <div className={isReply ? styles.replyContent : styles.commentContent}>
                    <div className={isReply ? styles.replyHeader : styles.commentHeader}>
                        <span
                            className={`${isReply ? styles.replyAuthor : styles.commentAuthor} ${onUserClick ? styles.clickable : ''}`}
                            onClick={() => onUserClick && onUserClick({ uid: comment.uid, name: comment.author, avatar: comment.avatar })}
                        >
                            {comment.author}
                        </span>
                        <span className={isReply ? styles.replyTime : styles.commentTime}>
                            {formatTime(comment.createdAt)}
                            {comment.editedAt && <span style={{ marginLeft: '4px', fontStyle: 'italic', opacity: 0.7 }}>(editado)</span>}
                        </span>
                    </div>

                    {/* Reply Context (Discord Style) - Only for replies */}
                    {isReply && comment.replyToAuthor && (
                        <div className={styles.replyContext}>
                            <span className={styles.replyContextIcon}>↳</span>
                            <span className={styles.replyContextAuthor}>@{comment.replyToAuthor}</span>
                            {comment.replyToText && (
                                <span className={styles.replyContextText}>
                                    {comment.replyToText.length > 50
                                        ? comment.replyToText.substring(0, 50) + '...'
                                        : comment.replyToText}
                                </span>
                            )}
                        </div>
                    )}

                    {isEditing ? (
                        <div style={{ marginTop: '0.5rem' }}>
                            <div className={styles.formatToolbar}>
                                <button className={styles.formatBtn} onClick={() => insertFormat('**', '**')} title="Negrito">
                                    <BoldIcon size={14} />
                                </button>
                                <button className={styles.formatBtn} onClick={() => insertFormat('*', '*')} title="Itálico">
                                    <ItalicIcon size={14} />
                                </button>
                                <button className={styles.formatBtn} onClick={() => insertFormat('~~', '~~')} title="Tachado">
                                    <StrikeIcon size={14} />
                                </button>
                                <button className={styles.formatBtn} onClick={() => setShowCodeEditor(true)} title="Código">
                                    <CodeIcon size={14} />
                                </button>
                            </div>
                            <textarea
                                ref={editInputRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--lumen-border)',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    color: 'var(--lumen-text)',
                                    resize: 'none',
                                    fontFamily: 'inherit'
                                }}
                                rows={2}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--lumen-text-dim)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    style={{
                                        background: 'var(--lumen-primary)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '4px',
                                        padding: '0.2rem 0.8rem',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    Salvar
                                </button>
                            </div>
                            <CodeEditorDialog
                                isOpen={showCodeEditor}
                                onClose={() => setShowCodeEditor(false)}
                                onInsert={handleCodeInsert}
                            />
                        </div>

                    ) : (
                        <div className={isReply ? styles.replyText : styles.commentText}>
                            <CollapsibleContent>
                                <RichTextRenderer text={comment.text} />
                            </CollapsibleContent>
                        </div>
                    )}

                    <div className={styles.commentActions}>
                        <button
                            className={`${styles.commentActionBtn} ${comment.likes?.includes(currentUser.uid) ? styles.liked : ''}`}
                            onClick={() => onLike(postId, comment.id, isReply ? comment.id : null)}
                        >
                            <LumenSpark filled={comment.likes?.includes(currentUser.uid)} size={14} />
                            <span>{comment.likes?.length || 0}</span>
                        </button>

                        <button
                            className={styles.commentActionBtn}
                            onClick={() => onReply(comment)}
                            title="Responder"
                        >
                            <ReplyIcon size={14} />
                        </button>
                    </div>
                </div>

                {/* Owner Actions - Absolute positioned top-right */}
                {isOwner && !isEditing && (
                    <div className={styles.ownerActions}>
                        <button
                            className={styles.deleteCommentBtn}
                            onClick={() => setIsEditing(true)}
                            title="Editar"
                        >
                            <EditIcon size={14} />
                        </button>
                        <button
                            className={styles.deleteCommentBtn}
                            onClick={() => onDelete(postId, comment)}
                            title="Excluir"
                        >
                            <DeleteIcon size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Render children (nested replies list or input) - Outside the flex container */}
            {children}
        </div>
    );
};
