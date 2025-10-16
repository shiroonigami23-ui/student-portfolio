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
    UI.showView('dashboard-view');
    UI.updateHeader('dashboard', user);
    try {
        portfoliosCache = await Storage.getPortfolios(user.uid);
        UI.renderDashboard(portfoliosCache);
    } catch (error) {
        console.error("Error fetching portfolios:", error);
        showAlert("Error", "Could not fetch your portfolios. Please try again later.");
    }
}

function handleUserLoggedOut() {
    portfoliosCache = [];
    currentlyEditingId = null;
    UI.showView('login-view');
    UI.updateHeader('login');
}

async function handleGoogleSignIn() {
    console.log("Attempting to sign in with Google...");
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("Sign-in successful!", result.user);
        // onAuthStateChanged will handle the rest of the UI updates.
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/auth-domain-config-error') {
             showAlert("Sign-In Configuration Error", "Please ensure that your domain (e.g., localhost, your-site.github.io) is added to the 'Authorized domains' list in your Firebase Authentication settings.");
        } else {
            showAlert("Sign-In Failed", `An unexpected error occurred: ${error.message}`);
        }
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        // onAuthStateChanged will handle the rest.
    } catch (error) {
        console.error("Logout Error:", error);
        showAlert("Error", "Failed to log out. Please try again.");
    }
}


// --- EVENT LISTENERS ---
function setupEventListeners() {

    // Main Content Event Delegation for better performance
    document.getElementById('main-content').addEventListener('click', async e => {
        const target = e.target.closest('button');
        if (!target) return; // Exit if the click wasn't on or in a button

        const targetId = target.id;
        const action = target.dataset.action;
        const id = target.dataset.id;

        // Login / Create / Import
        if (targetId === 'google-signin-btn') return handleGoogleSignIn();
        if (targetId === 'create-new-btn') {
            currentlyEditingId = null;
            Editor.resetForm();
            return navigateTo('editor');
        }
        if (targetId === 'import-portfolio-btn') return handleImport();
        
        // Portfolio Card Actions
        if (action && id) {
            switch(action) {
                case 'edit':
                    currentlyEditingId = id;
                    const portfolioToEdit = await Storage.getPortfolioById(currentUser.uid, id);
                    Editor.populateForm(portfolioToEdit);
                    navigateTo('editor');
                    break;
                case 'delete':
                    showConfirmation(
                        "Delete Portfolio?",
                        "This action cannot be undone. Are you sure you want to permanently delete this portfolio?",
                        () => handleDelete(id)
                    );
                    break;
                case 'preview':
                    const portfolioToPreview = await Storage.getPortfolioById(currentUser.uid, id);
                    navigateTo('preview', portfolioToPreview);
                    break;
                case 'export':
                    handleExport(id);
                    break;
            }
        }
    });

    // Editor View Actions
    document.getElementById('save-portfolio-btn').addEventListener('click', handleSavePortfolio);
    document.getElementById('cancel-edit-btn').addEventListener('click', () => navigateTo('dashboard'));
    
    // Header Actions
    document.getElementById('header-actions').addEventListener('change', e => {
        if (e.target.id === 'theme-select') {
            const newTheme = e.target.value;
            UI.applyTheme(newTheme);
        }
    });
    
    document.getElementById('header-actions').addEventListener('click', e => {
        if (e.target.id === 'logout-btn') handleLogout();
        if (e.target.id === 'back-to-dashboard-btn') navigateTo('dashboard');
        if (e.target.id === 'download-pdf-btn') UI.downloadAsPDF();
    });

    // AI Modal Actions
    let activeTextarea = null;
    document.getElementById('editor-view').addEventListener('click', (e) => {
        if (e.target.classList.contains('ai-assist-btn')) {
            activeTextarea = e.target.previousElementSibling;
            UI.showAiModal();
        }
    });

    document.getElementById('ai-modal').addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        if (!action || !activeTextarea) return;

        const originalText = activeTextarea.value;
        let newText = originalText;

        if (action === 'improve' || action === 'bullets') {
            UI.setAiModalState('loading');
            try {
                if (action === 'improve') {
                    newText = await improveWithAI(originalText);
                } else if (action === 'bullets') {
                    newText = await generateBulletPoints(originalText);
                }
                
                if (newText && newText !== originalText) {
                    activeTextarea.value = newText;
                    activeTextarea.dispatchEvent(new Event('input', { bubbles: true })); // Trigger validation
                }
                UI.setAiModalState('result'); // Show result/options
            } catch (error) {
                console.error("AI Assist Error:", error);
                showAlert("AI Error", "Could not process the request. Please check your API key and try again.");
                UI.setAiModalState('options'); // Reset on error
            }
        } else if (action === 'close' || action === 'use-text') {
            UI.hideAiModal();
            setTimeout(() => {
                UI.setAiModalState('options');
                activeTextarea = null; // Clear active textarea
            }, 300);
        }
    });
}


// --- DATA & NAVIGATION ---
async function handleSavePortfolio() {
    const data = Editor.collectFormData();
    const validationErrors = validatePortfolio(data);

    if (validationErrors.length > 0) {
        const errorList = validationErrors.map(err => `<li>${err.message}</li>`).join('');
        showAlert("Validation Error", `Please fix the following issues:<ul style="text-align: left; margin-top: 1rem;">${errorList}</ul>`);
        return;
    }

    try {
        if (currentlyEditingId) {
            await Storage.updatePortfolio(currentUser.uid, currentlyEditingId, data);
            showToast("Portfolio updated successfully!");
        } else {
            await Storage.addPortfolio(currentUser.uid, data);
            showToast("Portfolio saved successfully!");
        }
        navigateTo('dashboard');
    } catch (error) {
        console.error("Save portfolio error:", error);
        showAlert("Error", "Could not save the portfolio. Please try again.");
    }
}

async function handleDelete(id) {
    try {
        await Storage.deletePortfolio(currentUser.uid, id);
        portfoliosCache = portfoliosCache.filter(p => p.id !== id);
        UI.renderDashboard(portfoliosCache);
        showToast("Portfolio deleted.");
    } catch (error) {
        console.error("Delete portfolio error:", error);
        showAlert("Error", "Could not delete the portfolio. Please try again.");
    }
}

async function handleExport(id) {
    try {
        const portfolio = await Storage.getPortfolioById(currentUser.uid, id);
        const jsonString = JSON.stringify(portfolio, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${portfolio.portfolioTitle.replace(/\s+/g, '_') || 'portfolio'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Export error:", error);
        showAlert("Error", "Could not export the portfolio.");
    }
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
                const portfolioData = JSON.parse(event.target.result);
                delete portfolioData.id; // Treat as a new portfolio
                delete portfolioData.createdAt;

                await Storage.addPortfolio(currentUser.uid, portfolioData);
                navigateTo('dashboard');
                showToast("Portfolio imported successfully!");
            } catch (error) {
                console.error("Import error:", error);
                showAlert("Import Failed", "The selected file is not a valid portfolio JSON file.");
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
            // Refetch data every time we navigate to dashboard to ensure it's fresh
            portfoliosCache = await Storage.getPortfolios(currentUser.uid);
            UI.renderDashboard(portfoliosCache);
            UI.showView('dashboard-view');
            break;
        case 'editor':
            document.getElementById('editor-title').textContent = currentlyEditingId ? 'Edit Portfolio' : 'Create New Portfolio';
            UI.showView('editor-view');
            break;
        case 'preview':
            await UI.renderPortfolioPreview(data);
            UI.showView('preview-view');
            break;
    }
}

// --- Start the App ---
document.addEventListener('DOMContentLoaded', init);
