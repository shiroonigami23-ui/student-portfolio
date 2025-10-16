import { db, auth } from './firebase.js';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createPortfolio, updatePortfolio as updatePortfolioObject } from './portfolio.js';

// --- PRIVATE FUNCTIONS (Unchanged) ---
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
    // ... (This function remains unchanged)
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
    // ... (This function remains unchanged)
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
    // ... (This function remains unchanged)
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
    // ... (This function remains unchanged)
    const docRef = doc(db, 'users', userId, 'portfolios', id);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting portfolio:", error);
        throw error;
    }
}


// --- NEW PUBLIC FUNCTIONS ---

/**
 * Copies a portfolio to the public collection so it can be shared.
 * @param {string} portfolioId - The ID of the portfolio document.
 * @param {object} portfolioData - The full data of the portfolio.
 */
export async function makePortfolioPublic(portfolioId, portfolioData) {
    const publicDocRef = doc(db, 'publicPortfolios', portfolioId);
    try {
        // We use setDoc because the ID is the same as the private one.
        await setDoc(publicDocRef, portfolioData);
        // Also update the private version to know it's public.
        const privateDocRef = doc(db, 'users', auth.currentUser.uid, 'portfolios', portfolioId);
        await updateDoc(privateDocRef, { isPublic: true });
    } catch (error) {
        console.error("Error making portfolio public:", error);
        throw error;
    }
}

/**
 * Removes a portfolio from the public collection.
 * @param {string} portfolioId - The ID of the portfolio document.
 */
export async function makePortfolioPrivate(portfolioId) {
    const publicDocRef = doc(db, 'publicPortfolios', portfolioId);
    try {
        await deleteDoc(publicDocRef);
        // Also update the private version.
        const privateDocRef = doc(db, 'users', auth.currentUser.uid, 'portfolios', portfolioId);
        await updateDoc(privateDocRef, { isPublic: false });
    } catch (error) {
        console.error("Error making portfolio private:", error);
        throw error;
    }
}

/**
 * Fetches a single portfolio from the public collection.
 * @param {string} portfolioId The ID of the portfolio to fetch.
 * @returns {object|null} The portfolio data or null if not found.
 */
export async function getPublicPortfolioById(portfolioId) {
    try {
        const docRef = doc(db, 'publicPortfolios', portfolioId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Error fetching public portfolio:", error);
        return null; // Return null on error
    }
}
