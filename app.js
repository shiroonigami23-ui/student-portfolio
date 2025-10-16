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
    UI.applyTheme(Storage.getTheme()); // Make sure theme is applied on load
    setupEventListeners();
    const portfolios = Storage.getPortfolios();
    UI.renderDashboard(portfolios);
    // CORRECTED LINE: Use the full element ID 'dashboard-view'
    UI.showView('dashboard-view');
}

// --- Event Listeners ---
function setupEventListeners() {
    // Global Header Actions
    document.getElementById('header-actions').addEventListener('click', e => {
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
        const target = e.target.closest('button');
        if (!target) return;
        
        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action === 'edit') {
            currentlyEditingId = id;
            const portfolio = Storage.getPortfolioById(currentlyEditingId);
            Editor.populateForm(portfolio);
            navigateTo('editor');
        }
        if (action === 'delete') {
            if (confirm('Are you sure you want to delete this portfolio?')) {
                Storage.deletePortfolio(id);
                UI.renderDashboard(Storage.getPortfolios());
            }
        }
        if (action === 'preview') {
            const portfolio = Storage.getPortfolioById(id);
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

    // Theme Selector in header
    document.getElementById('header-actions').addEventListener('change', e => {
        if (e.target.id === 'theme-select') {
            const newTheme = e.target.value;
            UI.applyTheme(newTheme);
            Storage.saveTheme(newTheme);
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
             document.getElementById('editor-title').textContent = currentlyEditingId ? 'Edit Portfolio' : 'Create New Portfolio';
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
