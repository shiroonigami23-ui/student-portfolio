import { THEMES } from './config.js';

const headerActions = document.getElementById('header-actions');
const mainContent = document.getElementById('main-content');

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

export function updateAuthUI(user) {
    if (user) {
        // User is signed in, show their info and a logout button
        headerActions.innerHTML = `
            <div class="user-profile">
                <img src="${user.photoURL}" alt="${user.displayName}" class="user-avatar">
                <button id="logout-btn">Logout</button>
            </div>
        `;
    } else {
        // User is signed out, clear header actions
        headerActions.innerHTML = '';
    }
}


export function updateHeader(view) {
    // This function will now only handle the view-specific buttons,
    // as auth state is handled by updateAuthUI
    if (view === 'dashboard') {
        // No extra buttons needed, auth UI is enough
    } else if (view === 'editor') {
        document.getElementById('header-actions').insertAdjacentHTML('beforeend', `
            <button id="preview-portfolio-btn">Preview</button>
            <button id="back-to-dashboard-btn" class="primary-btn">Back</button>`);
    } else if (view === 'preview') {
         document.getElementById('header-actions').insertAdjacentHTML('beforeend', `
            <button id="download-pdf-btn">Download PDF</button>
            <button id="back-to-dashboard-btn" class="primary-btn">Back</button>`);
    }
    
    // Theme select should always be available for logged-in users, except on login view
    if (document.getElementById('logout-btn') && view !== 'login-view') {
         const themeSelectHTML = `<select id="theme-select" title="Change Theme">
            ${Object.entries(THEMES).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}
        </select>`;
        document.getElementById('header-actions').insertAdjacentHTML('afterbegin', themeSelectHTML);
        populateThemes(document.body.className);
    }
}

export function renderDashboard(portfolios) {
    const list = document.getElementById('portfolio-list');
    if (!portfolios || portfolios.length === 0) {
        list.innerHTML = `<p>No portfolios yet. Click "Create New" to start!</p>`;
        return;
    }

    list.innerHTML = portfolios.map(p => `
        <div class="portfolio-card">
            <h3>${p.portfolioTitle || 'Untitled Portfolio'}</h3>
            <p>Last modified: ${p.lastModified ? new Date(p.lastModified).toLocaleDateString() : 'N/A'}</p>
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
        const templateModule = await import(`./templates/${templateName}.js`);
        previewContainer.innerHTML = templateModule.render(data);
    } catch (error) {
        console.error(`Error loading template '${templateName}':`, error);
        previewContainer.innerHTML = `<p style="color: red; text-align: center;">Could not load template.</p>`;
    }
}

export function downloadAsPDF() {
    const content = document.getElementById('portfolio-preview-content');
    const portfolioTitle = content.querySelector('h1')?.textContent || 'portfolio';
    const opt = {
        margin: 0.5,
        filename: `${portfolioTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(content).set(opt).save();
}

export function applyTheme(themeName) {
    document.body.className = themeName || '';
}

export function populateThemes(currentTheme) {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.innerHTML = Object.entries(THEMES)
            .map(([key, value]) => `<option value="${key}" ${key === currentTheme ? 'selected' : ''}>${value}</option>`)
            .join('');
        themeSelect.value = currentTheme;
    }
}
