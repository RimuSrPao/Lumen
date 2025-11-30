import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { TextWithEmojis } from '../TextWithEmojis';
import { BoldIcon, ItalicIcon, StrikeIcon, CodeIcon, ImageIcon, EmojiIcon } from '../Icons';

import styles from './CreatePost.module.css';
import { usePosts } from '../../hooks/usePosts';
import { CodeEditorDialog } from '../CodeEditorDialog';

export function CreatePost({ user, onShowAlert }) {
    const [newPostText, setNewPostText] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);

    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

    const { createPost } = usePosts();

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

    const handleImageSelect = (e) => {
        if (e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    const handleEmojiClick = (emojiObject) => {
        setNewPostText(prev => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleSubmit = async () => {
        if (!newPostText.trim() && !selectedImage) return;

        setIsUploading(true);
        try {
            await createPost(newPostText, selectedImage, user);

            // Reset form
            setNewPostText('');
            setSelectedImage(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error("Erro ao criar post:", error);
            if (onShowAlert) onShowAlert("Erro", `Erro ao publicar: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const textareaRef = useRef(null);

    const insertFormat = (prefix, suffix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = before + prefix + selection + suffix + after;
        setNewPostText(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const handleCodeInsert = (codeBlock) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setNewPostText(prev => prev + '\n' + codeBlock + '\n');
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);

        // Adiciona quebras de linha se necessário para separar do texto existente
        const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
        const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';

        const newText = before + prefix + codeBlock + suffix + after;
        setNewPostText(newText);

        // Foca após o bloco de código
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + codeBlock.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <div className={styles.createPostCard}>
            <textarea
                ref={textareaRef}
                className={styles.createPostInput}
                placeholder="O que está acontecendo?"
                rows="2"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
            ></textarea>

            {selectedImage && (
                <div className={styles.imagePreviewContainer}>
                    <img src={URL.createObjectURL(selectedImage)} alt="Preview" className={styles.imagePreview} />
                    <button className={styles.removeImageBtn} onClick={() => setSelectedImage(null)}>
                        <TextWithEmojis text="✕" size={16} />
                    </button>
                </div>
            )}


            <div className={styles.createPostActions}>
                <div className={styles.actionIcons}>
                    {/* Formatting Toolbar */}
                    <div className={styles.formatToolbar}>
                        <button className={styles.formatBtn} onClick={() => insertFormat('**', '**')} title="Negrito">
                            <BoldIcon size={18} />
                        </button>
                        <button className={styles.formatBtn} onClick={() => insertFormat('*', '*')} title="Itálico">
                            <ItalicIcon size={18} />
                        </button>
                        <button className={styles.formatBtn} onClick={() => insertFormat('~~', '~~')} title="Tachado">
                            <StrikeIcon size={18} />
                        </button>

                        <button className={styles.formatBtn} onClick={() => setShowCodeEditor(true)} title="Código">
                            <CodeIcon size={18} />
                        </button>
                    </div>

                    <div className={styles.divider}></div>

                    <label className={styles.iconBtn} title="Adicionar Imagem">
                        <ImageIcon size={20} />
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />
                    </label>
                    {/* Emoji Picker */}
                    <div className={styles.emojiContainer} ref={emojiPickerRef}>
                        <span className={styles.iconBtn} title="Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                            <EmojiIcon size={20} />
                        </span>
                        {showEmojiPicker && (
                            <div className={styles.emojiPickerPopover}>
                                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" emojiStyle="apple" width={300} height={400} />
                            </div>
                        )}
                    </div>
                </div>
                <button
                    className={styles.postBtn}
                    onClick={handleSubmit}
                    disabled={isUploading || (!newPostText.trim() && !selectedImage)}
                >
                    {isUploading ? 'Enviando...' : 'Publicar'}
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
