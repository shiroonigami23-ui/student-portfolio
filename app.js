import * as UI from './ui.js';
import * as Editor from './editor.js';
import * as Storage from './storage.js';

let currentView = 'dashboard';
let currentlyEditingId = null;

function init() {
    UI.populateThemes(Storage.getTheme());
    UI.applyTheme(Storage.getTheme());
    setupEventListeners();
    UI.renderDashboard(Storage.getPortfolios());
    UI.showView('dashboard-view');
}

function setupEventListeners() {
    document.getElementById('header-actions').addEventListener('click', async (e) => {
        if (e.target.id === 'back-to-dashboard-btn') {
            await navigateTo('dashboard');
        }
        if (e.target.id === 'preview-portfolio-btn') {
            const data = Editor.collectFormData();
            await navigateTo('preview', data);
        }
        if (e.target.id === 'download-pdf-btn') {
            UI.downloadAsPDF();
        }
    });

    document.getElementById('dashboard-view').addEventListener('click', async (e) => {
        if (e.target.id === 'create-new-btn') {
            currentlyEditingId = null;
            Editor.resetForm();
            await navigateTo('editor');
        }
        const target = e.target.closest('button');
        if (!target) return;
        
        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action === 'edit') {
            currentlyEditingId = id;
            const portfolio = Storage.getPortfolioById(currentlyEditingId);
            Editor.populateForm(portfolio);
            await navigateTo('editor');
        }
        if (action === 'delete') {
            if (confirm('Are you sure you want to delete this portfolio?')) {
                Storage.deletePortfolio(id);
                UI.renderDashboard(Storage.getPortfolios());
            }
        }
        if (action === 'preview') {
            const portfolio = Storage.getPortfolioById(id);
            await navigateTo('preview', portfolio);
        }
    });

    document.getElementById('editor-view').addEventListener('click', async (e) => {
        if (e.target.id === 'save-portfolio-btn') {
            const data = Editor.collectFormData();
            if (currentlyEditingId) {
                data.id = currentlyEditingId;
                Storage.updatePortfolio(data);
            } else {
                Storage.addPortfolio(data);
            }
            await navigateTo('dashboard');
        }
        if (e.target.id === 'cancel-edit-btn') {
            await navigateTo('dashboard');
        }
    });

    document.getElementById('header-actions').addEventListener('change', e => {
        if (e.target.id === 'theme-select') {
            const newTheme = e.target.value;
            UI.applyTheme(newTheme);
            Storage.saveTheme(newTheme);
        }
    });
}

async function navigateTo(view, data = null) {
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
            await UI.renderPortfolioPreview(data); // Await the async rendering
            UI.showView('preview-view');
            break;
    }
}

document.addEventListener('DOMContentLoaded', init);
