import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { TextWithEmojis } from './TextWithEmojis';
import { BoldIcon, ItalicIcon, StrikeIcon, CodeIcon, EmojiIcon, FormatIcon } from './Icons';
import styles from './CommentInput.module.css';
import { CodeEditorDialog } from './CodeEditorDialog';

export function CommentInput({
    placeholder = "Escreva um comentário...",
    buttonText = "Enviar",
    onSubmit,
    autoFocus = false,
    initialValue = ""
}) {
    const [text, setText] = useState(initialValue);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const emojiPickerRef = useRef(null);
    const inputRef = useRef(null);

    // Fechar emoji picker ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Auto-resize do textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
    }, [text]);

    const insertFormat = (prefix, suffix) => {
        const textarea = inputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = before + prefix + selection + suffix + after;
        setText(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const handleCodeInsert = (codeBlock) => {
        const textarea = inputRef.current;
        if (!textarea) {
            setText(prev => prev + '\n' + codeBlock + '\n');
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);

        const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
        const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';

        const newText = before + prefix + codeBlock + suffix + after;
        setText(newText);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + codeBlock.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleEmojiClick = (emojiObject) => {
        setText(prev => prev + emojiObject.emoji);
    };

    const handleSubmit = () => {
        if (text.trim()) {
            onSubmit(text);
            setText('');
            setShowEmojiPicker(false);
            // Reset height
            if (inputRef.current) {
                inputRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={styles.commentInputWrapper}>
            <div className={styles.commentInputContainer}>
                <div className={styles.leftActions}>
                    <div className={styles.commentEmojiWrapper} ref={emojiPickerRef}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="Adicionar emoji"
                        >
                            <EmojiIcon size={20} />
                        </button>
                        {showEmojiPicker && (
                            <div className={styles.commentEmojiPickerPopover}>
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    theme="dark"
                                    emojiStyle="apple"
                                    width={300}
                                    height={350}
                                    searchDisabled={false}
                                    skinTonesDisabled
                                />
                            </div>
                        )}
                    </div>

                    <button
                        className={`${styles.actionBtn} ${showToolbar ? styles.active : ''}`}
                        onClick={() => setShowToolbar(!showToolbar)}
                        title="Formatação"
                    >
                        <FormatIcon size={20} />
                    </button>
                </div>

                <div className={styles.inputArea}>
                    {showToolbar && (
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
                    )}

                    <textarea
                        ref={inputRef}
                        className={styles.commentInput}
                        placeholder={placeholder}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                </div>

                <button
                    className={styles.sendCommentBtn}
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    title="Enviar"
                >
                    {buttonText === "Enviar" ? <TextWithEmojis text="➤" size={16} /> : buttonText}
                </button>
            </div>

            <CodeEditorDialog
                isOpen={showCodeEditor}
                onClose={() => setShowCodeEditor(false)}
                onInsert={handleCodeInsert}
            />
        </div>
    );
}
