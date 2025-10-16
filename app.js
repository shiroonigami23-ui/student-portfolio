import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as UI from './ui.js';
import * as Editor from './editor.js';
import * as Storage from './storage.js';
import { showAlert, showConfirmation } from './modal.js';
import { showToast } from './notifications.js';
import { validatePortfolio } from './validator.js';
import { improveWriting, generateBulletPoints } from './ai.js';

let currentUser = null;
let currentlyEditingId = null;
let portfoliosCache = [];

// --- APPLICATION INITIALIZATION ---
async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const publicId = urlParams.get('id');

    if (publicId) {
        await handlePublicView(publicId);
        return;
    }

    // --- THE DEFINITIVE FIX FOR THE LOGIN SCREEN ---
    // 1. Establish a clear, non-ambiguous starting state for the UI.
    //    We explicitly show the login view FIRST, before doing anything else.
    //    This prevents any flicker or race conditions.
    UI.showView('login-view');
    UI.updateHeader('login', null);

    Editor.init();
    Editor.setupLiveValidation();

    // 2. Set up the listener that will react to Firebase's authentication check.
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            // 3. Firebase has now confirmed a user is logged in.
            //    We can now definitively switch to the dashboard.
            await handleUserLoggedIn(user);
        } else {
            // 4. Firebase has confirmed NO user is logged in.
            //    The view is already correctly set to 'login-view'.
            handleUserLoggedOut();
        }
    });

    setupAllEventListeners();
}

// --- CORE LOGIC FUNCTIONS ---

async function handleUserLoggedIn(user) {
    UI.showView('dashboard-view');
    UI.updateHeader('dashboard', user);
    UI.applyTheme(localStorage.getItem('theme') || 'theme-space');
    portfoliosCache = await Storage.getPortfolios(user.uid);
    UI.renderDashboard(portfoliosCache);
}

function handleUserLoggedOut() {
    portfoliosCache = [];
    currentlyEditingId = null;
    UI.updateHeader('login', null);
    UI.showView('login-view');
}

async function handlePublicView(portfolioId) {
    const appContainer = document.getElementById('app-container');
    document.getElementById('app-header').innerHTML = '';
    const portfolioData = await Storage.getPublicPortfolioById(portfolioId);
    if (portfolioData) {
        appContainer.innerHTML = `<main id="main-content"><div id="preview-view" class="view active"><div id="portfolio-preview-content"></div></div></main>`;
        UI.applyTheme(portfolioData.theme || 'theme-space');
        await UI.renderPortfolioPreview(portfolioData);
    } else {
        appContainer.innerHTML = `<p class="error-message">Sorry, this portfolio could not be found or is not public.</p>`;
    }
}

// --- EVENT LISTENERS SETUP ---
function setupAllEventListeners() {
    // Handles all clicks within the main content area
    document.getElementById('main-content').addEventListener('click', mainContentClickHandler);
    // Handles clicks within the header
    document.getElementById('header-actions').addEventListener('click', headerClickHandler);
    // Handles theme changes from the header dropdown
    document.getElementById('header-actions').addEventListener('change', headerChangeHandler);
    // Handles all clicks within the Share Modal
    document.getElementById('share-modal-overlay').addEventListener('click', shareModalClickHandler);
    
    // --- THE DEFINITIVE FIX FOR THE AI MODAL ---
    // A separate, dedicated event listener for the AI modal overlay, which
    // is outside of the #main-content element.
    document.getElementById('ai-modal-overlay').addEventListener('click', aiModalClickHandler);
}

// --- EVENT HANDLER FUNCTIONS ---

async function mainContentClickHandler(e) {
    const target = e.target;
    // AI Assist Button
    if (target.closest('.ai-assist-btn')) {
        const textarea = target.closest('.textarea-wrapper')?.querySelector('textarea');
        if (textarea) UI.showAiModal(textarea);
        return;
    }
    // All other buttons
    const button = target.closest('button');
    if (!button) return;
    const { id } = button;
    const { action, id: dataId } = button.dataset;
    if (id === 'google-signin-btn') await signInWithPopup(auth, new GoogleAuthProvider()).catch(err => showAlert("Sign-In Failed", err.message));
    if (id === 'create-new-btn') navigateToEditor();
    if (id === 'import-portfolio-btn') handleImport();
    if (id === 'save-portfolio-btn') await handleSavePortfolio();
    if (id === 'cancel-edit-btn') navigateTo('dashboard');
    if (action === 'edit') navigateToEditor(dataId);
    if (action === 'delete') showConfirmation("Delete Portfolio?", "This cannot be undone.", () => handleDelete(dataId));
    if (action === 'preview') {
        const portfolio = portfoliosCache.find(p => p.id === dataId);
        if (portfolio) navigateTo('preview', portfolio);
    }
    if (action === 'share') {
        const portfolio = portfoliosCache.find(p => p.id === dataId);
        if (portfolio) {
            currentlyEditingId = dataId;
            UI.showShareModal(dataId, portfolio.isPublic);
        }
    }
}

async function headerClickHandler(e) {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.id === 'logout-btn') await signOut(auth);
    if (button.id === 'back-to-dashboard-btn') navigateTo('dashboard');
    if (button.id === 'download-pdf-btn') UI.downloadAsPDF();
}

function headerChangeHandler(e) {
    if (e.target.id === 'theme-select') {
        const newTheme = e.target.value;
        UI.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }
}

async function shareModalClickHandler(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const { id } = button;
    if (id === 'close-share-btn') {
        UI.hideShareModal();
        return;
    }
    const portfolio = portfoliosCache.find(p => p.id === currentlyEditingId);
    if (!portfolio) return;
    if (id === 'make-public-btn') {
        await Storage.makePortfolioPublic(currentlyEditingId, portfolio);
        showToast('Portfolio is now public!', 'success');
        navigateTo('dashboard');
        UI.hideShareModal();
    } else if (id === 'make-private-btn') {
        await Storage.makePortfolioPrivate(currentlyEditingId);
        showToast('Portfolio is now private.');
        navigateTo('dashboard');
        UI.hideShareModal();
    } else if (id === 'copy-link-btn') {
        navigator.clipboard.writeText(document.getElementById('share-link-input').value).then(() => showToast('Link copied!'));
    }
}

async function aiModalClickHandler(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const { action } = button.dataset;
    const activeTextarea = UI.getActiveAiTextarea();
    if (!activeTextarea && action !== 'close') return;

    if (action === 'improve' || action === 'bullets') {
        UI.setAiModalState('loading');
        const originalText = activeTextarea.value;
        const newText = action === 'improve' ? await improveWriting(originalText) : await generateBulletPoints(originalText);
        UI.setAiModalState('result', newText);
    } else if (action === 'use-text') {
        activeTextarea.value = document.getElementById('ai-result-textarea').value;
        UI.hideAiModal();
    } else if (action === 'close') {
        UI.hideAiModal();
    }
}

// --- Navigation and Data Handling ---

async function navigateToEditor(id = null) {
    currentlyEditingId = id;
    if (id) {
        const portfolio = await Storage.getPortfolioById(currentUser.uid, id);
        Editor.populateForm(portfolio);
    } else {
        Editor.resetForm();
    }
    navigateTo('editor');
}

async function handleSavePortfolio() {
    const data = Editor.collectFormData();
    const errors = validatePortfolio(data);
    if (errors.length > 0) {
        return showAlert("Invalid Input", errors.map(e => e.message).join('\n'));
    }
    try {
        if (currentlyEditingId) {
            await Storage.updatePortfolio(currentUser.uid, currentlyEditingId, data);
            showToast("Portfolio updated!", 'success');
        } else {
            await Storage.addPortfolio(currentUser.uid, data);
            showToast("Portfolio created!", 'success');
        }
        navigateTo('dashboard');
    } catch (error) {
        console.error("Save Error:", error);
        showAlert("Save Error", "Could not save portfolio.");
    }
}

async function handleDelete(id) {
    try {
        await Storage.deletePortfolio(currentUser.uid, id);
        await Storage.makePortfolioPrivate(id).catch(() => {});
        navigateTo('dashboard');
        showToast("Portfolio deleted.");
    } catch (error) {
        console.error("Delete Error:", error);
        showAlert("Delete Error", "Could not delete portfolio.");
    }
}

function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // Basic validation to ensure it looks like a portfolio
                if (data.portfolioTitle && data.firstName) {
                    await Storage.addPortfolio(currentUser.uid, data);
                    navigateTo('dashboard');
                    showToast("Portfolio imported!", 'success');
                } else {
                    showAlert("Import Failed", "The selected file does not appear to be a valid portfolio.");
                }
            } catch (error) {
                showAlert("Import Failed", "Invalid portfolio file. Could not parse JSON.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function navigateTo(view, data = null) {
    UI.showView(`${view}-view`);
    UI.updateHeader(view, currentUser);
    if (view === 'preview' && data?.theme) {
        UI.applyTheme(data.theme);
    } else {
        UI.applyTheme(localStorage.getItem('theme') || 'theme-space');
    }
    if (view === 'dashboard') {
        portfoliosCache = await Storage.getPortfolios(currentUser.uid);
        UI.renderDashboard(portfoliosCache);
    } else if (view === 'editor') {
        document.getElementById('editor-title').textContent = currentlyEditingId ? 'Edit Portfolio' : 'Create New Portfolio';
    } else if (view === 'preview' && data) {
        await UI.renderPortfolioPreview(data);
    }
}

document.addEventListener('DOMContentLoaded', init);
