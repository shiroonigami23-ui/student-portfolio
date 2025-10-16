import { db, auth } from './firebase.js';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createPortfolio, updatePortfolio as updatePortfolioObject } from './portfolio.js';

function getUserPortfoliosRef(userId) {
    if (!userId) throw new Error("User not authenticated.");
    return collection(db, 'users', userId, 'portfolios');
}

export async function getPortfolios(userId) {
    const snapshot = await getDocs(getUserPortfoliosRef(userId));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPortfolioById(userId, id) {
    if (!userId) return null;
    const docRef = doc(db, 'users', userId, 'portfolios', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addPortfolio(userId, portfolioData) {
    const newPortfolio = createPortfolio(portfolioData);
    const docRef = await addDoc(getUserPortfoliosRef(userId), newPortfolio);
    return docRef.id;
}

export async function updatePortfolio(userId, id, updatedData) {
    const docRef = doc(db, 'users', userId, 'portfolios', id);
    const existingData = await getPortfolioById(userId, id);
    const dataToUpdate = updatePortfolioObject(existingData, updatedData);
    delete dataToUpdate.id;
    await updateDoc(docRef, dataToUpdate);
}

export async function deletePortfolio(userId, id) {
    const docRef = doc(db, 'users', userId, 'portfolios', id);
    await deleteDoc(docRef);
}

// --- PUBLIC/SHARING FUNCTIONS ---

export async function makePortfolioPublic(portfolioId, portfolioData) {
    const publicDocRef = doc(db, 'publicPortfolios', portfolioId);
    await setDoc(publicDocRef, portfolioData);
    const privateDocRef = doc(db, 'users', auth.currentUser.uid, 'portfolios', portfolioId);
    await updateDoc(privateDocRef, { isPublic: true });
}

export async function makePortfolioPrivate(portfolioId) {
    const publicDocRef = doc(db, 'publicPortfolios', portfolioId);
    await deleteDoc(publicDocRef).catch(()=>{});
    const privateDocRef = doc(db, 'users', auth.currentUser.uid, 'portfolios', portfolioId);
    await updateDoc(privateDocRef, { isPublic: false });
}

export async function getPublicPortfolioById(portfolioId) {
    try {
        const docRef = doc(db, 'publicPortfolios', portfolioId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error("Error fetching public portfolio:", error);
        return null;
    }
}
