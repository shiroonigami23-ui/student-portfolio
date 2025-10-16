export function isNotEmpty(value) {
    return value && value.trim() !== '';
}

export function isValidEmail(email) {
    if (!email || email.trim() === '') return true; // Optional field
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

export function isValidUrl(url) {
    if (!url || url.trim() === '') return true; // Optional field
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

// Renamed this function to match the call in app.js
export function validatePortfolio(data) {
    const errors = [];

    if (!isNotEmpty(data.portfolioTitle)) {
        errors.push({ field: 'portfolioTitle', message: 'Portfolio Title is required.' });
    }
    if (!isNotEmpty(data.firstName)) {
        errors.push({ field: 'firstName', message: 'First Name is required.' });
    }
     if (!isNotEmpty(data.lastName)) {
        errors.push({ field: 'lastName', message: 'Last Name is required.' });
    }
    if (!isValidEmail(data.email)) {
        errors.push({ field: 'email', message: 'Please enter a valid Email Address.' });
    }

    data.projects.forEach((project, index) => {
        if (!isValidUrl(project.liveUrl)) {
            errors.push({ field: `projectLiveUrl-${index}`, message: `Project ${index + 1}: Live Demo URL is invalid.` });
        }
        if (!isValidUrl(project.repoUrl)) {
            errors.push({ field: `projectRepoUrl-${index}`, message: `Project ${index + 1}: Source Code URL is invalid.` });
        }
    });

    return errors;
}
