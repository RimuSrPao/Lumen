import React, { useEffect, useRef } from 'react';
import styles from './NewsDetail.module.css';
import { ArrowLeft } from 'lucide-react';
import { RichTextRenderer } from '../RichTextRenderer';

export function NewsDetail({ news, onBack }) {
    const containerRef = useRef(null);

    useEffect(() => {
        // Scroll suave ao abrir a notícia
        if (containerRef.current) {
            containerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, [news]);

    const formattedDate = news.createdAt?.toDate().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className={styles.container} ref={containerRef}>
            <button onClick={onBack} className={styles.backButton}>
                <ArrowLeft size={20} /> Voltar para Novidades
            </button>

            <article className={styles.article}>
                {news.imageUrl && (
                    <div className={styles.heroImageContainer}>
                        <img src={news.imageUrl} alt={news.title} className={styles.heroImage} />
                        <div className={styles.heroOverlay} />
                    </div>
                )}

                <div className={styles.contentWrapper}>
                    <div className={styles.header}>
                        <span className={styles.category}>{news.category || 'Geral'}</span>
                        <h1 className={styles.title}>{news.title}</h1>
                        <div className={styles.meta}>
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{news.author || 'Lumen Team'}</span>
                        </div>
                    </div>

                    <div className={styles.content}>
                        <RichTextRenderer text={news.content} />
                    </div>
                </div>
            </article>
        </div>
    );
}
