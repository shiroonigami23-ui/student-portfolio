import { showdownConverter } from '../ui.js';

export function render(data) {
    const summaryHtml = data.summary ? showdownConverter.makeHtml(data.summary) : '';
    const profilePicHtml = data.profilePic ? `<img src="${data.profilePic}" alt="Profile Picture" class="profile-pic">` : '';

    return `
    <div class="portfolio-template classic">
        <aside class="sidebar">
            ${profilePicHtml}
            <h1>${data.firstName || ''} ${data.lastName || ''}</h1>
            <h2>${data.portfolioTitle || 'Portfolio'}</h2>
            <p>${data.email || ''}</p>
            
            ${(data.skills && data.skills.length > 0 && data.skills[0].name) ? `
            <section class="preview-skills">
                <h3>Skills</h3>
                <ul>
                    ${data.skills.map(skill => `<li><strong>${skill.name}</strong><br>${skill.level}</li>`).join('')}
                </ul>
            </section>` : ''}
        </aside>

        <main class="main-content">
            ${summaryHtml ? `
            <section class="preview-summary">
                <h3>Summary</h3>
                <div class="markdown-content">${summaryHtml}</div>
            </section>` : ''}

            ${(data.experience && data.experience.length > 0 && data.experience[0].title) ? `
            <section class="preview-experience">
                <h3>Work Experience</h3>
                ${data.experience.map(exp => `
                    <div class="item">
                        <h4>${exp.title} at ${exp.company}</h4>
                        <p class="dates">${exp.dates}</p>
                        <div class="markdown-content">${showdownConverter.makeHtml(exp.description || '')}</div>
                    </div>
                `).join('')}
            </section>` : ''}

            ${(data.projects && data.projects.length > 0 && data.projects[0].title) ? `
            <section class="preview-projects">
                <h3>Projects</h3>
                ${data.projects.map(p => `
                    <div class="item">
                        <h4>${p.title}</h4>
                        <div class="markdown-content">${showdownConverter.makeHtml(p.description || '')}</div>
                        ${p.technologies ? `<p class="tech"><strong>Technologies:</strong> ${p.technologies}</p>` : ''}
                        <div class="project-links">
                            ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank">Live Demo</a>` : ''}
                            ${p.repoUrl ? `<a href="${p.repoUrl}" target="_blank">Source Code</a>` : ''}
                        </div>
                    </div>
                `).join('')}
            </section>` : ''}

            ${(data.education && data.education.length > 0 && data.education[0].degree) ? `
            <section class="preview-education">
                <h3>Education</h3>
                ${data.education.map(edu => `
                     <div class="item">
                        <h4>${edu.degree}</h4>
                        <p>${edu.institution} - ${edu.year}</p>
                    </div>
                `).join('')}
            </section>` : ''}
        </main>
    </div>
    `;
}
