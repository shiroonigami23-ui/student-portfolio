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

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('shareId');

    if (shareId) {
        const publicPortfolio = await Storage.getPublicPortfolio(shareId);
        if (publicPortfolio) {
            UI.renderPortfolioPreview(publicPortfolio);
            UI.showView('preview-view');
            UI.updateHeader('public-preview', null);
        } else {
            showAlert("Not Found", "The portfolio you are looking for does not exist or is no longer shared.");
        }
        return;
    }

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
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        showAlert("Sign-In Failed", `An unexpected error occurred: ${error.message}`);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

function setupEventListeners() {
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
                case 'delete': return showConfirmation("Delete Portfolio?", "This action is permanent.", () => handleDelete(dataId));
                case 'preview':
                    const portfolio = portfoliosCache.find(p => p.id === dataId);
                    if (portfolio) navigateTo('preview', portfolio);
                    break;
                case 'export': return handleExport(dataId);
                case 'share': return handleShare(dataId);
            }
        }
    });

    document.getElementById('header-actions').addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        if (button.id === 'logout-btn') handleLogout();
        if (button.id === 'back-to-dashboard-btn') navigateTo('dashboard');
        if (button.id === 'download-pdf-btn') UI.downloadAsPDF();
    });

    document.getElementById('header-actions').addEventListener('change', e => {
        if (e.target.id === 'theme-select') {
            const newTheme = e.target.value;
            UI.applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        }
    });

    let activeTextarea = null;
    document.getElementById('editor-view').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.classList.contains('ai-assist-btn')) {
            activeTextarea = button.closest('.textarea-wrapper').querySelector('textarea');
            UI.setAiModalState('options');
            UI.showAiModal();
        }
    });

    document.getElementById('ai-modal-overlay').addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        if (!action) return;

        const originalText = activeTextarea ? activeTextarea.value : '';

        if (action === 'improve' || action === 'bullets') {
            UI.setAiModalState('loading');
            try {
                const newText = action === 'improve'
                    ? await improveWriting(originalText)
                    : await generateBulletPoints(originalText);
                UI.setAiModalState('result', newText);
            } catch (error) {
                showAlert("AI Error", error.message);
                UI.setAiModalState('options');
            }
        } else if (action === 'use-text') {
            if (activeTextarea) {
                activeTextarea.value = document.getElementById('ai-result-textarea').value;
                activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
            UI.hideAiModal();
        } else if (action === 'close') {
            UI.setAiModalState('options');
            UI.hideAiModal();
        }
    });
}

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
        showAlert("Validation Error", `Please fix the following issues:\n${validationErrors.map(e => e.message).join('\n')}`);
        return;
    }

    try {
        if (currentlyEditingId) {
            await Storage.updatePortfolio(currentUser.uid, currentlyEditingId, data);
            showToast("Portfolio updated!", 'success');
        } else {
            await Storage.addPortfolio(currentUser.uid, data);
            showToast("Portfolio saved!", 'success');
        }
        navigateTo('dashboard');
    } catch (error) {
        console.error("Save Error:", error);
        showAlert("Save Error", "Could not save portfolio. Check console for details.");
    }
}

async function handleDelete(id) {
    try {
        await Storage.deletePortfolio(currentUser.uid, id);
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
                console.error("Import error", error);
                showAlert("Import Failed", `Could not import file: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function handleShare(id) {
    try {
        const shareUrl = await Storage.makePortfolioPublic(currentUser.uid, id);
        showAlert("Share Link", `Here is your shareable link:\n\n${shareUrl}`);
    } catch (error) {
        showAlert("Sharing Error", "Could not make the portfolio public. Please try again later.");
    }
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

document.addEventListener('DOMContentLoaded', init);
