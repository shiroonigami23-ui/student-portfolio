import { THEMES } from './config.js';

// --- DOM Element Cache ---
const headerActions = document.getElementById('header-actions');
const mainContent = document.getElementById('main-content');
const aiModalOverlay = document.getElementById('ai-modal-overlay');
const shareModalOverlay = document.getElementById('share-modal-overlay');
let activeAiTextarea = null;

export const showdownConverter = new showdown.Converter({
    simpleLineBreaks: true,
    strikethrough: true,
    tables: true,
});

// --- View Management ---
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
            <div class="user-profile">
                <img src="${user.photoURL}" alt="${user.displayName}" class="user-avatar" referrerpolicy="no-referrer">
                <button id="logout-btn">Logout</button>
            </div>`;
        
        const savedTheme = localStorage.getItem('theme') || 'theme-space';
        populateThemes(savedTheme);
        applyTheme(savedTheme);
    }
    // For logged-out 'login' view, the header is intentionally empty.
}

export function renderDashboard(portfolios) {
    const list = document.getElementById('portfolio-list');
    if (!portfolios || portfolios.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>No portfolios yet. Click "Create New" to start!</p></div>`;
        return;
    }

    list.innerHTML = portfolios
        .sort((a, b) => (b.lastModified?.toDate() || 0) - (a.lastModified?.toDate() || 0))
        .map(p => `
        <div class="portfolio-card ${p.isPublic ? 'public' : ''}">
            <h3>${p.portfolioTitle || 'Untitled Portfolio'}</h3>
            <p>Last modified: ${p.lastModified && p.lastModified.toDate ? new Date(p.lastModified.toDate()).toLocaleString() : 'N/A'}</p>
            <div class="card-actions">
                <button data-action="share" data-id="${p.id}" class="share-btn ${p.isPublic ? 'active' : ''}" title="Share Portfolio">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/><path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/></svg>
                    <span>Share</span>
                </button>
                <button data-action="preview" data-id="${p.id}">Preview</button>
                <button data-action="edit" data-id="${p.id}" class="primary-btn">Edit</button>
                <button data-action="delete" data-id="${p.id}" class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');
}


// --- Portfolio Rendering ---
export async function renderPortfolioPreview(data) {
    const previewContainer = document.getElementById('portfolio-preview-content');
    const templateName = data.template || 'modern';

    try {
        const templateModule = await import(`./templates/${templateName}.js`);
        previewContainer.innerHTML = templateModule.render(data);
    } catch (error) {
        console.error(`Error loading template '${templateName}.js':`, error);
        previewContainer.innerHTML = `<p class="error-message">Could not load portfolio template.</p>`;
    }
}

export function downloadAsPDF() {
    const content = document.getElementById('portfolio-preview-content');
    const portfolioTitle = content.querySelector('h1')?.textContent || 'portfolio';
    const opt = {
        margin: 0.5,
        filename: `${portfolioTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(content).set(opt).save();
}

// --- Theming ---
export function applyTheme(themeName) {
    document.body.className = themeName || 'theme-space';
}

function populateThemes(currentTheme) {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = currentTheme;
    }
}

// --- AI Modal ---
export function showAiModal(textareaElement) {
    activeAiTextarea = textareaElement;
    setAiModalState('options');
    aiModalOverlay.classList.remove('hidden');
}

export function hideAiModal() {
    aiModalOverlay.classList.add('hidden');
    activeAiTextarea = null;
}

export function setAiModalState(state, text = '') {
    // ... (This function is unchanged)
}


// --- Share Modal ---
export function showShareModal(portfolioId, isPublic) {
    const shareLinkInput = document.getElementById('share-link-input');
    const shareModalActions = document.getElementById('share-modal-actions');
    const modalTitle = document.getElementById('share-modal-title');
    
    const link = `${window.location.origin}${window.location.pathname}?id=${portfolioId}`;
    shareLinkInput.value = link;
    shareLinkInput.style.display = isPublic ? 'block' : 'none';

    if (isPublic) {
        modalTitle.textContent = "Your Portfolio is Public";
        shareModalActions.innerHTML = `
            <button id="copy-link-btn" class="primary-btn">Copy Link</button>
            <button id="make-private-btn" class="delete-btn">Make Private</button>
            <button id="close-share-btn">Close</button>
        `;
    } else {
        modalTitle.textContent = "Share Your Portfolio";
        shareModalActions.innerHTML = `
            <button id="make-public-btn" class="primary-btn">Make Public & Get Link</button>
            <button id="close-share-btn">Close</button>
        `;
    }
    
    shareModalOverlay.classList.remove('hidden');
}

export function hideShareModal() {
    shareModalOverlay.classList.add('hidden');
}
