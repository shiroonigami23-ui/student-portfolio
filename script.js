// -------------------
// Constants and State
// -------------------
const STORAGE_KEY = 'studentPortfolio-v2';
const STORAGE_DRAFT_KEY = `${STORAGE_KEY}_draft`;
const DEFAULTS = {
    skills: [
        { label: "Teamwork", val: 60 },
        { label: "Communication", val: 75 },
        { label: "Problem Solving", val: 70 },
    ],
    languages: ["C++", "Python", "JavaScript"],
    techAreas: ["Web Development", "AI/ML"]
};
const LANGUAGES = ["C", "C++", "Python", "Java", "JavaScript", "Kotlin", "Go", "Rust", "SQL"];
const TECH_AREAS = ["Web Development", "App Development", "AI/ML", "Database", "System Programming"];
let autoSaveTimeout;

// -------------------
// Initializer
// -------------------
document.addEventListener('DOMContentLoaded', () => {
    populateCheckboxes('languagesbox', LANGUAGES, 'language');
    populateCheckboxes('techbox', TECH_AREAS, 'tech');

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        fillFormAndPreview(JSON.parse(savedData));
    } else {
        const draftData = localStorage.getItem(STORAGE_DRAFT_KEY);
        if (draftData) {
            fillFormAndPreview(JSON.parse(draftData));
        } else {
            // Load with default values
            fillFormAndPreview({ skills: DEFAULTS.skills });
        }
    }

    setupEventListeners();
    updateLivePreview(); // Initial render
});

// -------------------
// Event Setup
// -------------------
function setupEventListeners() {
    const form = document.getElementById('profile-form');
    form.addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const formData = collectFormData();
            localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(formData));
            updateLivePreview();
        }, 500);
        updateLivePreview(); // Instant feedback
    });

    // The form doesn't really "submit" but we can use the button for final save
    // This is handled by the live-saving mechanism now.

    document.getElementById('theme-select').addEventListener('change', (e) => {
        setTheme(e.target.value);
    });

    document.getElementById('download-pdf-btn').addEventListener('click', handleDownload);
    document.getElementById('delete-btn').addEventListener('click', handleDelete);

    // File previews
    document.getElementById('profile-pic').addEventListener('change', handleProfilePicChange);
}


// -------------------
// Core Functions
// -------------------

function fillFormAndPreview(data) {
    fillFormFields(data);
    updateLivePreview();
}

function updateLivePreview() {
    const data = collectFormData();
    displayProfile(data);
}

function populateCheckboxes(containerId, items, name) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => `
        <label class="checkbox-label">
            <input type="checkbox" name="${name}" value="${item}" />${item}
        </label>
    `).join('') + `
        <label class="checkbox-label" id="${name}-other-label">
            <input type="checkbox" name="${name}" value="Other" /> Other
        </label>
        <div class="input-group" id="${name}-other-input-group" style="display:none; margin: 0.5rem 0 0 0;">
             <input type="text" id="${name}-other-text" placeholder=" " name="${name}_other" /><label>Specify Other</label>
        </div>
    `;

    container.querySelector('input[value="Other"]').addEventListener('change', (e) => {
        document.getElementById(`${name}-other-input-group`).style.display = e.target.checked ? 'block' : 'none';
    });
}

function setTheme(themeClass) {
    document.body.className = themeClass;
    localStorage.setItem('theme', themeClass);
    document.getElementById('theme-select').value = themeClass;
}

// -------------------
// Form Data Handling
// -------------------
function collectFormData() {
    const form = document.getElementById('profile-form');
    
    const getCheckedValues = (name) => {
        const values = Array.from(form.querySelectorAll(`input[name="${name}"]:checked`))
            .map(cb => cb.value);
        if (values.includes("Other")) {
            const otherValue = form.querySelector(`#${name}-other-text`).value.trim();
            if (otherValue) {
                // Replace "Other" with the actual value
                return [...values.filter(v => v !== "Other"), otherValue];
            }
        }
        return values;
    };
    
    const skills = Array.from(document.querySelectorAll('#skills-area .skill-input-row')).map(row => ({
        label: row.querySelector('.skill-label-input').value,
        val: row.querySelector('.skill-value-input').value
    }));

    const projects = Array.from(document.querySelectorAll('#projects-area .project-input-card')).map(card => ({
        title: card.querySelector('input[name="proj-title"]').value,
        desc: card.querySelector('textarea[name="proj-desc"]').value,
        stack: card.querySelector('input[name="proj-stack"]').value,
        link: card.querySelector('input[name="proj-link"]').value,
    }));

    return {
        firstName: form.querySelector('#first-name').value,
        lastName: form.querySelector('#last-name').value,
        rollno: form.querySelector('#rollno').value,
        email: form.querySelector('#email').value,
        summary: form.querySelector('#summary').value,
        hobbies: form.querySelector('#hobbies').value,
        languages: getCheckedValues('language'),
        techAreas: getCheckedValues('tech'),
        skills,
        projects,
        interests: form.querySelector('#interests').value,
        sports: form.querySelector('#sports').value,
        achievements: form.querySelector('#achievements').value,
        whatsapp: form.querySelector('#whatsapp').value,
        profilePic: document.getElementById('display-pic').src
    };
}

function fillFormFields(data) {
    if (!data) return;
    const form = document.getElementById('profile-form');

    form.querySelector('#first-name').value = data.firstName || '';
    form.querySelector('#last-name').value = data.lastName || '';
    // ... and so on for all simple fields
    ['rollno', 'email', 'summary', 'hobbies', 'interests', 'sports', 'achievements', 'whatsapp']
        .forEach(id => form.querySelector(`#${id}`).value = data[id] || '');
        
    const setCheckedValues = (name, values = []) => {
        const standardItems = name === 'language' ? LANGUAGES : TECH_AREAS;
        form.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
            cb.checked = values.includes(cb.value);
        });
        const otherValue = values.find(v => !standardItems.includes(v));
        if (otherValue) {
            const otherCheckbox = form.querySelector(`input[name="${name}"][value="Other"]`);
            otherCheckbox.checked = true;
            document.getElementById(`${name}-other-input-group`).style.display = 'block';
            form.querySelector(`#${name}-other-text`).value = otherValue;
        }
    };

    setCheckedValues('language', data.languages);
    setCheckedValues('tech', data.techAreas);

    // Skills & Projects
    renderSkills(data.skills || []);
    renderProjects(data.projects || []);

    // Profile Pic
    if (data.profilePic) document.getElementById('display-pic').src = data.profilePic;
    
    // Theme
    const savedTheme = localStorage.getItem('theme') || 'theme-space';
    setTheme(savedTheme);
}

// -------------------
// Dynamic UI Rendering
// -------------------

function renderSkills(skills = []) {
    const container = document.getElementById('skills-area');
    container.innerHTML = skills.map((skill, index) => `
        <div class="skill-input-row" data-index="${index}">
             <div class="grid-3">
                <div class="input-group"><input type="text" class="skill-label-input" placeholder=" " value="${skill.label}"/><label>Skill Name</label></div>
                <input type="range" class="skill-value-slider" min="0" max="100" value="${skill.val}" oninput="this.nextElementSibling.value = this.value">
                <input type="number" class="skill-value-input" min="0" max="100" value="${skill.val}" oninput="this.previousElementSibling.value = this.value">
                <button type="button" class="delete-item-btn" onclick="removeSkill(${index})">&times;</button>
            </div>
        </div>
    `).join('');
}

function addSkillInput() {
    const currentData = collectFormData();
    currentData.skills.push({ label: '', val: 50 });
    renderSkills(currentData.skills);
}
function removeSkill(index) {
     const currentData = collectFormData();
     currentData.skills.splice(index, 1);
     renderSkills(currentData.skills);
}

function renderProjects(projects = []) {
    const container = document.getElementById('projects-area');
    container.innerHTML = projects.map((proj, index) => `
        <div class="project-input-card" data-index="${index}">
            <details>
                <summary>${proj.title || 'New Project'}</summary>
                <div class="input-group"><input type="text" name="proj-title" placeholder=" " value="${proj.title || ''}"/><label>Project Title</label></div>
                <div class="input-group"><textarea name="proj-desc" placeholder=" " rows="2">${proj.desc || ''}</textarea><label>Description</label></div>
                <div class="input-group"><input type="text" name="proj-stack" placeholder=" " value="${proj.stack || ''}"/><label>Tech Stack</label></div>
                <div class="input-group"><input type="text" name="proj-link" placeholder=" " value="${proj.link || ''}"/><label>Link (GitHub/Live)</label></div>
                <button type="button" class="delete-item-btn" onclick="removeProject(${index})">Remove Project</button>
            </details>
        </div>
    `).join('');
}
function addProjectInput() {
    const currentData = collectFormData();
    currentData.projects.push({});
    renderProjects(currentData.projects);
}
function removeProject(index) {
    const currentData = collectFormData();
    currentData.projects.splice(index, 1);
    renderProjects(currentData.projects);
}


// -------------------
// Live Preview Display
// -------------------
function displayProfile(data) {
    // Header
    document.getElementById('display-name').textContent = `${data.firstName} ${data.lastName}`.trim() || 'Your Name';
    const subheader = [
        data.rollno ? `Roll: ${data.rollno}` : '',
        data.email ? data.email : ''
    ].filter(Boolean).join(' &bull; ');
    document.getElementById('display-subheader').innerHTML = subheader;
    document.getElementById('display-quote').textContent = data.summary || 'A brief summary about you will appear here.';

    const sectionsContainer = document.getElementById('preview-sections');
    sectionsContainer.innerHTML = ''; // Clear previous sections

    const createSection = (title, content) => {
        if (!content) return '';
        return `<div class="preview-section"><h3>${title}</h3>${content}</div>`;
    };

    // Skills
    const skillsContent = (data.skills && data.skills.length > 0) ? data.skills.map(s => `
        <div class="skill-row">
            <div class="skill-label">${s.label}</div>
            <div class="skill-bar-bg"><div class="skill-bar-fill" style="width: ${s.val}%"></div></div>
        </div>
    `).join('') : '<p>No skills added.</p>';
    sectionsContainer.innerHTML += createSection('Core Skills', skillsContent);

    // Projects
    const projectsContent = (data.projects && data.projects.length > 0) ? data.projects.map(p => `
        <div class="project-card">
            <h4>${p.title}</h4>
            <p>${p.desc}</p>
            ${p.link ? `<a href="${p.link}" target="_blank">View Project</a>` : ''}
        </div>
    `).join('') : '<p>No projects added.</p>';
    sectionsContainer.innerHTML += createSection('Projects', projectsContent);

    // Helper for badge/tag content
    const createGridContent = (items, type) => (items && items.length > 0)
        ? `<div class="${type}-grid">${items.map(i => `<span class="${type}">${i}</span>`).join('')}</div>` : '';
    
    sectionsContainer.innerHTML += createSection('Languages', createGridContent(data.languages, 'badge'));
    sectionsContainer.innerHTML += createSection('Technical Areas', createGridContent(data.techAreas, 'badge'));
    sectionsContainer.innerHTML += createSection('Interests', createGridContent(data.interests?.split(','), 'tag'));
    sectionsContainer.innerHTML += createSection('Achievements', createGridContent(data.achievements?.split(','), 'tag'));
    sectionsContainer.innerHTML += createSection('Sports & Clubs', createGridContent(data.sports?.split(','), 'badge'));
}

// -------------------
// Actions
// -------------------
function handleProfilePicChange(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('display-pic').src = event.target.result;
            updateLivePreview();
        };
        reader.readAsDataURL(file);
    }
}

function handleDownload() {
    const element = document.getElementById('profile-preview');
    const actions = element.querySelector('.preview-actions');
    actions.classList.add('pdf-hide');

    const opt = {
        margin: 0.5,
        filename: 'portfolio.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        actions.classList.remove('pdf-hide');
    });
}

function handleDelete() {
    if (confirm('Are you sure you want to delete this profile? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_DRAFT_KEY);
        window.location.reload();
    }
}
