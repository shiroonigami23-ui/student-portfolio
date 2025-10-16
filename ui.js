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
    headerActions.innerHTML = ''; // Clear previous state

    if (user) {
        // Logged-in user view
        const themeSelectHTML = `
            <select id="theme-select" title="Change Theme">
                ${Object.entries(THEMES).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}
            </select>`;

        let buttonsHTML = '';
        if (view === 'editor' || view === 'preview') {
            buttonsHTML = `<button id="back-to-dashboard-btn">Dashboard</button>`;
        }
        if (view === 'preview') {
            buttonsHTML += `<button id="download-pdf-btn" class="primary-btn">Download PDF</button>`;
        }

        headerActions.innerHTML = `
            ${themeSelectHTML}
            ${buttonsHTML}
            <button id="logout-btn">Logout</button>
        `;

        // Restore selected theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'theme-space';
        populateThemes(savedTheme);
        applyTheme(savedTheme);

    } else {
        // Logged-out view (login screen)
        // Header is intentionally empty
    }
}


export function renderDashboard(portfolios) {
    const list = document.getElementById('portfolio-list');
    if (!portfolios || portfolios.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>No portfolios yet. Click "Create New" to start!</p></div>`;
        return;
    }

    list.innerHTML = portfolios.sort((a, b) => (b.lastModified?.toDate() || 0) - (a.lastModified?.toDate() || 0)) // Sort by most recently modified
    .map(p => `
        <div class="portfolio-card">
            <h3>${p.portfolioTitle || 'Untitled Portfolio'}</h3>
            <p>Last modified: ${p.lastModified && p.lastModified.toDate ? new Date(p.lastModified.toDate()).toLocaleString() : 'N/A'}</p>
            <div class="card-actions">
                <button data-action="export" data-id="${p.id}">Export</button>
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

    try {
        // Dynamically import the template module
        const templateModule = await import(`./templates/${templateName}.js`);
        previewContainer.innerHTML = templateModule.render(data);
    } catch (error) {
        console.error(`Error loading template '${templateName}.js':`, error);
        previewContainer.innerHTML = `<p style="color: var(--color-error); text-align: center;">Could not load portfolio template. Make sure the file '/templates/${templateName}.js' exists and has no errors.</p>`;
    }
}

export function downloadAsPDF() {
    const content = document.getElementById('portfolio-preview-content');
    // Use a more specific selector if h1 is not guaranteed to be the title
    const portfolioTitle = content.querySelector('.preview-header h1')?.textContent || 'portfolio';
    const opt = {
        margin: 0.5,
        filename: `${portfolioTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(content).set(opt).save();
}

export function applyTheme(themeName) {
    // Ensure a default theme if none is provided
    document.body.className = themeName || 'theme-space';
}

function populateThemes(currentTheme) {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = currentTheme;
    }
}


// --- AI Modal Functions ---
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
