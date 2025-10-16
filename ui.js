import { THEMES } from './config.js';

const headerActionsEl = document.getElementById('header-actions');
const portfolioListEl = document.getElementById('portfolio-list');
const previewContentEl = document.getElementById('portfolio-preview-content');

export function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

export function populateThemes(currentTheme) {
    const select = document.createElement('select');
    select.id = 'theme-select';
    select.innerHTML = Object.entries(THEMES)
        .map(([value, text]) => `<option value="${value}" ${value === currentTheme ? 'selected' : ''}>${text}</option>`)
        .join('');
    // Clear and append to ensure no duplicates
    headerActionsEl.innerHTML = ''; 
    headerActionsEl.appendChild(select);
}

export function applyTheme(theme) {
    document.body.className = theme;
}

export function updateHeader(view, data) {
    populateThemes(document.body.className); // Always show theme selector
    switch (view) {
        case 'editor':
            headerActionsEl.insertAdjacentHTML('afterbegin', '<button id="preview-portfolio-btn" class="primary-btn">Preview</button>');
            break;
        case 'preview':
            headerActionsEl.insertAdjacentHTML('afterbegin', `
                <button id="download-pdf-btn">Download PDF</button>
                <button id="back-to-dashboard-btn">Back to Dashboard</button>
            `);
            break;
        case 'dashboard':
        default:
            // Theme selector is already there
            break;
    }
}

export function renderDashboard(portfolios) {
    if (portfolios.length === 0) {
        portfolioListEl.innerHTML = `<p>No portfolios created yet. Click the button below to start!</p>`;
        return;
    }
    portfolioListEl.innerHTML = portfolios.map(p => `
        <div class="portfolio-card">
            <h3>${p.portfolioTitle || 'Untitled Portfolio'}</h3>
            <p>Last updated: ${new Date(p.lastModified).toLocaleDateString()}</p>
            <div class="card-actions">
                <button data-action="edit" data-id="${p.id}">Edit</button>
                <button data-action="preview" data-id="${p.id}" class="primary-btn">Preview</button>
                <button data-action="delete" data-id="${p.id}">Delete</button>
            </div>
        </div>
    `).join('');
}

export function renderPortfolioPreview(data) {
    const converter = new showdown.Converter();
    const template = data.template || 'modern';
    previewContentEl.className = `template-${template}`;

    // Basic structure, can be expanded with different template logic
    previewContentEl.innerHTML = `
        <div class="p-header">
            ${data.profilePic ? `<img src="${data.profilePic}" class="p-pic" alt="Profile">` : ''}
            <h1>${data.firstName} ${data.lastName}</h1>
            <p>${data.email}</p>
        </div>
        <div class="p-section">
            <h2>Summary</h2>
            <div>${converter.makeHtml(data.summary || '')}</div>
        </div>
        <div class="p-section">
            <h2>Skills</h2>
            <ul>${(data.skills || []).map(s => `<li>${s.name} (${s.level})</li>`).join('')}</ul>
        </div>
        <div class="p-section">
            <h2>Projects</h2>
            ${(data.projects || []).map(p => `
                <div>
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                </div>
            `).join('')}
        </div>
    `;
}

export function downloadAsPDF() {
    const element = document.getElementById('portfolio-preview-content');
     const opt = {
        margin: 0.5,
        filename: 'portfolio.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
