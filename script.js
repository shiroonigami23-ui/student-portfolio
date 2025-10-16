// -------------------
// Constants and State
// -------------------
const storageKey = 'studentPortfolio-2025';
const storageDraftKey = `${storageKey}_draft`;
let projFolded = true;
let profileProjectsVisible = false;
let skillsList = [
  { label: "Teamwork", val: 60 },
  { label: "Communication", val: 75 },
  { label: "Problem Solving", val: 70 },
  { label: "Coding (General)", val: 80 },
  { label: "Creativity", val: 75 }
];

const LANGUAGES = ["C", "C++", "Python", "Java", "JavaScript", "Kotlin", "Go", "Rust", "SQL"];
const TECH_AREAS = ["Web Development", "App Development", "AI/ML", "Database", "System Programming"];

// -------------------
// Initializer
// -------------------
document.addEventListener('DOMContentLoaded', () => {
    // Set theme from local storage or default
    setTheme(localStorage.getItem('theme') || 'theme-day');

    // Populate dynamic form elements
    populateCheckboxes('languagesbox', LANGUAGES, 'language');
    populateCheckboxes('techbox', TECH_AREAS, 'tech');

    // Load saved data or show form
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
        try {
            showProfile(JSON.parse(savedData));
        } catch (e) {
            console.error('Error loading saved data:', e);
            initializeForm();
        }
    } else {
        const draftData = localStorage.getItem(storageDraftKey);
        if (draftData) {
            try {
                fillFormFields(JSON.parse(draftData));
            } catch (e) {
                console.error('Error loading draft:', e);
            }
        }
        initializeForm();
    }
    
    // Setup event listeners
    setupEventListeners();
});

function initializeForm() {
    showForm();
    setupSkills();
    setupProjects();
}

// -------------------
// Event Setup
// -------------------
function setupEventListeners() {
    document.getElementById('profile-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('edit-btn').addEventListener('click', handleEdit);
    document.getElementById('delete-btn').addEventListener('click', handleDelete);
    document.getElementById('download-pdf').addEventListener('click', handleDownload);
    document.getElementById('profile-pic').addEventListener('change', handleFilePreview);
    document.getElementById('certificates').addEventListener('change', handleFilePreview);
    document.getElementById('display-pic').addEventListener('click', (e) => e.target.classList.toggle('pop'));
    setupInputValidation();

    // Auto-save form data on input
    let autoSaveTimeout;
    document.getElementById('form-container').addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const formData = collectFormData();
            localStorage.setItem(storageDraftKey, JSON.stringify(formData));
        }, 1000);
    });
}

// -------------------
// Theme Management
// -------------------
function setTheme(themeClass) {
    document.body.className = themeClass;
    localStorage.setItem('theme', themeClass);
}

// -------------------
// UI Switching
// -------------------
function showForm() {
    document.getElementById('profile').classList.remove('active');
    document.getElementById('form-container').classList.add('active');
}

function showProfile(data) {
    document.getElementById('form-container').classList.remove('active');
    document.getElementById('profile').classList.add('active');
    fillFormFields(data);
    displayProfile(data);
}

// -------------------
// Dynamic Form Population
// -------------------
function populateCheckboxes(containerId, items, name) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => `
        <label class="checkbox-label">
            <input type="checkbox" name="${name}" value="${item}" />${item}
        </label>
    `).join('') + `
        <label class="checkbox-label">
            <input type="checkbox" name="${name}" value="Other" id="${name}-other-checkbox" /> Other
        </label>
        <input type="text" id="${name}-other-text" class="other-input" placeholder="Specify other ${name}" />
    `;

    document.getElementById(`${name}-other-checkbox`).addEventListener('change', (e) => {
        document.getElementById(`${name}-other-text`).style.display = e.target.checked ? 'block' : 'none';
    });
}


// -------------------
// Form Validation
// -------------------
function setupInputValidation() {
    const validators = {
        'first-name': (val) => val && val.trim().length > 0,
        'last-name': (val) => val && val.trim().length > 0,
        'rollno': (val) => /^\d{1,3}$/.test(val),
        'email': (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        'whatsapp': (val) => /^(\d{10})(,\s*\d{10})*$/.test(val.trim())
    };

    Object.entries(validators).forEach(([id, validator]) => {
        const input = document.getElementById(id);
        const errorDiv = document.getElementById(`${id}-error`);
        const validate = () => {
            const isValid = validator(input.value);
            errorDiv.style.display = isValid ? 'none' : 'block';
            input.style.borderColor = isValid ? '#ffc174' : '#d32f2f';
            return isValid;
        };
        input.addEventListener('blur', validate);
        input.addEventListener('input', () => {
             if (input.style.borderColor === 'rgb(211, 47, 47)') {
                validate();
            }
        });
    });
}

function validateForm() {
    const requiredFields = ['first-name', 'last-name', 'rollno', 'whatsapp'];
    let allValid = true;
    requiredFields.forEach(id => {
        const input = document.getElementById(id);
        const errorDiv = document.getElementById(`${id}-error`);
        const isValid = input.checkValidity ? input.checkValidity() : (input.value.trim() !== '');
        if (!isValid) {
            allValid = false;
            errorDiv.style.display = 'block';
            input.style.borderColor = '#d32f2f';
        }
    });
    return allValid;
}


// -------------------
// Form Handling
// -------------------
function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
        alert('Please fix the errors before submitting.');
        return;
    }
    
    const formData = collectFormData();
    localStorage.setItem(storageKey, JSON.stringify(formData));
    localStorage.removeItem(storageDraftKey);
    showProfile(formData);
}

function collectFormData() {
    // Helper to get checked values including "Other"
    const getCheckedValues = (name) => {
        const values = [];
        document.querySelectorAll(`input[name="${name}"]:checked`).forEach(cb => {
            if (cb.value === "Other") {
                const otherText = document.getElementById(`${name}-other-text`).value.trim();
                if (otherText) values.push(otherText);
            } else {
                values.push(cb.value);
            }
        });
        return values;
    };

    return {
        firstName: document.getElementById('first-name').value.trim(),
        lastName: document.getElementById('last-name').value.trim(),
        rollno: document.getElementById('rollno').value.trim(),
        email: document.getElementById('email').value.trim(),
        summary: document.getElementById('summary').value.trim(),
        hobbies: document.getElementById('hobbies').value.trim(),
        languages: getCheckedValues('language'),
        techAreas: getCheckedValues('tech'),
        skills: skillsList.filter(skill => skill.label.trim()),
        projects: Array.from(document.querySelectorAll('#proj-fold .proj-item')).map(item => ({
            title: item.querySelector('.proj-field-title').value.trim(),
            desc: item.querySelector('.proj-field-desc').value.trim(),
            stack: item.querySelector('.proj-field-stack').value.trim(),
            link: item.querySelector('.proj-field-link').value.trim()
        })).filter(p => p.title),
        interests: document.getElementById('interests').value.trim(),
        sports: document.getElementById('sports').value.trim(),
        achievements: document.getElementById('achievements').value.trim(),
        whatsapp: document.getElementById('whatsapp').value.trim(),
        profilePic: document.getElementById('profile-pic-preview').src,
        certificates: Array.from(document.querySelectorAll('#certificate-preview img')).map(img => img.src)
    };
}


// -------------------
// Data Filling & Display
// -------------------
function fillFormFields(data) {
    if (!data) return;
    document.getElementById("first-name").value = data.firstName || "";
    document.getElementById("last-name").value = data.lastName || "";
    // ... (rest of the fields)
    
    // Checkboxes (handle "Other" fields)
    const setCheckboxes = (name, values) => {
        const standardValues = name === 'language' ? LANGUAGES : TECH_AREAS;
        document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
            cb.checked = values.includes(cb.value);
        });
        const otherValue = values.find(v => !standardValues.includes(v) && v !== "Other");
        if (otherValue) {
            document.getElementById(`${name}-other-checkbox`).checked = true;
            const otherInput = document.getElementById(`${name}-other-text`);
            otherInput.value = otherValue;
            otherInput.style.display = 'block';
        }
    };
    
    setCheckboxes('language', data.languages || []);
    setCheckboxes('tech', data.techAreas || []);

    // Skills
    if (data.skills) { skillsList = [...data.skills]; renderSkills(); }

    // Projects
    document.getElementById('proj-fold').innerHTML = '';
    (data.projects || []).forEach(p => addProjectInput(p.title, p.desc, p.stack, p.link));
    if (!data.projects || data.projects.length === 0) addProjectInput();
}


function displayProfile(data) {
    const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Your Name';
    const gradYear = new Date().getFullYear() + 2;

    document.getElementById('display-name').textContent = fullName;
    document.getElementById('display-rollno').textContent = data.rollno ? `Roll ${data.rollno}` : 'Roll No';
    document.getElementById('display-graduation').textContent = `CSE ${gradYear}`;
    document.getElementById('display-email').textContent = data.email || '';
    document.getElementById('email-separator').style.display = data.email ? 'inline' : 'none';
    document.getElementById('display-quote').textContent = data.summary || `${fullName} is a student passionate about technology.`;

    // Picture
    document.getElementById('display-pic').src = data.profilePic && data.profilePic.startsWith('data:image') 
        ? data.profilePic 
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='120' cy='120' r='120' fill='%23f0f0f0'/%3E%3Ccircle cx='120' cy='90' r='35' fill='%23ccc'/%3E%3Cpath d='M60 180c0-33 27-60 60-60s60 27 60 60v40H60v-40z' fill='%23ccc'/%3E%3C/svg%3E";

    // Badges & Tags
    createBadges('display-languages', data.languages);
    createBadges('display-tech', data.techAreas);
    createTags('display-interests', data.interests);
    createBadges('display-whatsapp', data.whatsapp);
    createBadges('display-sports', data.sports, 'sports-badge');
    createTags('display-achievements', data.achievements);
    
    // Skills
    const skillsDiv = document.getElementById('profile-skills');
    skillsDiv.innerHTML = (data.skills && data.skills.length > 0) ? data.skills.map(skill => `
        <div class="skill-row">
            <div class="skill-label">${skill.label}</div>
            <div class="skill-bar-bg"><div class="skill-bar-fill" style="width: ${skill.val}%"></div></div>
            <div class="skill-bar-val">${skill.val}%</div>
        </div>
    `).join('') : '<p>No skills added.</p>';

    // Projects
    const projectsDiv = document.getElementById('profile-projects');
    document.getElementById('profile-proj-count').textContent = data.projects.length ? `(${data.projects.length})` : '';
    projectsDiv.innerHTML = (data.projects && data.projects.length > 0) ? data.projects.map(p => `
        <div class="project-card">
            <div class="project-title">${p.title}</div>
            ${p.desc ? `<div class="project-desc">${p.desc}</div>` : ''}
            ${p.stack ? `<div class="project-stack">Stack: ${p.stack}</div>` : ''}
            ${p.link ? `<a href="${p.link.startsWith('http') ? p.link : '//'+p.link}" class="project-link" target="_blank">View Project</a>` : ''}
        </div>
    `).join('') : '<div class="project-card">No projects added yet.</div>';

    // Conditional Sections
    toggleSection('about-section', data.hobbies);
    document.getElementById('display-hobbies').textContent = data.hobbies;
    toggleSection('interest-section', data.interests);
    toggleSection('sports-section', data.sports);
    toggleSection('achieve-section', data.achievements || (data.certificates && data.certificates.length));

    // Certificates
    const certsDiv = document.getElementById('achievement-certificates');
    certsDiv.innerHTML = (data.certificates || []).map(cert => `<div class="cert-item"><img src="${cert}" alt="Certificate" /></div>`).join('');
}

// -------------------
// Dynamic Element Creators
// -------------------
function createBadges(containerId, data, className = 'badge') {
    const container = document.getElementById(containerId);
    if (data && data.length) {
        container.innerHTML = (Array.isArray(data) ? data : data.split(','))
            .map(item => `<div class="${className}">${item.trim()}</div>`).join('');
    } else {
        container.innerHTML = `<div class="badge-placeholder">Not specified</div>`;
    }
}

function createTags(containerId, data) {
    const container = document.getElementById(containerId);
    if (data && data.trim()) {
        container.innerHTML = data.split(',')
            .map(item => `<div class="tag">${item.trim()}</div>`).join('');
    } else {
        container.innerHTML = `<div class="badge-placeholder">Not specified</div>`;
    }
}

function toggleSection(sectionId, data) {
    document.getElementById(sectionId).style.display = (data && data.trim()) ? 'block' : 'none';
}


// -------------------
// Component Logic (Skills, Projects)
// -------------------
function setupSkills() { renderSkills(); }

function renderSkills() {
    const skillsDiv = document.getElementById('skills-area');
    skillsDiv.innerHTML = '';
    skillsList.forEach((skill, index) => {
        const row = document.createElement('div');
        row.className = "skill-row";
        row.innerHTML = `
            <input type="text" value="${skill.label}" class="skill-label-input" onchange="skillsList[${index}].label = this.value;" />
            <input type="range" min="0" max="100" value="${skill.val}" class="skill-slider" oninput="updateSkillValue(this, ${index}, 'slider')" />
            <input type="number" min="0" max="100" value="${skill.val}" class="skill-number-input" oninput="updateSkillValue(this, ${index}, 'number')" />
            <button type="button" class="skill-delete-btn" onclick="deleteSkill(${index})">Delete</button>
        `;
        skillsDiv.appendChild(row);
    });
}

function updateSkillValue(element, index, sourceType) {
    const value = parseInt(element.value, 10);
    skillsList[index].val = value;
    const row = element.closest('.skill-row');
    if (sourceType === 'slider') {
        row.querySelector('.skill-number-input').value = value;
    } else {
        row.querySelector('.skill-slider').value = value;
    }
}

function deleteSkill(index) {
    skillsList.splice(index, 1);
    renderSkills();
}

function addSkillInput() {
    skillsList.push({ label: 'New Skill', val: 60 });
    renderSkills();
}

function setupProjects() {
    projFolded = true;
    document.getElementById('proj-arrow').style.transform = '';
    const foldEl = document.getElementById('proj-fold');
    foldEl.innerHTML = '';
    addProjectInput();
    updateProjectCount();
    if (projFolded) foldEl.classList.add('project-hide');
}

function addProjectInput(title = '', desc = '', stack = '', link = '') {
    const list = document.getElementById('proj-fold');
    const item = document.createElement('div');
    item.className = "proj-item";
    item.innerHTML = `
        <button class="delproj-btn" type="button" onclick="this.parentElement.remove(); updateProjectCount();">Delete</button>
        <label>Project Title</label>
        <input type="text" class="proj-field-title" placeholder="e.g., Attendance Manager" value="${title}"/>
        <label>Description</label>
        <input type="text" class="proj-field-desc" placeholder="One line about project" value="${desc}"/>
        <label>Stack/Tags</label>
        <input type="text" class="proj-field-stack" placeholder="e.g., React, Node.js, Mongo" value="${stack}"/>
        <label>Link</label>
        <input type="text" class="proj-field-link" placeholder="GitHub or demo" value="${link}"/>
    `;
    list.appendChild(item);
    updateProjectCount();
}

function updateProjectCount() {
    const count = document.querySelectorAll('#proj-fold .proj-item').length;
    document.getElementById('proj-count').textContent = count ? `(${count})` : '';
}

function toggleProjects() {
    projFolded = !projFolded;
    document.getElementById('proj-fold').classList.toggle('project-hide', projFolded);
    document.getElementById('proj-arrow').style.transform = projFolded ? 'rotate(0deg)' : 'rotate(180deg)';
}

function toggleProfileProjects() {
    profileProjectsVisible = !profileProjectsVisible;
    document.getElementById('profile-projects').classList.toggle('project-hide', !profileProjectsVisible);
    document.getElementById('profile-proj-arrow').style.transform = profileProjectsVisible ? 'rotate(180deg)' : 'rotate(0deg)';
}


// -------------------
// Actions & Utilities
// -------------------
function handleEdit() {
    showForm();
}

function handleDelete() {
    if (confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(storageDraftKey);
        document.getElementById('profile-form').reset();
        document.querySelectorAll('.other-input').forEach(i => i.style.display = 'none');
        document.getElementById('profile-pic-preview').style.display = 'none';
        document.getElementById('certificate-preview').innerHTML = '';
        skillsList = []; // Reset skills
        initializeForm();
    }
}

function handleFilePreview(e) {
    const file = e.target.files[0];
    const isProfilePic = e.target.id === 'profile-pic';
    
    if (isProfilePic) {
        const preview = document.getElementById('profile-pic-preview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    } else { // Certificates
        const previewContainer = document.getElementById('certificate-preview');
        previewContainer.innerHTML = '';
        Array.from(e.target.files).forEach(f => {
            if (f.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(f);
            }
        });
    }
}

function handleDownload() {
    const element = document.getElementById('profile');
    const controls = document.querySelectorAll('.profile-actions, .download-section, .theme-switch');
    const opt = {
        margin: 0.3,
        filename: 'portfolio.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const wasVisible = profileProjectsVisible;
    if (!profileProjectsVisible) toggleProfileProjects();

    controls.forEach(el => el.classList.add('pdf-hide'));
    
    html2pdf().set(opt).from(element).save().then(() => {
        controls.forEach(el => el.classList.remove('pdf-hide'));
        if (!wasVisible) toggleProfileProjects();
    }).catch(err => {
        console.error("PDF generation failed:", err);
        controls.forEach(el => el.classList.remove('pdf-hide'));
        if (!wasVisible) toggleProfileProjects();
    });
}
