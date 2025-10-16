let currentStep = 1;
const form = document.getElementById('portfolio-form');
const steps = form.querySelectorAll(".form-step");

// Navigation Event Listeners
document.getElementById('next-step-btn').addEventListener('click', () => navigateSteps(1));
document.getElementById('prev-step-btn').addEventListener('click', () => navigateSteps(-1));

// Dynamic Item Buttons
document.getElementById('add-experience-btn').addEventListener('click', () => addWorkItem());
document.getElementById('add-education-btn').addEventListener('click', () => addEducationItem());
document.getElementById('add-skill-btn').addEventListener('click', () => addSkillItem());
document.getElementById('add-project-btn').addEventListener('click', () => addProjectItem());

// Initialize drag-and-drop on all lists
['experience-editor', 'education-editor', 'skills-editor', 'projects-editor'].forEach(id => {
    const el = document.getElementById(id);
    if(el) new Sortable(el, { animation: 150, handle: '.item-editor' });
});


export function resetForm() {
    form.reset();
    document.getElementById('experience-editor').innerHTML = '';
    document.getElementById('education-editor').innerHTML = '';
    document.getElementById('skills-editor').innerHTML = '';
    document.getElementById('projects-editor').innerHTML = '';
    currentStep = 1;
    showStep(currentStep);
    addWorkItem(); 
    addEducationItem();
    addSkillItem();
    addProjectItem();
}

export function populateForm(data) {
    resetForm();
    Object.keys(data).forEach(key => {
        const el = form.elements[key];
        if (el) el.value = data[key];
    });

    const populateSection = (key, adder) => {
        const editorId = `${key}-editor`;
        // Handle edge case for 'experiences' -> 'experience'
        if (key === 'experience') editorId = 'experience-editor';
        if (data[key] && data[key].length > 0) {
            document.getElementById(editorId).innerHTML = '';
            data[key].forEach(item => adder(item));
        }
    };
    
    populateSection('experience', addWorkItem);
    populateSection('education', addEducationItem);
    populateSection('skills', addSkillItem);
    populateSection('projects', addProjectItem);
}

export function collectFormData() {
    const data = {};
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    data.experience = Array.from(document.querySelectorAll('#experience-editor .item-editor')).map(card => ({
        title: card.querySelector('[name="jobTitle"]').value,
        company: card.querySelector('[name="company"]').value,
        dates: card.querySelector('[name="jobDates"]').value,
        description: card.querySelector('[name="jobDescription"]').value
    }));
    data.education = Array.from(document.querySelectorAll('#education-editor .item-editor')).map(card => ({
        degree: card.querySelector('[name="degree"]').value,
        institution: card.querySelector('[name="institution"]').value,
        year: card.querySelector('[name="gradYear"]').value
    }));
    data.skills = Array.from(document.querySelectorAll('#skills-editor .item-editor')).map(card => ({
        name: card.querySelector('[name="skillName"]').value,
        level: card.querySelector('[name="skillLevel"]').value
    }));
    data.projects = Array.from(document.querySelectorAll('#projects-editor .item-editor')).map(card => ({
        title: card.querySelector('[name="projectTitle"]').value,
        description: card.querySelector('[name="projectDescription"]').value,
        technologies: card.querySelector('[name="projectTech"]').value,
        liveUrl: card.querySelector('[name="projectLiveUrl"]').value,
        repoUrl: card.querySelector('[name="projectRepoUrl"]').value
    }));

    return data;
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
    div.querySelector('.item-delete-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
}

function addWorkItem(exp = { title: '', company: '', dates: '', description: '' }) {
    const container = document.getElementById('experience-editor');
    const html = `
        <input type="text" name="jobTitle" placeholder="Job Title" value="${exp.title}">
        <input type="text" name="company" placeholder="Company" value="${exp.company}">
        <input type="text" name="jobDates" placeholder="Start - End Dates" value="${exp.dates}">
        <textarea name="jobDescription" placeholder="Job Description & Achievements">${exp.description}</textarea>
        <button type="button" class="delete-btn item-delete-btn">Delete</button>
    `;
    createDeletableItem(container, html);
}

function addEducationItem(edu = { degree: '', institution: '', year: '' }) {
    const container = document.getElementById('education-editor');
    const html = `
        <input type="text" name="degree" placeholder="Degree / Certificate" value="${edu.degree}">
        <input type="text" name="institution" placeholder="Institution" value="${edu.institution}">
        <input type="text" name="gradYear" placeholder="Graduation Year" value="${edu.year}">
        <button type="button" class="delete-btn item-delete-btn">Delete</button>
    `;
    createDeletableItem(container, html);
}

function addSkillItem(skill = { name: '', level: 'Intermediate' }) {
    const container = document.getElementById('skills-editor');
    const html = `
        <input type="text" name="skillName" placeholder="Skill (e.g., JavaScript)" value="${skill.name}">
        <select name="skillLevel">
            <option ${skill.level === 'Novice' ? 'selected' : ''}>Novice</option>
            <option ${skill.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
            <option ${skill.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
            <option ${skill.level === 'Expert' ? 'selected' : ''}>Expert</option>
        </select>
        <button type="button" class="delete-btn item-delete-btn">Delete</button>
    `;
    createDeletableItem(container, html);
}

function addProjectItem(p = { title: '', description: '', technologies: '', liveUrl: '', repoUrl: '' }) {
     const container = document.getElementById('projects-editor');
     const html = `
        <input type="text" name="projectTitle" placeholder="Project Title" value="${p.title}">
        <textarea name="projectDescription" placeholder="Project Description">${p.description}</textarea>
        <input type="text" name="projectTech" placeholder="Technologies (comma-separated)" value="${p.technologies}">
        <div class="inline-inputs">
            <input type="text" name="projectLiveUrl" placeholder="Live Demo URL" value="${p.liveUrl}">
            <input type="text" name="projectRepoUrl" placeholder="Source Code URL" value="${p.repoUrl}">
        </div>
        <button type="button" class="delete-btn item-delete-btn">Delete</button>
     `;
     createDeletableItem(container, html);
}
