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
        if (e.target.id === 'back-to-dashboard-btn') await navigateTo('dashboard');
        if (e.target.id === 'preview-portfolio-btn') await navigateTo('preview', Editor.collectFormData());
        if (e.target.id === 'download-pdf-btn') UI.downloadAsPDF();
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

            const portfolio = Storage.getPortfolioById(id);
            if (!portfolio) return;

            if (action === 'edit') {
                currentlyEditingId = id;
                Editor.populateForm(portfolio);
                await navigateTo('editor');
            }
            if (action === 'delete') {
                if (confirm('Are you sure you want to delete this portfolio?')) {
                    Storage.deletePortfolio(id);
                    UI.renderDashboard(Storage.getPortfolios());
                }
            }
            if (action === 'preview') await navigateTo('preview', portfolio);
            if (action === 'export') handleExport(portfolio);
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

function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Basic validation
                if (importedData.portfolioTitle && importedData.firstName) {
                    Storage.addPortfolio(importedData);
                    UI.renderDashboard(Storage.getPortfolios());
                } else {
                    alert('Invalid portfolio file.');
                }
            } catch (error) {
                alert('Could not parse the file. Please make sure it is a valid portfolio JSON.');
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
    };
    input.click();
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
            await UI.renderPortfolioPreview(data);
            UI.showView('preview-view');
            break;
    }
}

document.addEventListener('DOMContentLoaded', init);
