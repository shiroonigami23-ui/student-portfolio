const PORTFOLIO_KEY = 'portfolioApp.portfolios';
const THEME_KEY = 'portfolioApp.theme';

export function getPortfolios() {
    return JSON.parse(localStorage.getItem(PORTFOLIO_KEY)) || [];
}

export function savePortfolios(portfolios) {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolios));
}

export function getPortfolioById(id) {
    return getPortfolios().find(p => p.id === id);
}

export function addPortfolio(portfolioData) {
    const portfolios = getPortfolios();
    const newPortfolio = {
        ...portfolioData,
        id: `portfolio_${Date.now()}`,
        lastModified: new Date().toISOString(),
    };
    portfolios.push(newPortfolio);
    savePortfolios(portfolios);
}

export function updatePortfolio(updatedData) {
    const portfolios = getPortfolios();
    const index = portfolios.findIndex(p => p.id === updatedData.id);
    if (index > -1) {
        portfolios[index] = {
            ...portfolios[index],
            ...updatedData,
            lastModified: new Date().toISOString(),
        };
        savePortfolios(portfolios);
    }
}

export function deletePortfolio(id) {
    let portfolios = getPortfolios();
    portfolios = portfolios.filter(p => p.id !== id);
    savePortfolios(portfolios);
}

export function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}

export function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'theme-space';
}
