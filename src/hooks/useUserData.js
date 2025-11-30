import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { compressImage } from '../utils/compressImage';

export function useUserData(userId) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            setUserData(null);
            return;
        }

        setLoading(true);
        setUserData(null);

        const fetchUserData = async () => {
            try {
                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                } else {
                    // Se o documento não existir, criar um inicial com dados do Auth
                    // Isso garante que sempre teremos um documento para ler/atualizar
                    const currentUser = auth.currentUser;
                    // Só cria se o ID corresponder ao usuário logado, senão não temos os dados do Auth
                    // Se for outro usuário e não tiver doc, retornamos null (ou lidamos na UI)
                    if (currentUser && currentUser.uid === userId) {
                        const initialData = {
                            displayName: currentUser.displayName,
                            email: currentUser.email,
                            photoURL: currentUser.photoURL,
                            bio: '',
                            bannerURL: '',
                            createdAt: new Date().toISOString()
                        };
                        await setDoc(userDocRef, initialData);
                        setUserData(initialData);
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar dados do usuário:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    const updateUserData = async (newData) => {
        if (!userId) return;
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', userId);

            // Atualizar Firestore
            await updateDoc(userDocRef, newData);

            // Atualizar estado local
            setUserData(prev => ({ ...prev, ...newData }));

            // Se houver mudança de nome ou foto, atualizar também o Auth Profile
            // para manter consistência em lugares que usam auth.currentUser
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.uid === userId) {
                const profileUpdates = {};
                if (newData.displayName) profileUpdates.displayName = newData.displayName;
                if (newData.photoURL) profileUpdates.photoURL = newData.photoURL;

                if (Object.keys(profileUpdates).length > 0) {
                    await updateProfile(currentUser, profileUpdates);
                }
            }

        } catch (err) {
            console.error("Erro ao atualizar dados:", err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file) => {
        if (!userId) return;
        try {
            // Comprimir imagem antes do upload
            const compressedFile = await compressImage(file, 1920, 1920, 0.7);

            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('upload_preset', 'lumen_uploads');

            const response = await fetch('https://api.cloudinary.com/v1_1/dasntpbd3/image/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Falha no upload da imagem');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (err) {
            console.error("Erro ao fazer upload da imagem:", err);
            throw err;
        }
    };

    return { userData, loading, error, updateUserData, uploadImage };
}
