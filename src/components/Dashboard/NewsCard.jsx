import React from 'react';
import styles from './NewsCard.module.css';
import { Trash2 } from 'lucide-react';

// Utility to extract plain text preview from markdown
const getPreview = (markdown, maxLength = 150) => {
    if (!markdown) return '';
    // Remove markdown syntax
    let text = markdown
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
        .replace(/#+\s/g, '') // Remove headers
        .replace(/[*_~]/g, '') // Remove bold, italic, strikethrough
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();

    if (text.length > maxLength) {
        return text.substring(0, maxLength).trim() + '...';
    }
    return text;
};

export function NewsCard({ news, onClick, isAdmin, onDelete }) {
    const preview = getPreview(news.content, 150);
    const formattedDate = news.createdAt?.toDate().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Fallback gradient if no image
    const bgStyle = news.imageUrl ? {} : {
        background: 'linear-gradient(135deg, #2a2a30 0%, #1a1a1d 100%)'
    };

    return (
        <article className={styles.card} onClick={onClick}>
            <div className={styles.imageContainer} style={bgStyle}>
                {news.imageUrl && (
                    <img src={news.imageUrl} alt={news.title} className={styles.image} />
                )}
                <div className={styles.overlay} />
                <span className={styles.category}>{news.category || 'Geral'}</span>
                {isAdmin && (
                    <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        title="Excluir notícia"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{news.title}</h3>
                {preview && <p className={styles.preview}>{preview}</p>}
                <div className={styles.meta}>
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>{news.author || 'Lumen Team'}</span>
                </div>
            </div>
        </article>
    );
}
