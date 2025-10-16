// templates/bold.js

// This module renders the "Bold" portfolio template.
const showdownConverter = new showdown.Converter();

export function render(data) {
    const summaryHtml = data.summary ? showdownConverter.makeHtml(data.summary) : '';

    return `
        <div class="portfolio-template bold">
            <header class="preview-header">
                <h1>${data.firstName || ''} ${data.lastName || ''}</h1>
                <p class="subtitle">${data.portfolioTitle || 'Portfolio'}</p>
                <p class="contact">${data.email || ''}</p>
            </header>

            <section class="preview-summary">
                ${summaryHtml ? `<div>${summaryHtml}</div>` : ''}
            </section>
            
            <section class="preview-experience">
                <h2>Experience</h2>
                ${(data.experience || []).map(exp => `
                    <div class="item">
                        <div class="item-header">
                            <h4>${exp.title}</h4>
                            <p class="dates">${exp.dates}</p>
                        </div>
                        <p class="company">${exp.company}</p>
                        <div class="description">${showdownConverter.makeHtml(exp.description)}</div>
                    </div>
                `).join('')}
            </section>

            <section class="preview-projects">
                <h2>Projects</h2>
                ${(data.projects || []).map(p => `
                     <div class="item">
                        <div class="item-header">
                             <h4>${p.title}</h4>
                             <div class="project-links">
                                ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank">Demo</a>` : ''}
                                ${p.repoUrl ? `<a href="${p.repoUrl}" target="_blank">Code</a>` : ''}
                            </div>
                        </div>
                        ${p.technologies ? `<p class="tech">${p.technologies}</p>` : ''}
                        <div class="description"><p>${p.description}</p></div>
                    </div>
                `).join('')}
            </section>

            <div class="two-column-section">
                <section class="preview-education">
                    <h2>Education</h2>
                     ${(data.education || []).map(edu => `
                        <div class="item">
                            <h4>${edu.degree}</h4>
                            <p>${edu.institution} - ${edu.year}</p>
                        </div>
                    `).join('')}
                </section>

                <section class="preview-skills">
                    <h2>Skills</h2>
                    <ul>
                        ${(data.skills || []).map(s => `<li>${s.name}</li>`).join('')}
                    </ul>
                </section>
            </div>
        </div>
    `;
}
