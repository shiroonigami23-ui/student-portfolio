import { THEMES } from './config.js';

const headerActions = document.getElementById('header-actions');
const mainContent = document.getElementById('main-content');
const showdownConverter = new showdown.Converter(); // For Markdown

/**
 * Shows a specific view and hides others.
 * @param {string} viewId The ID of the view element to show.
 */
export function showView(viewId) {
    const views = mainContent.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.toggle('active', view.id === viewId);
    });
}

/**
 * Updates the global header actions based on the current view.
 * @param {string} view - The name of the current view ('dashboard', 'editor', 'preview').
 */
export function updateHeader(view) {
    headerActions.innerHTML = ''; // Clear existing actions

    const themeSelectHTML = `
        <select id="theme-select" title="Change Theme">
            ${Object.entries(THEMES).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}
        </select>
    `;

    if (view === 'dashboard') {
        headerActions.innerHTML = themeSelectHTML;
    } else if (view === 'editor') {
        headerActions.innerHTML = `
            ${themeSelectHTML}
            <button id="preview-portfolio-btn">Preview</button>
            <button id="back-to-dashboard-btn" class="primary-btn">Back to Dashboard</button>
        `;
    } else if (view === 'preview') {
        headerActions.innerHTML = `
            ${themeSelectHTML}
            <button id="download-pdf-btn">Download PDF</button>
            <button id="back-to-dashboard-btn" class="primary-btn">Back to Dashboard</button>
        `;
    }
    // Repopulate themes after changing header content
    populateThemes(document.body.className);
}

/**
 * Renders the list of portfolio cards on the dashboard.
 * @param {Array<object>} portfolios - An array of portfolio objects.
 */
export function renderDashboard(portfolios) {
    const list = document.getElementById('portfolio-list');
    if (!portfolios || portfolios.length === 0) {
        list.innerHTML = `<p>No portfolios yet. Click "Create New" to start!</p>`;
        return;
    }

    list.innerHTML = portfolios.map(p => `
        <div class="portfolio-card">
            <h3>${p.portfolioTitle || 'Untitled Portfolio'}</h3>
            <p>Last modified: ${new Date(p.lastModified).toLocaleDateString()}</p>
            <div class="card-actions">
                <button data-action="preview" data-id="${p.id}">Preview</button>
                <button data-action="edit" data-id="${p.id}" class="primary-btn">Edit</button>
                <button data-action="delete" data-id="${p.id}" class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');
}

/**
 * Renders the portfolio data into the preview area.
 * @param {object} data - The portfolio data object.
 */
export function renderPortfolioPreview(data) {
    const previewContainer = document.getElementById('portfolio-preview-content');
    const summaryHtml = data.summary ? showdownConverter.makeHtml(data.summary) : '';

    previewContainer.innerHTML = `
        <div class="portfolio-template modern">
            <header class="preview-header" style="text-align: center; margin-bottom: 2rem;">
                <h1>${data.firstName || ''} ${data.lastName || ''}</h1>
                <h2>${data.portfolioTitle || 'Portfolio'}</h2>
                <p>${data.email || ''}</p>
            </header>
            <section class="preview-summary" style="margin-bottom: 2rem;">
                <h3>Summary</h3>
                <hr style="margin: 0.5rem 0; border-color: var(--border-color);">
                <div>${summaryHtml}</div>
            </section>
            <section class="preview-skills" style="margin-bottom: 2rem;">
                <h3>Skills</h3>
                 <hr style="margin: 0.5rem 0; border-color: var(--border-color);">
                <ul style="list-style: none; padding: 0;">
                    ${(data.skills || []).map(s => `<li style="margin-bottom: 0.5rem;"><strong>${s.name}</strong> - ${s.level}</li>`).join('')}
                </ul>
            </section>
            <section class="preview-projects">
                <h3>Projects</h3>
                 <hr style="margin: 0.5rem 0; border-color: var(--border-color);">
                ${(data.projects || []).map(p => `
                    <div class="project-item" style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--accent-primary);">${p.title}</h4>
                        <p>${p.description}</p>
                    </div>
                `).join('')}
            </section>
        </div>
    `;
}


/**
 * Downloads the current preview view as a PDF.
 */
export function downloadAsPDF() {
    const content = document.getElementById('portfolio-preview-content');
    const portfolioTitle = content.querySelector('h2')?.textContent || 'portfolio';
    const opt = {
        margin:       0.5,
        filename:     `${portfolioTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(content).set(opt).save();
}

/**
 * Sets the theme class on the body.
 * @param {string} themeName - The theme class name (e.g., 'theme-space').
 */
export function applyTheme(themeName) {
    document.body.className = ''; // Remove all classes first
    if(themeName) document.body.classList.add(themeName);
}

/**
 * Populates the theme dropdown and sets the selected value.
 * @param {string} currentTheme - The currently active theme name.
 */
export function populateThemes(currentTheme) {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.innerHTML = Object.entries(THEMES)
            .map(([key, value]) => `<option value="${key}" ${key === currentTheme ? 'selected' : ''}>${value}</option>`)
            .join('');
        themeSelect.value = currentTheme;
    }
}
