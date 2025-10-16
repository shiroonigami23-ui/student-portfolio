
export function isNotEmpty(value) {
    return value && value.trim() !== '';
}
export function isValidEmail(email) {
    if (!email) return true; 
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

export function isValidUrl(url) {
    if (!url || url.trim() === '') return true; 
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

export function validatePortfolioData(data) {
    const errors = [];

    if (!isNotEmpty(data.portfolioTitle)) {
        errors.push('Portfolio Title is required.');
    }
    if (!isNotEmpty(data.firstName)) {
        errors.push('First Name is required.');
    }
    if (!isValidEmail(data.email)) {
        errors.push('Please enter a valid Email Address.');
    }

    data.projects.forEach((project, index) => {
        if (!isValidUrl(project.liveUrl)) {
            errors.push(`Project ${index + 1}: Live Demo URL is invalid.`);
        }
        if (!isValidUrl(project.repoUrl)) {
            errors.push(`Project ${index + 1}: Source Code URL is invalid.`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors: errors,
    };
}
