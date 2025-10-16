import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function createPortfolio(formData) {
    return {
        ...formData,
        isPublic: false, // Default to private
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
