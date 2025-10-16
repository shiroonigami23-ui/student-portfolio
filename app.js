import * as UI from './ui.js';
import * as Editor from './editor.js';
import * as Storage from './storage.js';
import * as AI from './ai.js';
import { showConfirmation, showAlert } from './modal.js';
import { showToast } from './notifications.js';
import { validatePortfolioData } from './validator.js';
import { auth } from './firebase.js';
import { onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


let currentView = 'dashboard';
let currentlyEditingId = null;

// --- Authentication ---
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in.
        UI.updateAuthUI(user);
        initApp(); // Initialize the main app functionality
    } else {
        // User is signed out.
        UI.updateAuthUI(null);
        UI.showView('login-view'); // Show a login view if not logged in
    }
});

function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => {
        console.error("Google Sign-in Error", error);
        showAlert("Login Failed", "Could not sign in with Google. Please try again.");
    });
}

function handleLogout() {
    signOut(auth);
}

// --- App Initialization ---
async function initApp() {
    UI.populateThemes(Storage.getTheme());
    UI.applyTheme(Storage.getTheme());
    Editor.setupLiveValidation();
    setupEventListeners();
    await navigateTo('dashboard');
}

function setupEventListeners() {
    document.getElementById('header-actions').addEventListener('click', async (e) => {
        if (e.target.id === 'back-to-dashboard-btn') await navigateTo('dashboard');
        if (e.target.id === 'preview-portfolio-btn') await navigateTo('preview', Editor.collectFormData());
        if (e.target.id === 'download-pdf-btn') UI.downloadAsPDF();
        if (e.target.id === 'logout-btn') handleLogout();
    });

    // Event listener for login button
    document.getElementById('main-content').addEventListener('click', e => {
        if (e.target.id === 'google-login-btn') {
            handleGoogleLogin();
        }
    });

    document.getElementById('dashboard-view').addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        if (target.id === 'create-new-btn') {
            currentlyEditingId = null;
            Editor.resetForm();
            await navigateTo('editor');
        } else if (target.id === 'import-portfolio-btn') {
            handleImport();
        } else {
            const action = target.dataset.action;
            const id = target.dataset.id;
            if (!action || !id) return;

            const portfolio = await Storage.getPortfolioById(id);
            if (!portfolio) return;

            if (action === 'edit') {
                currentlyEditingId = id;
                Editor.populateForm(portfolio);
                await navigateTo('editor');
            }
            if (action === 'delete') {
                showConfirmation(
                    'Delete Portfolio',
                    'Are you sure you want to delete this portfolio? This action cannot be undone.',
                    async () => {
                        await Storage.deletePortfolio(id);
                        await navigateTo('dashboard');
                        showToast('Portfolio deleted.', 'info');
                    }
                );
            }
            if (action === 'preview') await navigateTo('preview', portfolio);
            if (action === 'export') handleExport(portfolio);
        }
    });
    
    document.getElementById('portfolio-form').addEventListener('click', (e) => {
        if (e.target.classList.contains('ai-assist-btn')) {
            const wrapper = e.target.closest('.textarea-wrapper');
            const textarea = wrapper.querySelector('textarea');
            handleAiAssist(textarea);
        }
    });

    document.getElementById('editor-view').addEventListener('click', async (e) => {
        if (e.target.id === 'save-portfolio-btn') {
            const data = Editor.collectFormData();
            const validationResult = validatePortfolioData(data);

            if (!validationResult.isValid) {
                showAlert('Validation Error', 'Please fix the following issues:\n\n' + validationResult.errors.join('\n'));
                return;
            }

            if (currentlyEditingId) {
                data.id = currentlyEditingId;
                await Storage.updatePortfolio(data);
                showToast('Portfolio updated successfully!', 'success');
            } else {
                await Storage.addPortfolio(data);
                showToast('Portfolio created successfully!', 'success');
            }
            await navigateTo('dashboard');
        }
        if (e.target.id === 'cancel-edit-btn') await navigateTo('dashboard');
    });

    document.getElementById('header-actions').addEventListener('change', e => {
        if (e.target.id === 'theme-select') {
            const newTheme = e.target.value;
            UI.applyTheme(newTheme);
            Storage.saveTheme(newTheme);
        }
    });
}

let activeTextarea = null;
let lastAiAction = null;
const aiModal = {
    overlay: document.getElementById('ai-modal-overlay'),
    initial: document.getElementById('ai-modal-initial'),
    loading: document.getElementById('ai-modal-loading'),
    result: document.getElementById('ai-modal-result'),
    resultTextarea: document.getElementById('ai-result-textarea'),
    improveBtn: document.getElementById('ai-improve-btn'),
    bulletsBtn: document.getElementById('ai-bullets-btn'),
    useTextBtn: document.getElementById('ai-use-text-btn'),
    retryBtn: document.getElementById('ai-retry-btn'),
    backBtn: document.getElementById('ai-back-btn'),
    cancelBtn: document.getElementById('ai-cancel-btn'),
};

function handleAiAssist(textarea) {
    activeTextarea = textarea;
    aiModal.overlay.classList.remove('hidden');
    showAiState('initial');
}

function showAiState(state) {
    ['initial', 'loading', 'result'].forEach(s => aiModal[s].classList.add('hidden'));
    aiModal[state].classList.remove('hidden');
}

async function performAiAction(action) {
    lastAiAction = action;
    const originalText = activeTextarea.value;
    if (!originalText.trim()) {
        showAlert('Input Needed', 'Please write some text before using AI assist.');
        return;
    }
    
    showAiState('loading');
    let newText = '';
    if (action === 'improve') {
        newText = await AI.improveWriting(originalText);
    } else if (action === 'bullets') {
        newText = await AI.generateBulletPoints(originalText);
    }
    aiModal.resultTextarea.value = newText;
    showAiState('result');
}

aiModal.improveBtn.addEventListener('click', () => performAiAction('improve'));
aiModal.bulletsBtn.addEventListener('click', () => performAiAction('bullets'));
aiModal.retryBtn.addEventListener('click', () => performAiAction(lastAiAction));
aiModal.backBtn.addEventListener('click', () => showAiState('initial'));
aiModal.cancelBtn.addEventListener('click', () => aiModal.overlay.classList.add('hidden'));
aiModal.useTextBtn.addEventListener('click', () => {
    activeTextarea.value = aiModal.resultTextarea.value;
    aiModal.overlay.classList.add('hidden');
    activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
});

function handleExport(portfolio) {
    const dataStr = JSON.stringify(portfolio, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const title = portfolio.portfolioTitle?.toLowerCase().replace(/\s+/g, '-') || 'portfolio';
    a.href = url;
    a.download = `${title}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.portfolioTitle && importedData.firstName) {
                    await Storage.addPortfolio(importedData);
                    await navigateTo('dashboard');
                    showToast('Portfolio imported successfully!', 'success');
                } else {
                    showAlert('Import Error', 'The selected file is not a valid portfolio.');
                }
            } catch (error) {
                showAlert('Import Error', 'Could not parse the file. Please make sure it is a valid portfolio JSON.');
                console.error("Import error:", error);
            }
        };
        reader.readText(file);
    };
    input.click();
}

async function navigateTo(view, data = null) {
    currentView = view;
    UI.updateHeader(view, data);

    switch (view) {
        case 'dashboard':
            const portfolios = await Storage.getPortfolios();
            UI.renderDashboard(portfolios);
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
