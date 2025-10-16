// --- IMPORTS ---
import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as UI from './ui.js';
import * as Editor from './editor.js';
import * as Storage from './storage.js';
import { showAlert, showConfirmation } from './modal.js';
import { showToast } from './notifications.js';
import { validatePortfolio } from './validator.js';
import { improveWriting, generateBulletPoints } from './ai.js';

// --- STATE ---
let currentUser = null;
let currentlyEditingId = null; // Used for context in modals (delete, share)
let portfoliosCache = [];

// --- INITIALIZATION ---
async function init() {
    // Check for a public portfolio ID in the URL first
    const urlParams = new URLSearchParams(window.location.search);
    const publicId = urlParams.get('id');

    if (publicId) {
        // If an ID exists, the app's only job is to show the public portfolio.
        await handlePublicView(publicId);
        return; // Stop further app execution
    }

    // If no public ID, proceed with the normal authenticated app flow
    Editor.init();
    Editor.setupLiveValidation();

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            handleUserLoggedIn(user);
        } else {
            handleUserLoggedOut();
        }
    });
    setupEventListeners();
}

/**
 * Handles displaying a public portfolio. This function replaces the entire app
 * view with just the portfolio preview.
 * @param {string} portfolioId The ID from the URL.
 */
async function handlePublicView(portfolioId) {
    const portfolioData = await Storage.getPublicPortfolioById(portfolioId);
    const appContainer = document.getElementById('app-container');
    
    // Clear the standard app header
    document.getElementById('app-header').innerHTML = '';

    if (portfolioData) {
        // Replace the main content with only the preview view
        appContainer.innerHTML = `
            <main id="main-content">
                <div id="preview-view" class="view active">
                    <div id="portfolio-preview-content"></div>
                </div>
            </main>`;
        UI.applyTheme(portfolioData.theme || 'theme-space');
        await UI.renderPortfolioPreview(portfolioData);
    } else {
        appContainer.innerHTML = `<p class="error-message">Sorry, the requested portfolio could not be found or is no longer public.</p>`;
    }
}

// --- AUTHENTICATION HANDLERS ---
async function handleUserLoggedIn(user) {
    UI.applyTheme(localStorage.getItem('theme') || 'theme-space');
    navigateTo('dashboard');
}

function handleUserLoggedOut() {
    portfoliosCache = [];
    currentlyEditingId = null;
    UI.updateHeader('login', null);
    UI.showView('login-view');
}

async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // onAuthStateChanged handles the rest
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        showAlert("Sign-In Failed", `An error occurred: ${error.message}`);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Main content actions (dashboard buttons, save, cancel, etc.)
    document.getElementById('main-content').addEventListener('click', async e => {
        const button = e.target.closest('button');
        if (!button) return;

        const { id } = button;
        const { action, id: dataId } = button.dataset;

        if (id === 'google-signin-btn') return handleGoogleSignIn();
        if (id === 'create-new-btn') return navigateToEditor();
        if (id === 'import-portfolio-btn') return handleImport();
        if (id === 'save-portfolio-btn') return handleSavePortfolio();
        if (id === 'cancel-edit-btn') return navigateTo('dashboard');

        if (action && dataId) {
            switch (action) {
                case 'edit': return navigateToEditor(dataId);
                case 'delete': return showConfirmation("Delete Portfolio?", "This action is permanent and cannot be undone.", () => handleDelete(dataId));
                case 'preview':
                    const portfolioToPreview = portfoliosCache.find(p => p.id === dataId);
                    if (portfolioToPreview) navigateTo('preview', portfolioToPreview);
                    break;
                case 'export': return handleExport(dataId);
                case 'share':
                    const portfolioToShare = portfoliosCache.find(p => p.id === dataId);
                    if (portfolioToShare) {
                        currentlyEditingId = dataId; // Set context for modal
                        UI.showShareModal(dataId, portfolioToShare.isPublic);
                    }
                    break;
            }
        }
    });

    // Header actions (logout, back to dashboard)
    document.getElementById('header-actions').addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        if (button.id === 'logout-btn') handleLogout();
        if (button.id === 'back-to-dashboard-btn') navigateTo('dashboard');
        if (button.id === 'download-pdf-btn') UI.downloadAsPDF();
    });
    
    // Header theme selector
    document.getElementById('header-actions').addEventListener('change', e => {
        if (e.target.id === 'theme-select') {
            const newTheme = e.target.value;
            UI.applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        }
    });

    // AI Modal listener
    document.getElementById('editor-view').addEventListener('click', (e) => {
        const button = e.target.closest('button.ai-assist-btn');
        if (button) {
            const activeTextarea = button.closest('.textarea-wrapper').querySelector('textarea');
            UI.showAiModal(activeTextarea);
        }
    });
    
    // Share Modal listener
    document.getElementById('share-modal-overlay').addEventListener('click', async e => {
        const button = e.target.closest('button');
        if (!button) return;

        const portfolio = portfoliosCache.find(p => p.id === currentlyEditingId);
        if (!portfolio && button.id !== 'close-share-btn') return;

        switch (button.id) {
            case 'make-public-btn':
                await Storage.makePortfolioPublic(currentlyEditingId, portfolio);
                showToast('Portfolio is now public!', 'success');
                navigateTo('dashboard'); // Refresh to show new state
                UI.hideShareModal();
                break;
            case 'make-private-btn':
                await Storage.makePortfolioPrivate(currentlyEditingId);
                showToast('Portfolio is now private.');
                navigateTo('dashboard');
                UI.hideShareModal();
                break;
            case 'copy-link-btn':
                const linkInput = document.getElementById('share-link-input');
                navigator.clipboard.writeText(linkInput.value).then(() => {
                    showToast('Link copied to clipboard!');
                }, () => {
                    showToast('Failed to copy link.', 'error');
                });
                break;
            case 'close-share-btn':
                UI.hideShareModal();
                break;
        }
    });
}

// --- DATA & NAVIGATION ---
async function navigateToEditor(id = null) {
    currentlyEditingId = id;
    if (id) {
        const portfolioToEdit = await Storage.getPortfolioById(currentUser.uid, id);
        Editor.populateForm(portfolioToEdit);
    } else {
        Editor.resetForm();
    }
    navigateTo('editor');
}

async function handleSavePortfolio() {
    const data = Editor.collectFormData();
    const validationErrors = validatePortfolio(data);

    if (validationErrors.length > 0) {
        const errorMessages = validationErrors.map(err => err.message).join('\n');
        return showAlert("Validation Error", `Please fix the following issues:\n\n${errorMessages}`);
    }

    try {
        if (currentlyEditingId) {
            await Storage.updatePortfolio(currentUser.uid, currentlyEditingId, data);
            showToast("Portfolio updated!", 'success');
        } else {
            const newId = await Storage.addPortfolio(currentUser.uid, data);
            showToast("Portfolio created!", 'success');
        }
        navigateTo('dashboard');
    } catch (error) {
        console.error("Save Error:", error);
        showAlert("Save Error", "Could not save portfolio. Check the console for more details.");
    }
}

async function handleDelete(id) {
    try {
        await Storage.deletePortfolio(currentUser.uid, id);
        // Also make it private if it was public
        await Storage.makePortfolioPrivate(id).catch(() => {});
        portfoliosCache = portfoliosCache.filter(p => p.id !== id);
        UI.renderDashboard(portfoliosCache);
        showToast("Portfolio deleted.", 'info');
    } catch (error) {
        showAlert("Delete Error", "Could not delete portfolio.");
    }
}

async function handleExport(id) {
    const portfolio = portfoliosCache.find(p => p.id === id);
    if (!portfolio) return;
    const { createdAt, lastModified, ...exportData } = portfolio;
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portfolio.portfolioTitle.replace(/\s+/g, '_') || 'portfolio'}.json`;
    document.body.appendChild(a);
a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                if (!data.portfolioTitle || !data.firstName) {
                    throw new Error("File does not appear to be a valid portfolio.");
                }
                await Storage.addPortfolio(currentUser.uid, data);
                navigateTo('dashboard');
                showToast("Portfolio imported!", 'success');
            } catch (error) {
                showAlert("Import Failed", `Could not import file: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function navigateTo(view, data = null) {
    UI.updateHeader(view, currentUser);
    switch (view) {
        case 'dashboard':
            portfoliosCache = await Storage.getPortfolios(currentUser.uid);
            UI.renderDashboard(portfoliosCache);
            UI.showView('dashboard-view');
            break;
        case 'editor':
            document.getElementById('editor-title').textContent = currentlyEditingId ? 'Edit Portfolio' : 'Create New Portfolio';
            UI.showView('editor-view');
            break;
        case 'preview':
            if (data) {
                await UI.renderPortfolioPreview(data);
                UI.showView('preview-view');
            } else {
                navigateTo('dashboard');
            }
            break;
        default:
            UI.showView('login-view');
    }
}

// --- Start the App ---
document.addEventListener('DOMContentLoaded', init);
