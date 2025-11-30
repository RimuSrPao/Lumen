import { dbRealtime } from '../firebase';
import { ref, get } from 'firebase/database';

export async function inspectPresence() {
    console.log("Inspecting RTDB Presence...");
    const statusRef = ref(dbRealtime, '/status');
    try {
        const snapshot = await get(statusRef);
        if (snapshot.exists()) {
            console.log("Current Online Statuses:", snapshot.val());
        } else {
            console.log("No presence data found in RTDB.");
        }
    } catch (error) {
        console.error("Error reading RTDB:", error);
    }
}
