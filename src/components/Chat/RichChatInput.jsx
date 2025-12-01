import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { TextWithEmojis } from '../TextWithEmojis';
import { BoldIcon, ItalicIcon, StrikeIcon, CodeIcon, EmojiIcon, FormatIcon, ImageIcon } from '../Icons';
import styles from './RichChatInput.module.css';
import { CodeEditorDialog } from '../CodeEditorDialog';

export function RichChatInput({
    placeholder = "Digite sua mensagem...",
    onSendMessage,
    autoFocus = true
}) {
    const [text, setText] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);

    const emojiPickerRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

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

    const handleImageSelect = (e) => {
        if (e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
            // Focar no input após selecionar imagem
            if (inputRef.current) inputRef.current.focus();
        }
    };

    const insertFormat = (prefix, suffix) => {
        const textarea = inputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textVal = textarea.value;
        const before = textVal.substring(0, start);
        const selection = textVal.substring(start, end);
        const after = textVal.substring(end);

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
        const textVal = textarea.value;
        const before = textVal.substring(0, start);
        const after = textVal.substring(end);

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
        if (text.trim() || selectedImage) {
            onSendMessage(text, selectedImage);
            setText('');
            setSelectedImage(null);
            setShowEmojiPicker(false);
            if (fileInputRef.current) fileInputRef.current.value = '';

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
        <div className={styles.richInputWrapper}>
            {selectedImage && (
                <div className={styles.imagePreviewContainer}>
                    <img src={URL.createObjectURL(selectedImage)} alt="Preview" className={styles.imagePreview} />
                    <button className={styles.removeImageBtn} onClick={() => setSelectedImage(null)}>
                        <TextWithEmojis text="✕" size={14} />
                    </button>
                </div>
            )}

            <div className={styles.inputContainer}>
                <div className={styles.leftActions}>
                    <label className={styles.actionBtn} title="Adicionar Imagem">
                        <ImageIcon size={20} />
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />
                    </label>

                    <div className={styles.emojiWrapper} ref={emojiPickerRef}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="Adicionar emoji"
                        >
                            <EmojiIcon size={20} />
                        </button>
                        {showEmojiPicker && (
                            <div className={styles.emojiPickerPopover}>
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
                        className={styles.chatInput}
                        placeholder={placeholder}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                </div>

                <button
                    className={styles.sendBtn}
                    onClick={handleSubmit}
                    disabled={!text.trim() && !selectedImage}
                    title="Enviar"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
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
