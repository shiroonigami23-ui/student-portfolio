// Correctly import other JS files from the same (root) directory
import * as UI from './ui.js';
import * as Editor from './editor.js';
import * as Portfolio from './portfolio.js'; 
import * as Storage from './storage.js';

// --- State ---
let currentView = 'dashboard';
let currentlyEditingId = null;

// --- Initialization ---
function init() {
    UI.populateThemes(Storage.getTheme());
    setupEventListeners();
    const portfolios = Storage.getPortfolios();
    UI.renderDashboard(portfolios);
    UI.showView('dashboard');
}

// --- Event Listeners ---
function setupEventListeners() {
    // Global Header Actions
    document.getElementById('app-header').addEventListener('click', e => {
        if (e.target.id === 'back-to-dashboard-btn') {
            navigateTo('dashboard');
        }
        if (e.target.id === 'preview-portfolio-btn') {
            const data = Editor.collectFormData();
            navigateTo('preview', data);
        }
        if (e.target.id === 'download-pdf-btn') {
            UI.downloadAsPDF();
        }
    });

    // Dashboard
    document.getElementById('dashboard-view').addEventListener('click', e => {
        if (e.target.id === 'create-new-btn') {
            currentlyEditingId = null;
            Editor.resetForm();
            navigateTo('editor');
        }
        if (e.target.dataset.action === 'edit') {
            currentlyEditingId = e.target.dataset.id;
            const portfolio = Storage.getPortfolioById(currentlyEditingId);
            Editor.populateForm(portfolio);
            navigateTo('editor');
        }
        if (e.target.dataset.action === 'delete') {
            if (confirm('Are you sure you want to delete this portfolio?')) {
                Storage.deletePortfolio(e.target.dataset.id);
                UI.renderDashboard(Storage.getPortfolios());
            }
        }
        if (e.target.dataset.action === 'preview') {
            const portfolio = Storage.getPortfolioById(e.target.dataset.id);
            navigateTo('preview', portfolio);
        }
    });

    // Editor
    document.getElementById('editor-view').addEventListener('click', e => {
        if (e.target.id === 'save-portfolio-btn') {
            const data = Editor.collectFormData();
            if (currentlyEditingId) {
                data.id = currentlyEditingId;
                Storage.updatePortfolio(data);
            } else {
                Storage.addPortfolio(data);
            }
            navigateTo('dashboard');
        }
        if (e.target.id === 'cancel-edit-btn') {
            navigateTo('dashboard');
        }
    });

    // Theme Selector
    document.addEventListener('change', e => {
        if (e.target.id === 'theme-select') {
            UI.applyTheme(e.target.value);
            Storage.saveTheme(e.target.value);
        }
    });
}

// --- Navigation ---
function navigateTo(view, data = null) {
    currentView = view;
    UI.updateHeader(view, data);
    
    switch (view) {
        case 'dashboard':
            UI.renderDashboard(Storage.getPortfolios());
            UI.showView('dashboard-view');
            break;
        case 'editor':
            UI.showView('editor-view');
            break;
        case 'preview':
            UI.renderPortfolioPreview(data);
            UI.showView('preview-view');
            break;
    }
}

// --- Start the App ---
document.addEventListener('DOMContentLoaded', init);
