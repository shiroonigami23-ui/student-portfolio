let currentStep = 1;
const form = document.getElementById('portfolio-form');
const steps = form.querySelectorAll(".form-step");

// Navigation Event Listeners
document.getElementById('next-step-btn').addEventListener('click', () => navigateSteps(1));
document.getElementById('prev-step-btn').addEventListener('click', () => navigateSteps(-1));

// Dynamic Item Buttons
document.getElementById('add-skill-btn').addEventListener('click', () => addSkillItem());
document.getElementById('add-project-btn').addEventListener('click', () => addProjectItem());


export function resetForm() {
    form.reset();
    document.getElementById('skills-editor').innerHTML = '';
    document.getElementById('projects-editor').innerHTML = '';
    currentStep = 1;
    showStep(currentStep);
    addSkillItem(); // Start with one skill item
    addProjectItem(); // Start with one project item
}

export function populateForm(data) {
    resetForm();
    Object.keys(data).forEach(key => {
        const el = form.elements[key];
        if (el) {
            if(el.type === 'file') {
                // Cannot pre-fill file inputs
            } else {
                el.value = data[key];
            }
        }
    });

    // Populate dynamic items
    if (data.skills && data.skills.length > 0) {
        document.getElementById('skills-editor').innerHTML = '';
        data.skills.forEach(s => addSkillItem(s));
    }
    if (data.projects && data.projects.length > 0) {
        document.getElementById('projects-editor').innerHTML = '';
        data.projects.forEach(p => addProjectItem(p));
    }
}

export function collectFormData() {
    const data = {};
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Handle dynamic items
    data.skills = Array.from(document.querySelectorAll('#skills-editor .item-editor')).map(card => ({
        name: card.querySelector('[name="skillName"]').value,
        level: card.querySelector('[name="skillLevel"]').value
    }));
    data.projects = Array.from(document.querySelectorAll('#projects-editor .item-editor')).map(card => ({
        title: card.querySelector('[name="projectTitle"]').value,
        description: card.querySelector('[name="projectDescription"]').value
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

function addSkillItem(skill = { name: '', level: 'Intermediate' }) {
    const container = document.getElementById('skills-editor');
    const div = document.createElement('div');
    div.className = 'item-editor';
    div.innerHTML = `
        <input type="text" name="skillName" placeholder="Skill (e.g., JavaScript)" value="${skill.name}">
        <select name="skillLevel">
            <option ${skill.level === 'Novice' ? 'selected' : ''}>Novice</option>
            <option ${skill.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
            <option ${skill.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
            <option ${skill.level === 'Expert' ? 'selected' : ''}>Expert</option>
        </select>
        <button type="button" class="delete-btn item-delete-btn">Delete</button>
    `;
    div.querySelector('.item-delete-btn').addEventListener('click', () => {
        div.remove();
    });
    container.appendChild(div);
}

function addProjectItem(project = { title: '', description: '' }) {
     const container = document.getElementById('projects-editor');
     const div = document.createElement('div');
     div.className = 'item-editor project-editor';
     div.innerHTML = `
        <input type="text" name="projectTitle" placeholder="Project Title" value="${project.title}">
        <textarea name="projectDescription" placeholder="Project Description">${project.description}</textarea>
        <button type="button" class="delete-btn item-delete-btn">Delete</button>
     `;
     div.querySelector('.item-delete-btn').addEventListener('click', () => {
        div.remove();
    });
     container.appendChild(div);
}
