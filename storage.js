import { db, auth } from './firebase.js';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createPortfolio, updatePortfolio as updatePortfolioObject } from './portfolio.js';

// Gets the reference to the current user's portfolios collection
function getUserPortfoliosRef() {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;
    return collection(db, 'users', userId, 'portfolios');
}

export async function getPortfolios() {
    const portfoliosRef = getUserPortfoliosRef();
    if (!portfoliosRef) return [];
    
    try {
        const snapshot = await getDocs(portfoliosRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching portfolios:", error);
        return [];
    }
}

export async function getPortfolioById(id) {
     const userId = auth.currentUser?.uid;
    if (!userId) return null;
    try {
        const docRef = doc(db, 'users', userId, 'portfolios', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Error fetching portfolio by ID:", error);
        return null;
    }
}

export async function addPortfolio(portfolioData) {
    const portfoliosRef = getUserPortfoliosRef();
    if (!portfoliosRef) throw new Error("User not authenticated.");

    const newPortfolio = createPortfolio(portfolioData);
    try {
        const docRef = await addDoc(portfoliosRef, newPortfolio);
        return docRef.id;
    } catch (error) {
        console.error("Error adding portfolio:", error);
    }
}

export async function updatePortfolio(updatedData) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated.");

    const docRef = doc(db, 'users', userId, 'portfolios', updatedData.id);
    const existingData = await getPortfolioById(updatedData.id);
    const dataToUpdate = updatePortfolioObject(existingData, updatedData);
    
    try {
        // We need to remove the id from the object before sending to firestore
        const { id, ...updatePayload } = dataToUpdate;
        await updateDoc(docRef, updatePayload);
    } catch (error) {
        console.error("Error updating portfolio:", error);
    }
}

export async function deletePortfolio(id) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated.");
    
    const docRef = doc(db, 'users', userId, 'portfolios', id);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting portfolio:", error);
    }
}

// Local theme storage remains, as it's a UI preference, not core data.
const THEME_KEY = 'portfolioApp.theme';
export function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}
export function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'theme-space';
}
