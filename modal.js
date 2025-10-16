const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalActions = document.getElementById('modal-actions');

let activeModal = null; // To handle one modal at a time

/**
 * The core function to display a modal with custom content and buttons.
 * @param {string} title - The title to display in the modal header.
 * @param {string} message - The main text content of the modal.
 * @param {Array<object>} buttons - An array of button objects, e.g., [{ text: 'OK', class: 'primary-btn', onClick: () => {} }]
 */
function showModal(title, message, buttons) {
    if (activeModal) return; // Prevent multiple modals

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalActions.innerHTML = ''; // Clear previous buttons

    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.className = btnInfo.class || ''; // Apply custom classes
        button.addEventListener('click', () => {
            if (btnInfo.onClick) {
                btnInfo.onClick();
            }
            hideModal();
        });
        modalActions.appendChild(button);
    });

    modalOverlay.classList.remove('hidden');
    activeModal = { hide: hideModal }; // Set the active modal
}

/**
 * Hides the currently active modal.
 */
function hideModal() {
    if (!activeModal) return;
    modalOverlay.classList.add('hidden');
    activeModal = null;
}

// Close modal if user clicks outside of the content area
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay && activeModal) {
        activeModal.hide();
    }
});

/**
 * Shows a confirmation dialog.
 * @param {string} title - The title of the confirmation.
 * @param {string} message - The question or message for the user.
 * @param {function} onConfirm - The function to call if the user confirms.
 */
export function showConfirmation(title, message, onConfirm) {
    showModal(title, message, [
        {
            text: 'Cancel',
            class: '',
            onClick: null // Just closes the modal
        },
        {
            text: 'Confirm',
            class: 'delete-btn',
            onClick: onConfirm
        }
    ]);
}

/**
 * Shows an alert message.
 * @param {string} title - The title of the alert.
 * @param {string} message - The message to display.
 */
export function showAlert(title, message) {
    showModal(title, message, [
        {
            text: 'OK',
            class: 'primary-btn',
            onClick: null // Just closes the modal
        }
    ]);
}
