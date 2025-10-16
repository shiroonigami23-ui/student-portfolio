/**
 * This module handles the data structure and business logic for a single portfolio.
 */

/**
 * Creates a new, structured portfolio object from raw form data.
 * @param {object} formData - The data collected from the editor form.
 * @returns {object} A complete portfolio object with an ID and timestamps.
 */
export function createPortfolio(formData) {
    const timestamp = new Date().toISOString();
    return {
        ...formData,
        id: `portfolio_${Date.now()}`,
        createdAt: timestamp,
        lastModified: timestamp,
    };
}

/**
 * Prepares an existing portfolio object for an update.
 * @param {object} existingData - The original portfolio data.
 * @param {object} newData - The new data from the editor form.
 * @returns {object} The merged and updated portfolio object.
 */
export function updatePortfolio(existingData, newData) {
     return {
        ...existingData,
        ...newData,
        lastModified: new Date().toISOString(),
    };
}
