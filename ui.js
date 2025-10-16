import { THEMES } from './config.js';

const headerActions = document.getElementById('header-actions');
const mainContent = document.getElementById('main-content');
const aiModalOverlay = document.getElementById('ai-modal-overlay');

export const showdownConverter = new showdown.Converter({
    simpleLineBreaks: true,
    strikethrough: true,
tables: true,
});

export function showView(viewId) {
    mainContent.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === viewId);
    });
}

export function updateHeader(view, user) {
    headerActions.innerHTML = ''; 

    if (view === 'public-preview') {
        headerActions.innerHTML = `<button id="download-pdf-btn" class="primary-btn">Download PDF</button>`;
        return;
    }

    if (user) {
        const themeSelectHTML = `
            <select id="app-theme-select" title="Change Application Theme">
                ${Object.entries(THEMES).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}
            </select>`;

        let buttonsHTML = '';
        if (view === 'editor' || view === 'preview' || view === 'dashboard') {
             buttonsHTML = (view !== 'dashboard') ? `<button id="back-to-dashboard-btn">Dashboard</button>` : '';
        }
        if (view === 'preview') {
            buttonsHTML += `<button id="download-pdf-btn" class="primary-btn">Download PDF</button>`;
        }

        headerActions.innerHTML = `
            ${themeSelectHTML}
            ${buttonsHTML}
            <button id="logout-btn">Logout</button>
        `;

        const savedTheme = localStorage.getItem('theme') || 'theme-space';
        populateAppThemeSelector(savedTheme);
        applyTheme(savedTheme);
    }
}


export function renderDashboard(portfolios) {
    const list = document.getElementById('portfolio-list');
    if (!portfolios || portfolios.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>No portfolios yet. Click "Create New" to start!</p></div>`;
        return;
    }

    list.innerHTML = portfolios.sort((a, b) => (b.lastModified?.toDate() || 0) - (a.lastModified?.toDate() || 0))
        .map(p => `
        <div class="portfolio-card">
            <h3>${p.portfolioTitle || 'Untitled Portfolio'}</h3>
            <p>Last modified: ${p.lastModified && p.lastModified.toDate ? new Date(p.lastModified.toDate()).toLocaleString() : 'N/A'}</p>
            <div class="card-actions">
                <button data-action="share" data-id="${p.id}">Share</button>
                <button data-action="preview" data-id="${p.id}">Preview</button>
                <button data-action="edit" data-id="${p.id}" class="primary-btn">Edit</button>
                <button data-action="delete" data-id="${p.id}" class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');
}

export async function renderPortfolioPreview(data) {
    const previewContainer = document.getElementById('portfolio-preview-content');
    const templateName = data.template || 'modern';
    const portfolioTheme = data.theme || 'theme-space'; // Get the portfolio's theme

    try {
        const templateModule = await import(`./templates/${templateName}.js`);
        previewContainer.innerHTML = templateModule.render(data);
        // Apply the portfolio-specific theme to the preview container
        previewContainer.className = portfolioTheme;
    } catch (error) {
        console.error(`Error loading template '${templateName}.js':`, error);
        previewContainer.innerHTML = `<p style="color: var(--color-error); text-align: center;">Could not load portfolio template. Make sure the file '/templates/${templateName}.js' exists and has no errors.</p>`;
    }
}

export function downloadAsPDF() {
    const content = document.getElementById('portfolio-preview-content');
    const portfolioTitle = content.querySelector('h1')?.textContent || 'portfolio';
    const opt = {
        margin:       [0.5, 0.2, 0.5, 0.2],
        filename:     `${portfolioTitle.toLowerCase().replace(/\s+/g, '-')}-portfolio.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(content).set(opt).save();
}


export function applyTheme(themeName) {
    document.body.className = themeName || 'theme-space';
}

function populateAppThemeSelector(currentTheme) {
    const themeSelect = document.getElementById('app-theme-select');
    if (themeSelect) {
        themeSelect.value = currentTheme;
    }
}


export function showAiModal() {
    aiModalOverlay.classList.remove('hidden');
}

export function hideAiModal() {
    aiModalOverlay.classList.add('hidden');
}

export function setAiModalState(state, text = '') {
    const optionsDiv = document.getElementById('ai-modal-options');
    const loadingDiv = document.getElementById('ai-modal-loading');
    const resultDiv = document.getElementById('ai-modal-result');
    const resultTextarea = document.getElementById('ai-result-textarea');

    [optionsDiv, loadingDiv, resultDiv].forEach(div => div.classList.add('hidden'));

    if (state === 'options') {
        optionsDiv.classList.remove('hidden');
    } else if (state === 'loading') {
        loadingDiv.classList.remove('hidden');
    } else if (state === 'result') {
        resultTextarea.value = text;
        resultDiv.classList.remove('hidden');
    }
}
