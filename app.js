// --- IMPORTS ---
import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as UI from './ui.js';
import * as Editor from './editor.js';
import * as Storage from './storage.js';
import { showAlert, showConfirmation } from './modal.js';
import { showToast } from './notifications.js';
import { validatePortfolio } from './validator.js';
import { improveWithAI, generateBulletPoints } from './ai.js';


// --- STATE ---
let currentUser = null;
let currentlyEditingId = null;
let portfoliosCache = [];


// --- INITIALIZATION ---
function init() {
    Editor.init(); // CRITICAL: Initialize the editor module first
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


// --- AUTHENTICATION HANDLERS ---
async function handleUserLoggedIn(user) {
    UI.applyTheme(localStorage.getItem('theme') || 'theme-space');
    navigateTo('dashboard');
}

function handleUserLoggedOut() {
    portfoliosCache = [];
    currentlyEditingId = null;
    UI.showView('login-view');
    UI.updateHeader('login');
}

async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will handle the rest
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


// --- EVENT LISTENERS ---
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
                    if(portfolio) navigateTo('preview', portfolio);
                    break;
                case 'export': return handleExport(dataId);
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

    // AI Modal Actions
    let activeTextarea = null;
    document.getElementById('editor-view').addEventListener('click', (e) => {
        if (e.target.classList.contains('ai-assist-btn')) {
            activeTextarea = e.target.closest('.textarea-wrapper').querySelector('textarea');
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
                    ? await improveWithAI(originalText)
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
            UI.hideAiModal();
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
        const errorList = validationErrors.map(err => `<li>${err.message}</li>`).join('');
        return showAlert("Validation Error", `Please fix the following issues:<ul>${errorList}</ul>`);
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
        showAlert("Save Error", "Could not save portfolio.");
    }
}

async function handleDelete(id) {
    try {
        await Storage.deletePortfolio(currentUser.uid, id);
        portfoliosCache = portfoliosCache.filter(p => p.id !== id);
        UI.renderDashboard(portfoliosCache);
        showToast("Portfolio deleted.");
    } catch (error) {
        showAlert("Delete Error", "Could not delete portfolio.");
    }
}

async function handleExport(id) {
    const portfolio = portfoliosCache.find(p => p.id === id);
    if (!portfolio) return;
    const jsonString = JSON.stringify(portfolio, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portfolio.portfolioTitle.replace(/\s+/g, '_') || 'portfolio'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                await Storage.addPortfolio(currentUser.uid, data);
                navigateTo('dashboard');
                showToast("Portfolio imported!", 'success');
            } catch (error) {
                showAlert("Import Failed", "Invalid portfolio file.");
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
            }
            break;
    }
}

// --- Start the App ---
document.addEventListener('DOMContentLoaded', init);
