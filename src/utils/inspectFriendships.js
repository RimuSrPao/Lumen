import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function inspectFriendships() {
    console.log("Inspecting friendships...");
    const snapshot = await getDocs(collection(db, 'friendships'));
    snapshot.forEach(doc => {
        console.log(`ID: ${doc.id}, Users: ${JSON.stringify(doc.data().users)}, Status: ${doc.data().status}`);
    });
    console.log("Inspection complete.");
}
