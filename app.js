import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as UI from './ui.js';
import * as Editor from './editor.js';
import * as Storage from './storage.js';
import { showAlert, showConfirmation } from './modal.js';
import { showToast } from './notifications.js';
import { validatePortfolio } from './validator.js';
import { improveWriting, generateBulletPoints } from './ai.js';

// --- Global State ---
let currentUser = null;
let currentlyEditingId = null;
let portfoliosCache = [];

// =================================================================================
// --- 1. APPLICATION INITIALIZATION (THE CORE FIX) ---
// This function's logic is now sequential and deterministic to eliminate the race condition.
// =================================================================================
async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const publicId = urlParams.get('id');
    if (publicId) {
        await handlePublicView(publicId);
        return; // Stop execution for public portfolio views.
    }

    // --- RACE CONDITION FIX ---
    // STEP A: Immediately and explicitly set the UI to a known starting state.
    // By showing the login view FIRST, we prevent any other view from rendering
    // while we wait for the asynchronous Firebase authentication check.
    UI.showView('login-view');
    UI.updateHeader('login', null);

    // Initialize the editor and its validation logic once.
    Editor.init();
    Editor.setupLiveValidation();

    // STEP B: Set up the Firebase listener that will react to the authentication state.
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            // STEP C: ONLY after Firebase has definitively confirmed a user is logged in,
            // we proceed to the main dashboard view.
            await handleUserLoggedIn(user);
        } else {
            // STEP D: If Firebase confirms no user is logged in, the view is already
            // correctly set to 'login-view' from STEP A. We just clean up the state.
            handleUserLoggedOut();
        }
    });

    // STEP E: Set up all application event listeners.
    setupAllEventListeners();
}

// --- Core Application Logic ---

async function handleUserLoggedIn(user) {
    // Now we can safely show the dashboard.
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
    UI.showView('login-view'); // Re-affirm the view, just in case.
}

async function handlePublicView(portfolioId) {
    const appContainer = document.getElementById('app-container');
    document.getElementById('app-header').innerHTML = ''; // Public views don't need the header
    const portfolioData = await Storage.getPublicPortfolioById(portfolioId);
    if (portfolioData) {
        appContainer.innerHTML = `<main id="main-content"><div id="preview-view" class="view active"><div id="portfolio-preview-content"></div></div></main>`;
        UI.applyTheme(portfolioData.theme || 'theme-space');
        await UI.renderPortfolioPreview(portfolioData);
    } else {
        appContainer.innerHTML = `<p class="error-message">Sorry, this portfolio could not be found or is not public.</p>`;
    }
}

// =================================================================================
// --- 2. EVENT LISTENERS SETUP (THE SECOND CORE FIX) ---
// =================================================================================
function setupAllEventListeners() {
    // This listener handles all clicks within the main content area.
    document.getElementById('main-content').addEventListener('click', mainContentClickHandler);
    
    // These listeners handle actions in the header and share modal.
    document.getElementById('header-actions').addEventListener('click', headerClickHandler);
    document.getElementById('header-actions').addEventListener('change', headerChangeHandler);
    document.getElementById('share-modal-overlay').addEventListener('click', shareModalClickHandler);
    
    // --- UNRESPONSIVE MODAL FIX ---
    // A separate, dedicated event listener is created for the AI modal overlay.
    // Because the AI modal is outside of '#main-content' in the HTML, the main
    // listener would never detect clicks inside it. This new listener solves that.
    document.getElementById('ai-modal-overlay').addEventListener('click', aiModalClickHandler);
}

// --- Event Handler Functions ---

async function mainContentClickHandler(e) {
    const target = e.target;
    // AI Assist Button (special case due to nesting)
    if (target.closest('.ai-assist-btn')) {
        const textarea = target.closest('.textarea-wrapper')?.querySelector('textarea');
        if (textarea) UI.showAiModal(textarea);
        return;
    }

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
        await navigateTo('dashboard');
        UI.hideShareModal();
    } else if (id === 'make-private-btn') {
        await Storage.makePortfolioPrivate(currentlyEditingId);
        showToast('Portfolio is now private.');
        await navigateTo('dashboard');
        UI.hideShareModal();
    } else if (id === 'copy-link-btn') {
        const input = document.getElementById('share-link-input');
        input.select();
        // Use the older execCommand for broader compatibility in sandboxed environments.
        document.execCommand('copy');
        showToast('Link copied!');
    }
}

// This handler is now correctly wired up in setupAllEventListeners and will work.
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
        if(portfolio) Editor.populateForm(portfolio);
    } else {
        Editor.resetForm();
    }
    await navigateTo('editor');
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
        await navigateTo('dashboard');
    } catch (error) {
        console.error("Save Error:", error);
        showAlert("Save Error", "Could not save portfolio.");
    }
}

async function handleDelete(id) {
    try {
        await Storage.deletePortfolio(currentUser.uid, id);
        await Storage.makePortfolioPrivate(id).catch(() => {});
        await navigateTo('dashboard');
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
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.portfolioTitle && data.firstName) {
                    await Storage.addPortfolio(currentUser.uid, data);
                    await navigateTo('dashboard');
                    showToast("Portfolio imported!", 'success');
                } else {
                    showAlert("Import Failed", "The selected file is not a valid portfolio.");
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

// --- Start the Application ---
document.addEventListener('DOMContentLoaded', init);
