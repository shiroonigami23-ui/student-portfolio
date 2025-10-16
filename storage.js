import { createPortfolio, updatePortfolio as updatePortfolioObject } from './portfolio.js';

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
    // Use the portfolio module to create the object
    const newPortfolio = createPortfolio(portfolioData);
    portfolios.push(newPortfolio);
    savePortfolios(portfolios);
}

export function updatePortfolio(updatedData) {
    const portfolios = getPortfolios();
    const index = portfolios.findIndex(p => p.id === updatedData.id);
    if (index > -1) {
        // Use the portfolio module to handle the update logic
        portfolios[index] = updatePortfolioObject(portfolios[index], updatedData);
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
