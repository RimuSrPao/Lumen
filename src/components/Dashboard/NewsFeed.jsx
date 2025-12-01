import React, { useState, useEffect } from 'react';
import styles from './NewsFeed.module.css';
import { NewsCard } from './NewsCard';
import { CreateNews } from './CreateNews';
import { NewsDetail } from './NewsDetail';
import { ConfirmationModal } from '../ConfirmationModal';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, ShieldAlert } from 'lucide-react';

export function NewsFeed({ user }) {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [newsToDelete, setNewsToDelete] = useState(null);

    // Verificar Admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user?.uid) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().isAdmin === true) {
                    setIsAdmin(true);
                }
            } catch (error) {
                console.error("Erro ao verificar admin:", error);
            }
        };
        checkAdminStatus();
    }, [user]);

    // Função Dev Temporária
    const promoteMe = async () => {
        if (!user?.uid) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), { isAdmin: true });
            setIsAdmin(true);
            alert("Você agora é Admin! O botão de criar notícia deve aparecer.");
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao promover.");
        }
    };

    const confirmDelete = async () => {
        if (!newsToDelete) return;
        try {
            await deleteDoc(doc(db, 'news', newsToDelete.id));
            setDeleteModalOpen(false);
            setNewsToDelete(null);
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir notícia.");
        }
    };

    // Buscar Notícias
    useEffect(() => {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Converter timestamp para data legível
                    date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    }) : 'Data desconhecida'
                };
            });
            setNews(newsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (selectedNews) {
        return <NewsDetail news={selectedNews} onBack={() => setSelectedNews(null)} />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>Novidades & Updates</h1>
                        <p className={styles.subtitle}>Fique por dentro de tudo que acontece no universo Lumen.</p>
                    </div>

                    {isAdmin && !isCreating && (
                        <button
                            className={styles.createButton}
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus size={20} /> Nova Notícia
                        </button>
                    )}
                </div>

                {/* Botão DEV Temporário */}
                {!isAdmin && (
                    <button onClick={promoteMe} className={styles.devButton}>
                        <ShieldAlert size={16} /> (DEV) Virar Admin
                    </button>
                )}
            </div>

            {isCreating && (
                <div className={styles.createWrapper}>
                    <CreateNews
                        onCancel={() => setIsCreating(false)}
                        onSuccess={() => setIsCreating(false)}
                    />
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setNewsToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Excluir Notícia"
                message={`Tem certeza que deseja excluir a notícia "${newsToDelete?.title}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                isDangerous={true}
            />

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.loading}>Carregando novidades...</div>
                ) : news.length === 0 ? (
                    <div className={styles.empty}>Nenhuma novidade encontrada.</div>
                ) : (
                    news.map(newsItem => (
                        <NewsCard
                            key={newsItem.id}
                            news={newsItem}
                            onClick={() => setSelectedNews(newsItem)}
                            isAdmin={isAdmin}
                            onDelete={() => {
                                setNewsToDelete(newsItem);
                                setDeleteModalOpen(true);
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
