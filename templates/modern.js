import { showdownConverter } from '../ui.js';

// Helper function to prevent text injection issues (XSS)
const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

// A more robust way to render a section
const renderSection = (title, items, itemRenderer) => {
    // FIXED: Only check if the array has items, not for a specific property on the first item.
    if (!items || items.length === 0) return '';
    return `
        <section class="preview-${title.toLowerCase().replace(' ', '')}">
            <h3>${escapeHtml(title)}</h3>
            ${items.map(itemRenderer).join('')}
        </section>
    `;
};

export function render(data) {
    const summaryHtml = data.summary ? showdownConverter.makeHtml(escapeHtml(data.summary)) : '';
    const fullName = `${escapeHtml(data.firstName || '')} ${escapeHtml(data.lastName || '')}`;

    return `
    <div class="portfolio-template modern">
        <header class="preview-header">
            ${data.profilePic ? `<img src="${escapeHtml(data.profilePic)}" alt="Profile Picture" class="profile-pic">` : ''}
            <h1>${fullName}</h1>
            <h2>${escapeHtml(data.portfolioTitle || 'Portfolio')}</h2>
            <p>${escapeHtml(data.email || '')}</p>
        </header>

        ${summaryHtml ? `
        <section class="preview-summary">
            <h3>Summary</h3>
            <div class="markdown-content">${summaryHtml}</div>
        </section>` : ''}

        ${renderSection('Work Experience', data.experience, exp => `
            <div class="item">
                <h4>${escapeHtml(exp.title)} <span>at ${escapeHtml(exp.company)}</span></h4>
                <p class="dates">${escapeHtml(exp.dates)}</p>
                <div class="markdown-content">${showdownConverter.makeHtml(escapeHtml(exp.description || ''))}</div>
            </div>
        `)}
        
        ${renderSection('Education', data.education, edu => `
             <div class="item">
                <h4>${escapeHtml(edu.degree)}</h4>
                <p>${escapeHtml(edu.institution)} - ${escapeHtml(edu.year)}</p>
            </div>
        `)}

        ${renderSection('Skills', data.skills, skill => `<li>${escapeHtml(skill.name)} (${escapeHtml(skill.level)})</li>`, '<ul>', '</ul>')}

        ${renderSection('Projects', data.projects, p => `
            <div class="item">
                <h4>${escapeHtml(p.title)}</h4>
                <div class="markdown-content">${showdownConverter.makeHtml(escapeHtml(p.description || ''))}</div>
                ${p.technologies ? `<p class="tech"><strong>Technologies:</strong> ${escapeHtml(p.technologies)}</p>` : ''}
                <div class="project-links">
                    ${p.liveUrl ? `<a href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
                    ${p.repoUrl ? `<a href="${escapeHtml(p.repoUrl)}" target="_blank" rel="noopener noreferrer">Source Code</a>` : ''}
                </div>
            </div>
        `)}
    </div>
    `;
}
