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
    // --- MAJOR FIX ---
    // This function is now more "brute force" to prevent race conditions.
    // First, it explicitly hides ALL views.
    mainContent.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Then, it explicitly shows ONLY the target view.
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    } else {
        console.error(`showView Error: A view with the ID "${viewId}" could not be found.`);
    }
}

export function updateHeader(view, user) {
    headerActions.innerHTML = ''; // Clear previous state

    if (user) {
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
        
        const themeSelectElement = document.getElementById('theme-select');
        if (themeSelectElement) {
            themeSelectElement.value = localStorage.getItem('theme') || 'theme-space';
        }
    }
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
            <p>Last modified: ${p.lastModified?.toDate() ? new Date(p.lastModified.toDate()).toLocaleString() : 'N/A'}</p>
            <div class="card-actions">
                <button data-action="share" data-id="${p.id}" class="share-btn ${p.isPublic ? 'active' : ''}" title="Share Portfolio">Share</button>
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
        // Corrected path for templates
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
    const opt = { margin: 0.5, filename: `${portfolioTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().from(content).set(opt).save();
}

// --- Theming ---
export function applyTheme(themeName) {
    document.body.className = themeName || 'theme-space';
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

export function getActiveAiTextarea() {
    return activeAiTextarea;
}

export function setAiModalState(state, text = '') {
    const options = aiModalOverlay.querySelector('#ai-modal-options');
    const loading = aiModalOverlay.querySelector('#ai-modal-loading');
    const result = aiModalOverlay.querySelector('#ai-modal-result');
    options.style.display = 'none';
    loading.style.display = 'none';
    result.style.display = 'none';
    if (state === 'options') options.style.display = 'block';
    else if (state === 'loading') loading.style.display = 'block';
    else if (state === 'result') {
        result.style.display = 'block';
        document.getElementById('ai-result-textarea').value = text;
    }
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
        shareModalActions.innerHTML = `<button id="copy-link-btn" class="primary-btn">Copy Link</button><button id="make-private-btn">Make Private</button><button id="close-share-btn">Close</button>`;
    } else {
        modalTitle.textContent = "Share Your Portfolio";
        shareModalActions.innerHTML = `<button id="make-public-btn" class="primary-btn">Make Public & Get Link</button><button id="close-share-btn">Close</button>`;
    }
    shareModalOverlay.classList.remove('hidden');
}

export function hideShareModal() {
    shareModalOverlay.classList.add('hidden');
}
