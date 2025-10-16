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
    const publicId = urlParams.get('id');

    if (publicId) {
        await handlePublicView(publicId);
        return;
    }

    Editor.init();
    Editor.setupLiveValidation();

    // --- MAJOR FIX ---
    // The authentication logic is now more direct to prevent race conditions.
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            // This logic now runs directly when the user is confirmed.
            // 1. Immediately switch to the dashboard view.
            UI.showView('dashboard-view');
            // 2. Update the header for an authenticated user.
            UI.updateHeader('dashboard', user);
            // 3. Apply the correct theme.
            UI.applyTheme(localStorage.getItem('theme') || 'theme-space');
            // 4. THEN, fetch the portfolio data.
            portfoliosCache = await Storage.getPortfolios(user.uid);
            UI.renderDashboard(portfoliosCache);
        } else {
            // This runs if the user is logged out.
            handleUserLoggedOut();
        }
    });
    
    setupEventListeners();
}

async function handlePublicView(portfolioId) {
    const appContainer = document.getElementById('app-container');
    document.getElementById('app-header').innerHTML = '';

    const portfolioData = await Storage.getPublicPortfolioById(portfolioId);

    if (portfolioData) {
        appContainer.innerHTML = `
            <main id="main-content">
                <div id="preview-view" class="view active">
                    <div id="portfolio-preview-content"></div>
                </div>
            </main>`;
        UI.applyTheme(portfolioData.theme || 'theme-space');
        await UI.renderPortfolioPreview(portfolioData);
    } else {
        appContainer.innerHTML = `<p class="error-message">Sorry, this portfolio could not be found or is not public.</p>`;
    }
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
        showAlert("Sign-In Failed", `An error occurred: ${error.message}`);
    }
}

async function handleLogout() {
    await signOut(auth);
}

function setupEventListeners() {
    document.getElementById('main-content').addEventListener('click', async e => {
        const target = e.target;
        const aiButton = target.closest('.ai-assist-btn');
        if (aiButton) {
            const wrapper = aiButton.closest('.textarea-wrapper');
            const textarea = wrapper ? wrapper.querySelector('textarea') : null;
            if (textarea) UI.showAiModal(textarea);
            return;
        }

        const button = target.closest('button');
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
                case 'delete': return showConfirmation("Delete Portfolio?", "This cannot be undone.", () => handleDelete(dataId));
                case 'preview':
                    const portfolio = portfoliosCache.find(p => p.id === dataId);
                    if (portfolio) navigateTo('preview', portfolio);
                    break;
                case 'share':
                    const portfolioToShare = portfoliosCache.find(p => p.id === dataId);
                    if (portfolioToShare) {
                        currentlyEditingId = dataId;
                        UI.showShareModal(dataId, portfolioToShare.isPublic);
                    }
                    break;
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

    document.getElementById('share-modal-overlay').addEventListener('click', async e => {
        const button = e.target.closest('button');
        if (!button) return;

        const { id } = button;
        const portfolio = portfoliosCache.find(p => p.id === currentlyEditingId);
        if (!portfolio && id !== 'close-share-btn') return;

        switch (id) {
            case 'make-public-btn':
                await Storage.makePortfolioPublic(currentlyEditingId, portfolio);
                showToast('Portfolio is now public!', 'success');
                navigateTo('dashboard');
                UI.hideShareModal();
                break;
            case 'make-private-btn':
                await Storage.makePortfolioPrivate(currentlyEditingId);
                showToast('Portfolio is now private.');
                navigateTo('dashboard');
                UI.hideShareModal();
                break;
            case 'copy-link-btn':
                navigator.clipboard.writeText(document.getElementById('share-link-input').value)
                    .then(() => showToast('Link copied!'));
                break;
            case 'close-share-btn':
                UI.hideShareModal();
                break;
        }
    });
    
    document.getElementById('ai-modal-overlay').addEventListener('click', async e => {
        const button = e.target.closest('button');
        if (!button) return;
        const { action } = button.dataset;

        const originalText = UI.getActiveAiTextarea().value;
        if (action === 'improve' || action === 'bullets') {
            UI.setAiModalState('loading');
            const newText = action === 'improve' ? await improveWriting(originalText) : await generateBulletPoints(originalText);
            UI.setAiModalState('result', newText);
        } else if (action === 'use-text') {
            UI.getActiveAiTextarea().value = document.getElementById('ai-result-textarea').value;
            UI.hideAiModal();
        } else if (action === 'close') {
            UI.hideAiModal();
        }
    });
}

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
    UI.showView(`${view}-view`);
    UI.updateHeader(view, currentUser);

    if (view === 'preview' && data && data.theme) {
        UI.applyTheme(data.theme);
    } else {
        UI.applyTheme(localStorage.getItem('theme') || 'theme-space');
    }

    switch (view) {
        case 'dashboard':
            portfoliosCache = await Storage.getPortfolios(currentUser.uid);
            UI.renderDashboard(portfoliosCache);
            break;
        case 'editor':
            document.getElementById('editor-title').textContent = currentlyEditingId ? 'Edit Portfolio' : 'Create New Portfolio';
            break;
        case 'preview':
            if (data) {
                await UI.renderPortfolioPreview(data);
            }
            break;
    }
}

document.addEventListener('DOMContentLoaded', init);
