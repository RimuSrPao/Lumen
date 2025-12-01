import React, { useState, useRef } from 'react';
import styles from './NewsFeed.module.css';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

import { Loader2, X, Send, Image as ImageIcon, Bold, Italic, Code, Link, Heading1, Heading2, Heading3, List, ListOrdered } from 'lucide-react';
import { compressImage } from '../../utils/compressImage';
import { RichTextRenderer } from '../RichTextRenderer';
import { CodeEditorDialog } from '../CodeEditorDialog';

export function CreateNews({ onCancel, onSuccess }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Geral');
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingContentImage, setUploadingContentImage] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const contentFileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

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
        setContent(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const uploadImage = async (file) => {
        const compressedFile = await compressImage(file, 1920, 1920, 0.7);
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('upload_preset', 'lumen_uploads');

        const response = await fetch('https://api.cloudinary.com/v1_1/dasntpbd3/image/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Falha no upload da imagem');
        const data = await response.json();
        return data.secure_url;
    };

    const handleContentImageUpload = async (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setUploadingContentImage(true);
            try {
                const url = await uploadImage(file);
                const imageMarkdown = `\n![Imagem do conteúdo](${url})\n`;

                const textarea = textareaRef.current;
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = textarea.value;
                    const before = text.substring(0, start);
                    const after = text.substring(end);

                    const newText = before + imageMarkdown + after;
                    setContent(newText);

                    setTimeout(() => {
                        textarea.focus();
                        const newCursorPos = start + imageMarkdown.length;
                        textarea.setSelectionRange(newCursorPos, newCursorPos);
                    }, 0);
                }
            } catch (error) {
                console.error("Erro ao fazer upload da imagem de conteúdo:", error);
                alert("Erro ao enviar imagem. Tente novamente.");
            } finally {
                setUploadingContentImage(false);
                if (contentFileInputRef.current) contentFileInputRef.current.value = '';
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const text = textarea.value;
            const currentLineStart = text.lastIndexOf('\n', start - 1) + 1;
            const currentLine = text.substring(currentLineStart, start);

            // Regex para detectar listas (- item ou 1. item)
            const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.)\s/);

            if (listMatch) {
                e.preventDefault();
                const [fullMatch, indent, marker] = listMatch;

                // Se a linha estiver vazia (só o marcador), remove o marcador
                if (currentLine.trim() === marker || currentLine.trim() === marker + '.') {
                    const newText = text.substring(0, currentLineStart) + text.substring(start);
                    setContent(newText);
                    setTimeout(() => {
                        textarea.setSelectionRange(currentLineStart, currentLineStart);
                    }, 0);
                    return;
                }

                let nextMarker = marker;
                // Se for lista numerada, incrementa o número
                if (/^\d+\.$/.test(marker)) {
                    const num = parseInt(marker);
                    nextMarker = `${num + 1}.`;
                }

                const insertion = `\n${indent}${nextMarker} `;
                const newText = text.substring(0, start) + insertion + text.substring(textarea.selectionEnd);

                setContent(newText);
                setTimeout(() => {
                    textarea.setSelectionRange(start + insertion.length, start + insertion.length);
                }, 0);
            }
        }
    };

    const handleCodeInsert = (codeBlock) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end);

            // Adiciona quebras de linha se necessário
            const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
            const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';

            const newText = before + prefix + codeBlock + suffix + after;
            setContent(newText);

            setTimeout(() => {
                textarea.focus();
                const newCursorPos = start + prefix.length + codeBlock.length + suffix.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setLoading(true);
        try {
            let finalImageUrl = null;
            if (selectedImage) {
                finalImageUrl = await uploadImage(selectedImage);
            }

            await addDoc(collection(db, 'news'), {
                title: title.trim(),
                content: content.trim(),
                category,
                imageUrl: finalImageUrl,
                createdAt: serverTimestamp(),
                author: 'Lumen Team'
            });

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro ao criar notícia:", error);
            alert("Erro ao publicar notícia. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.splitView}>
            <div className={styles.createFormContainer}>
                <div className={styles.formHeader}>
                    <h3>Nova Notícia</h3>
                    <button onClick={onCancel} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Título da Notícia"
                        className={styles.input}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={loading}
                        autoFocus
                    />

                    <div className={styles.row}>
                        <select
                            className={styles.select}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={loading}
                        >
                            <option value="Geral">Geral</option>
                            <option value="Lançamento">Lançamento</option>
                            <option value="Dicas">Dicas</option>
                            <option value="Sistema">Sistema</option>
                            <option value="Comunidade">Comunidade</option>
                            <option value="Evento">Evento</option>
                            <option value="Importante">Importante</option>
                            <option value="Manutenção">Manutenção</option>
                            <option value="Parceria">Parceria</option>
                        </select>

                        <div className={styles.imageUploadContainer}>
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className={styles.imageUploadButton}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                            >
                                <ImageIcon size={18} />
                                {selectedImage ? 'Alterar Capa' : 'Adicionar Capa'}
                            </button>
                            {previewUrl && (
                                <div className={styles.previewWrapper}>
                                    <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                                    <button
                                        type="button"
                                        className={styles.removeImageButton}
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setPreviewUrl('');
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.editorToolbar}>
                        <button type="button" onClick={() => insertFormat('**', '**')} title="Negrito"><Bold size={16} /></button>
                        <button type="button" onClick={() => insertFormat('*', '*')} title="Itálico"><Italic size={16} /></button>
                        <div className={styles.divider} />
                        <button type="button" onClick={() => insertFormat('# ', '')} title="Título 1"><Heading1 size={16} /></button>
                        <button type="button" onClick={() => insertFormat('## ', '')} title="Título 2"><Heading2 size={16} /></button>
                        <button type="button" onClick={() => insertFormat('### ', '')} title="Título 3"><Heading3 size={16} /></button>
                        <div className={styles.divider} />
                        <button type="button" onClick={() => insertFormat('- ', '')} title="Lista"><List size={16} /></button>
                        <button type="button" onClick={() => insertFormat('1. ', '')} title="Lista Numerada"><ListOrdered size={16} /></button>
                        <div className={styles.divider} />
                        <button type="button" onClick={() => setShowCodeEditor(true)} title="Inserir Código"><Code size={16} /></button>
                        <button type="button" onClick={() => insertFormat('[', '](url)')} title="Link"><Link size={16} /></button>
                        <button
                            type="button"
                            onClick={() => contentFileInputRef.current?.click()}
                            title="Inserir Imagem no Texto"
                            disabled={uploadingContentImage}
                        >
                            {uploadingContentImage ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                        </button>
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            ref={contentFileInputRef}
                            onChange={handleContentImageUpload}
                        />
                    </div>

                    <textarea
                        ref={textareaRef}
                        placeholder="Conteúdo da novidade (Markdown suportado)..."
                        className={styles.textarea}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />

                    <div className={styles.formActions}>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading || !title.trim() || !content.trim()}
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>
                                    <Send size={18} /> Publicar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className={styles.livePreviewPanel}>
                <div className={styles.previewHeader}>
                    <h4>Preview em Tempo Real</h4>
                </div>
                <div className={styles.previewContent}>
                    {content ? (
                        <RichTextRenderer text={content} />
                    ) : (
                        <div className={styles.emptyPreview}>
                            <p>O conteúdo da sua notícia aparecerá aqui conforme você digita.</p>
                        </div>
                    )}
                </div>
            </div>

            <CodeEditorDialog
                isOpen={showCodeEditor}
                onClose={() => setShowCodeEditor(false)}
                onInsert={handleCodeInsert}
            />
        </div>
    );
}
