import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as UI from './ui.js';
import * as Editor from './editor.js';
import * as Storage from './storage.js';
import { showAlert, showConfirmation, showShareModal } from './modal.js';
import { showToast } from './notifications.js';
import { validatePortfolio } from './validator.js';
// Import all AI functions, including the new one
import { improveWriting, generateBulletPoints, generateFirstDraft } from './ai.js';
import { uploadImage } from './cloudinary.js';

let currentUser = null;
let currentlyEditingId = null;
let portfoliosCache = [];

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('shareId');

    if (shareId) {
        document.body.innerHTML = '<div class="spinner"></div>';
        const publicPortfolio = await Storage.getPublicPortfolio(shareId);
        if (publicPortfolio) {
            const response = await fetch('index.html');
            const appHtml = await response.text();
            document.body.innerHTML = appHtml;
            UI.applyTheme(publicPortfolio.theme || 'theme-space');
            await UI.renderPortfolioPreview(publicPortfolio);
            UI.showView('preview-view');
            UI.updateHeader('public-preview', null);
             document.getElementById('header-actions').addEventListener('click', e => {
                if (e.target.closest('button')?.id === 'download-pdf-btn') UI.downloadAsPDF();
            });
        } else {
            document.body.innerHTML = '<h2>Portfolio not found</h2>';
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
    // Main content event listener
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
        // --- NEW --- Listener for the AI Draft button
        if (id === 'ai-draft-btn') return UI.showAiDraftModal(); 

        if (action && dataId) {
            switch (action) {
                case 'edit': return navigateToEditor(dataId);
                case 'delete': return showConfirmation("Delete Portfolio?", "This action is permanent.", () => handleDelete(dataId));
                case 'preview':
                    const portfolio = portfoliosCache.find(p => p.id === dataId);
                    if (portfolio) navigateTo('preview', portfolio);
                    break;
                case 'share': return handleShare(dataId);
            }
        }
    });

    // --- NEW --- AI Draft Modal event listeners
    document.getElementById('ai-draft-generate-btn').addEventListener('click', handleGenerateDraft);
    document.getElementById('ai-draft-cancel-btn').addEventListener('click', UI.hideAiDraftModal);

    // Header actions event listeners (unchanged)
    document.getElementById('header-actions').addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        if (button.id === 'logout-btn') handleLogout();
        if (button.id === 'back-to-dashboard-btn') navigateTo('dashboard');
        if (button.id === 'download-pdf-btn') UI.downloadAsPDF();
    });

    document.getElementById('header-actions').addEventListener('change', e => {
        if (e.target.id === 'app-theme-select') {
            const newTheme = e.target.value;
            UI.applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        }
    });

    // AI text-assist modal listeners (unchanged)
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
                const newText = action === 'improve' ? await improveWriting(originalText) : await generateBulletPoints(originalText);
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

// --- NEW --- Handler for the AI Draft Generation
async function handleGenerateDraft() {
    const roleInput = document.getElementById('ai-draft-role-input');
    const role = roleInput.value.trim();
    if (!role) {
        showAlert("Input Required", "Please enter a role or job title.");
        return;
    }

    const generateBtn = document.getElementById('ai-draft-generate-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
        showToast('AI is building your portfolio draft...', 'info', 10000);
        const draftData = await generateFirstDraft(role);
        
        UI.hideAiDraftModal();
        navigateToEditor(); // Navigate to a blank editor
        Editor.populateForm(draftData); // Populate it with AI data
        showToast('First draft generated!', 'success');
        
    } catch (error) {
        showAlert("AI Generation Failed", `An error occurred: ${error.message}`);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
        roleInput.value = '';
    }
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
    const saveButton = document.getElementById('save-portfolio-btn');
    const data = Editor.collectFormData();
    
    const validationErrors = validatePortfolio(data);
    if (validationErrors.length > 0) {
        showAlert("Validation Error", `Please fix the following issues:\n${validationErrors.map(e => e.message).join('\n')}`);
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        if (data.profilePicFile) {
            showToast('Uploading image...', 'info', 10000);
            const imageUrl = await uploadImage(data.profilePicFile);
            data.profilePic = imageUrl;
        } else {
            data.profilePic = data.profilePicUrl;
        }
        delete data.profilePicFile;
        delete data.profilePicUrl;

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
        showAlert("Save Error", `Could not save portfolio: ${error.message}`);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save';
    }
}

async function handleDelete(id) {
    try {
        await Storage.deletePortfolio(currentUser.uid, id);
        navigateTo('dashboard');
        showToast("Portfolio deleted.", 'info');
    } catch (error) {
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
        const portfolio = portfoliosCache.find(p => p.id === id);
        if (portfolio && portfolio.isPublic) {
            const shareUrl = `${window.location.origin}${window.location.pathname}?shareId=${id}`;
            showShareModal(shareUrl);
        } else {
            const result = await Storage.togglePortfolioPublicStatus(currentUser.uid, id);
            if (result.isPublic) {
                showToast("Portfolio is now public!", 'success');
                showShareModal(result.shareUrl);
                navigateTo('dashboard');
            }
        }
    } catch (error) {
        showAlert("Sharing Error", "Could not change the portfolio's public status.");
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
