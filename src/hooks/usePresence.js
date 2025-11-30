import { useEffect } from 'react';
import { db, dbRealtime } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';

export function usePresence(userId) {
    useEffect(() => {
        if (!userId) return;

        const userStatusDatabaseRef = ref(dbRealtime, '/status/' + userId);
        const userStatusFirestoreRef = doc(db, 'users', userId);

        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: rtdbServerTimestamp(),
        };

        const isOnlineForDatabase = {
            state: 'online',
            last_changed: rtdbServerTimestamp(),
        };

        const connectedRef = ref(dbRealtime, '.info/connected');

        const unsubscribe = onValue(connectedRef, async (snapshot) => {
            if (snapshot.val() === false) {
                return;
            }

            try {
                // Quando desconectar, definir como offline no RTDB
                await onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase);

                // Definir como online no RTDB
                await set(userStatusDatabaseRef, isOnlineForDatabase);

                // Atualizar Firestore para online
                await updateDoc(userStatusFirestoreRef, {
                    isOnline: true,
                    lastSeen: serverTimestamp()
                });
            } catch (error) {
                console.error("Erro ao definir presença:", error);
            }
        });

        // Cleanup manual ao desmontar (opcional, pois onDisconnect cuida do fechamento abrupto)
        return () => {
            unsubscribe();
            set(userStatusDatabaseRef, isOfflineForDatabase);
            updateDoc(userStatusFirestoreRef, {
                isOnline: false,
                lastSeen: serverTimestamp()
            }).catch(err => console.error("Erro ao definir offline no cleanup:", err));
        };
    }, [userId]);
}
