// templates/modern.js

// This module is responsible for rendering the "Modern" portfolio template.

// We need to create a new Showdown converter instance for this module.
const showdownConverter = new showdown.Converter();

/**
 * Renders the portfolio data into an HTML string for the 'Modern' template.
 * @param {object} data - The portfolio data object.
 * @returns {string} The complete HTML for the portfolio preview.
 */
export function render(data) {
    const summaryHtml = data.summary ? showdownConverter.makeHtml(data.summary) : '';

    return `
        <div class="portfolio-template modern">
            <header class="preview-header">
                <h1>${data.firstName || ''} ${data.lastName || ''}</h1>
                <h2>${data.portfolioTitle || 'Portfolio'}</h2>
                <p>${data.email || ''}</p>
            </header>

            <section class="preview-summary">
                <h3>Summary</h3>
                <hr>
                <div>${summaryHtml}</div>
            </section>

            <section class="preview-experience">
                <h3>Work Experience</h3>
                <hr>
                ${(data.experience || []).map(exp => `
                    <div class="item">
                        <h4>${exp.title} <span>at ${exp.company}</span></h4>
                        <p class="dates">${exp.dates}</p>
                        <div>${showdownConverter.makeHtml(exp.description)}</div>
                    </div>
                `).join('')}
            </section>
            
            <section class="preview-education">
                <h3>Education</h3>
                <hr>
                 ${(data.education || []).map(edu => `
                    <div class="item">
                        <h4>${edu.degree}</h4>
                        <p>${edu.institution} - ${edu.year}</p>
                    </div>
                `).join('')}
            </section>

            <section class="preview-skills">
                <h3>Skills</h3>
                <hr>
                <ul>
                    ${(data.skills || []).map(s => `<li>${s.name} (${s.level})</li>`).join('')}
                </ul>
            </section>

            <section class="preview-projects">
                <h3>Projects</h3>
                <hr>
                ${(data.projects || []).map(p => `
                    <div class="project-item">
                        <h4>${p.title}</h4>
                        ${p.technologies ? `<p class="tech"><strong>Technologies:</strong> ${p.technologies}</p>` : ''}
                        <p>${p.description}</p>
                        <div class="project-links">
                            ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank">Live Demo</a>` : ''}
                            ${p.repoUrl ? `<a href="${p.repoUrl}" target="_blank">Source Code</a>` : ''}
                        </div>
                    </div>
                `).join('')}
            </section>
        </div>
    `;
}
