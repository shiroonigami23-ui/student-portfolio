
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export function createPortfolio(formData) {
    return {
        ...formData,
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp(),
    };
}

export function updatePortfolio(existingData, newData) {
     return {
        ...existingData,
        ...newData,
        lastModified: serverTimestamp(),
    };
}
