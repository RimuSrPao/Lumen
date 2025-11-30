import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';

export function useUserFriends(userId) {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const friendshipsRef = collection(db, 'friendships');
        // Buscar onde o usuário é um dos participantes
        const q = query(friendshipsRef, where('users', 'array-contains', userId));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            try {
                const acceptedFriendships = snapshot.docs.filter(doc => doc.data().status === 'accepted');

                const friendsPromises = acceptedFriendships.map(async (friendshipDoc) => {
                    const data = friendshipDoc.data();
                    const friendId = data.users.find(uid => uid !== userId);

                    if (!friendId) return null;

                    // Buscar dados do amigo
                    const userRef = doc(db, 'users', friendId);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        return {
                            id: userSnap.id,
                            uid: userSnap.id, // Garantir compatibilidade com UserProfile
                            ...userSnap.data(),
                            friendshipId: friendshipDoc.id
                        };
                    } else {
                        // Fallback se o usuário não tiver documento (ex: auth apenas)
                        return {
                            id: friendId,
                            uid: friendId, // Garantir compatibilidade com UserProfile
                            displayName: 'Usuário',
                            photoURL: null
                        };
                    }
                });

                const friendsData = await Promise.all(friendsPromises);
                setFriends(friendsData.filter(f => f !== null));
                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar amigos:", err);
                setError(err);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [userId]);

    return { friends, loading, error };
}
