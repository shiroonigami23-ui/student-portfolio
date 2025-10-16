const notificationContainer = document.getElementById('notification-container');

/**
 * Shows a toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - The type of notification ('success', 'error', 'info').
 * @param {number} duration - How long the toast should be visible in milliseconds.
 */
export function showToast(message, type = 'info', duration = 3000) {
    if (!notificationContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    notificationContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('visible');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}
