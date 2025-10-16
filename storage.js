import { db } from './firebase.js';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createPortfolio, updatePortfolio as updatePortfolioObject } from './portfolio.js';

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

export async function makePortfolioPublic(userId, portfolioId) {
    const userPortfolioRef = doc(db, 'users', userId, 'portfolios', portfolioId);
    const publicPortfolioRef = doc(db, 'publicPortfolios', portfolioId);

    try {
        const portfolioDoc = await getDoc(userPortfolioRef);
        if (portfolioDoc.exists()) {
            const portfolioData = portfolioDoc.data();
            await setDoc(publicPortfolioRef, portfolioData);
            await updateDoc(userPortfolioRef, { isPublic: true });
            return `${window.location.origin}${window.location.pathname}?shareId=${portfolioId}`;
        } else {
            throw new Error("Portfolio not found.");
        }
    } catch (error) {
        console.error("Error making portfolio public:", error);
        throw error;
    }
}

export async function getPublicPortfolio(portfolioId) {
    try {
        const docRef = doc(db, 'publicPortfolios', portfolioId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Error fetching public portfolio:", error);
        throw error;
    }
}
