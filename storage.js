import { db } from './firebase.js';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createPortfolio, updatePortfolio as updatePortfolioObject } from './portfolio.js';

// --- USER PROFILE FUNCTIONS ---

/**
 * Gets a reference to the user's profile document.
 * @param {string} userId The user's unique ID.
 * @returns A DocumentReference for the user's profile.
 */
function getUserProfileRef(userId) {
    if (!userId) throw new Error("User not authenticated.");
    // We store user profile data in a separate 'profiles' collection
    // to keep it distinct from the main user data potentially used by Firebase Auth.
    return doc(db, 'users', userId, 'profile', 'data');
}


/**
 * Retrieves a user's profile data (e.g., profile picture URL).
 * @param {string} userId The user's unique ID.
 * @returns {Promise<object|null>} The user profile data or null if not found.
 */
export async function getUserProfile(userId) {
    const profileRef = getUserProfileRef(userId);
    try {
        const docSnap = await getDoc(profileRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
}

/**
 * Updates a user's profile data.
 * @param {string} userId The user's unique ID.
 * @param {object} data The data to update (e.g., { photoURL: '...' }).
 */
export async function updateUserProfile(userId, data) {
    const profileRef = getUserProfileRef(userId);
    try {
        // Use setDoc with merge: true to create or update the document.
        await setDoc(profileRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
}


// --- PORTFOLIO FUNCTIONS (Unchanged) ---

function getUserPortfoliosRef(userId) {
    if (!userId) throw new Error("User not authenticated.");
    return collection(db, 'users', userId, 'portfolios');
}

export async function getPortfolios(userId) {
    const portfoliosRef = getUserPortfoliosRef(userId);
    try {
        const snapshot = await getDocs(portfoliosRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching portfolios:", error);
        throw error;
    }
}

export async function getPortfolioById(userId, id) {
    if (!userId) return null;
    try {
        const docRef = doc(db, 'users', userId, 'portfolios', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Error fetching portfolio by ID:", error);
        throw error;
    }
}

export async function addPortfolio(userId, portfolioData) {
    const portfoliosRef = getUserPortfoliosRef(userId);
    const newPortfolio = createPortfolio(portfolioData);
    try {
        const docRef = await addDoc(portfoliosRef, newPortfolio);
        return docRef.id;
    } catch (error) {
        console.error("Error adding portfolio:", error);
        throw error;
    }
}

export async function updatePortfolio(userId, id, updatedData) {
    const docRef = doc(db, 'users', userId, 'portfolios', id);
    const existingData = await getPortfolioById(userId, id);
    const dataToUpdate = updatePortfolioObject(existingData, updatedData);
    
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;

    try {
        await updateDoc(docRef, dataToUpdate);
    } catch (error) {
        console.error("Error updating portfolio:", error);
        throw error;
    }
}

export async function deletePortfolio(userId, id) {
    const docRef = doc(db, 'users', userId, 'portfolios', id);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting portfolio:", error);
        throw error;
    }
}

export async function togglePortfolioPublicStatus(userId, id) {
    const portfolio = await getPortfolioById(userId, id);
    if (!portfolio) throw new Error("Portfolio not found.");

    const newStatus = !portfolio.isPublic;
    const userPortfolioRef = doc(db, 'users', userId, 'portfolios', id);
    const publicPortfolioRef = doc(db, 'publicPortfolios', id);

    const publicData = { ...portfolio, isPublic: newStatus };
    delete publicData.id;

    if (newStatus) {
        await updateDoc(userPortfolioRef, { isPublic: newStatus });
        await setDoc(publicPortfolioRef, publicData);
    } else {
        await updateDoc(userPortfolioRef, { isPublic: newStatus });
        await deleteDoc(publicPortfolioRef);
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?shareId=${id}`;
    return { isPublic: newStatus, shareUrl };
}

export async function getPublicPortfolio(id) {
    try {
        const docRef = doc(db, 'publicPortfolios', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error fetching public portfolio:", error);
        return null;
    }
}
