import { isNotEmpty, isValidEmail, isValidUrl } from './validator.js';

// --- MODULE SCOPED VARIABLES ---
// These are declared here but will be assigned a value in the init() function
let form, steps, profilePicInput, profilePicPreview, removePicBtn;
let currentStep = 1;

/**
 * Initializes the editor module by finding all necessary DOM elements.
 * This MUST be called after the DOM is fully loaded.
 */
export function init() {
    form = document.getElementById('portfolio-form');
    steps = form.querySelectorAll(".form-step");
    profilePicInput = document.getElementById('profile-pic-input');
    profilePicPreview = document.getElementById('profile-pic-preview');
    removePicBtn = document.getElementById('remove-pic-btn');

    // Attach event listeners that are internal to the editor
    document.getElementById('next-step-btn').addEventListener('click', () => navigateSteps(1));
    document.getElementById('prev-step-btn').addEventListener('click', () => navigateSteps(-1));
    document.getElementById('add-experience-btn').addEventListener('click', () => addWorkItem());
    document.getElementById('add-education-btn').addEventListener('click', () => addEducationItem());
    document.getElementById('add-skill-btn').addEventListener('click', () => addSkillItem());
    document.getElementById('add-project-btn').addEventListener('click', () => addProjectItem());
    profilePicInput.addEventListener('change', handleImageUpload);
    removePicBtn.addEventListener('click', removeProfilePic);

    // Initialize drag-and-drop
    ['experience-editor', 'education-editor', 'skills-editor', 'projects-editor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) new Sortable(el, { animation: 150, handle: '.item-editor' });
    });
}


export function setupLiveValidation() {
    const fieldsToValidate = [
        { selector: '[name="portfolioTitle"]', validator: isNotEmpty },
        { selector: '[name="firstName"]', validator: isNotEmpty },
        { selector: '[name="email"]', validator: isValidEmail },
    ];

    fieldsToValidate.forEach(({ selector, validator }) => {
        const input = form.querySelector(selector);
        if (input) {
            input.addEventListener('input', () => {
                const isValid = validator(input.value);
                input.classList.toggle('invalid', !isValid);
            });
        }
    });

    form.addEventListener('input', (e) => {
        if (e.target.matches('[name="projectLiveUrl"], [name="projectRepoUrl"]')) {
             const isValid = isValidUrl(e.target.value);
             e.target.classList.toggle('invalid', !isValid);
        }
    });
}

export function resetForm() {
    form.reset();
    form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    ['experience-editor', 'education-editor', 'skills-editor', 'projects-editor'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
    removeProfilePic();
    currentStep = 1;
    showStep(currentStep);
    addWorkItem();
    addEducationItem();
    addSkillItem();
    addProjectItem();
}

export function populateForm(data) {
    form.reset();
    form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    removeProfilePic();
     ['experience-editor', 'education-editor', 'skills-editor', 'projects-editor'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });

    Object.keys(data).forEach(key => {
        const el = form.elements[key];
        if (el && el.type !== 'file') {
             el.value = data[key];
        }
    });

    if (data.profilePic) {
        profilePicPreview.src = data.profilePic;
        profilePicPreview.classList.remove('hidden');
        removePicBtn.classList.remove('hidden');
    }

    const populateSection = (key, adder) => {
        if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
            data[key].forEach(item => adder(item));
        } else {
             adder(); // Add one empty item if the section is empty
        }
    };

    populateSection('experience', addWorkItem);
    populateSection('education', addEducationItem);
    populateSection('skills', addSkillItem);
    populateSection('projects', addProjectItem);

    currentStep = 1;
    showStep(currentStep);
}

export function collectFormData() {
    const data = {};
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        if (key !== 'profilePicInput') data[key] = value;
    }

    // Only include profile pic if it's a new base64 image
    data.profilePic = profilePicPreview.src.startsWith('data:image') ? profilePicPreview.src : (profilePicPreview.src.startsWith('http') ? profilePicPreview.src : null);


    data.experience = mapEditorItems('#experience-editor', card => ({
        title: card.querySelector('[name="jobTitle"]').value.trim(),
        company: card.querySelector('[name="company"]').value.trim(),
        dates: card.querySelector('[name="jobDates"]').value.trim(),
        description: card.querySelector('[name="jobDescription"]').value.trim()
    })).filter(item => item.title || item.company); // Filter out empty items

    data.education = mapEditorItems('#education-editor', card => ({
        degree: card.querySelector('[name="degree"]').value.trim(),
        institution: card.querySelector('[name="institution"]').value.trim(),
        year: card.querySelector('[name="gradYear"]').value.trim()
    })).filter(item => item.degree || item.institution);

    data.skills = mapEditorItems('#skills-editor', card => ({
        name: card.querySelector('[name="skillName"]').value.trim(),
        level: card.querySelector('[name="skillLevel"]').value
    })).filter(item => item.name);

    data.projects = mapEditorItems('#projects-editor', card => ({
        title: card.querySelector('[name="projectTitle"]').value.trim(),
        description: card.querySelector('[name="projectDescription"]').value.trim(),
        technologies: card.querySelector('[name="projectTech"]').value.trim(),
        liveUrl: card.querySelector('[name="projectLiveUrl"]').value.trim(),
        repoUrl: card.querySelector('[name="projectRepoUrl"]').value.trim()
    })).filter(item => item.title);

    return data;
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePicPreview.src = e.target.result;
            profilePicPreview.classList.remove('hidden');
            removePicBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function removeProfilePic() {
    profilePicInput.value = ''; // Clear the file input
    profilePicPreview.src = '#';
    profilePicPreview.classList.add('hidden');
    removePicBtn.classList.add('hidden');
}

function mapEditorItems(selector, mapper) {
    return Array.from(document.querySelectorAll(`${selector} .item-editor`)).map(mapper);
}

function navigateSteps(direction) {
    const newStep = currentStep + direction;
    if (newStep > 0 && newStep <= steps.length) {
        currentStep = newStep;
        showStep(currentStep);
    }
}

function showStep(stepNum) {
    steps.forEach((step, index) => {
        step.classList.toggle('active', index + 1 === stepNum);
    });
    document.getElementById('prev-step-btn').disabled = stepNum === 1;
    document.getElementById('next-step-btn').disabled = stepNum === steps.length;
}

function createDeletableItem(container, html) {
    const div = document.createElement('div');
    div.className = 'item-editor';
    div.innerHTML = html;
    div.querySelector('.item-delete-btn').addEventListener('click', () => {
        // Prevent deleting the last item to avoid empty sections
        if (container.children.length > 1) {
            div.remove();
        } else {
            // Clear fields of the last item instead of removing it
            div.querySelectorAll('input, textarea, select').forEach(input => {
                if(input.type === 'select-one') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
    });
    container.appendChild(div);
}

function addWorkItem(exp = { title: '', company: '', dates: '', description: '' }) {
    createDeletableItem(document.getElementById('experience-editor'), `
        <button type="button" class="delete-btn item-delete-btn" title="Delete Item">×</button>
        <input type="text" name="jobTitle" placeholder="Job Title" value="${exp.title}">
        <input type="text" name="company" placeholder="Company" value="${exp.company}">
        <input type="text" name="jobDates" placeholder="Start - End Dates" value="${exp.dates}">
        <div class="textarea-wrapper">
            <textarea name="jobDescription" placeholder="Job Description (Markdown supported)">${exp.description}</textarea>
            <button type="button" class="ai-assist-btn" title="AI Assist">✨</button>
        </div>
    `);
}

function addEducationItem(edu = { degree: '', institution: '', year: '' }) {
    createDeletableItem(document.getElementById('education-editor'), `
        <button type="button" class="delete-btn item-delete-btn" title="Delete Item">×</button>
        <input type="text" name="degree" placeholder="Degree / Certificate" value="${edu.degree}">
        <input type="text" name="institution" placeholder="Institution" value="${edu.institution}">
        <input type="text" name="gradYear" placeholder="Graduation Year" value="${edu.year}">
    `);
}

function addSkillItem(skill = { name: '', level: 'Intermediate' }) {
    createDeletableItem(document.getElementById('skills-editor'), `
        <button type="button" class="delete-btn item-delete-btn" title="Delete Item">×</button>
        <input type="text" name="skillName" placeholder="Skill (e.g., JavaScript)" value="${skill.name}">
        <select name="skillLevel">
            <option ${skill.level === 'Novice' ? 'selected' : ''}>Novice</option>
            <option ${skill.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
            <option ${skill.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
            <option ${skill.level === 'Expert' ? 'selected' : ''}>Expert</option>
        </select>
    `);
}

function addProjectItem(p = { title: '', description: '', technologies: '', liveUrl: '', repoUrl: '' }) {
    createDeletableItem(document.getElementById('projects-editor'), `
        <button type="button" class="delete-btn item-delete-btn" title="Delete Item">×</button>
        <input type="text" name="projectTitle" placeholder="Project Title" value="${p.title}">
         <div class="textarea-wrapper">
            <textarea name="projectDescription" placeholder="Project Description (Markdown supported)">${p.description}</textarea>
            <button type="button" class="ai-assist-btn" title="AI Assist">✨</button>
        </div>
        <input type="text" name="projectTech" placeholder="Technologies (comma-separated)" value="${p.technologies}">
        <div class="inline-inputs">
            <input type="text" name="projectLiveUrl" placeholder="Live Demo URL" value="${p.liveUrl}">
            <input type="text" name="projectRepoUrl" placeholder="Source Code URL" value="${p.repoUrl}">
        </div>
    `);
}
