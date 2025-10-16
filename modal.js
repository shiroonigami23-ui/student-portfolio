import { showToast } from './notifications.js';

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalActions = document.getElementById('modal-actions');

let activeModal = null;

function showModal(title, message, buttons, isHtml = false) {
    if (activeModal) return;

    modalTitle.textContent = title;
    if (isHtml) {
        modalMessage.innerHTML = message;
    } else {
        modalMessage.textContent = message;
    }
    modalActions.innerHTML = '';

    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.className = btnInfo.class || '';
        button.addEventListener('click', () => {
            if (btnInfo.onClick) {
                btnInfo.onClick();
            }
            hideModal();
        });
        modalActions.appendChild(button);
    });

    modalOverlay.classList.remove('hidden');
    activeModal = { hide: hideModal };
}

function hideModal() {
    if (!activeModal) return;
    modalOverlay.classList.add('hidden');
    activeModal = null;
}

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay && activeModal) {
        activeModal.hide();
    }
});

export function showConfirmation(title, message, onConfirm) {
    showModal(title, message, [
        { text: 'Cancel' },
        { text: 'Confirm', class: 'delete-btn', onClick: onConfirm }
    ]);
}

export function showAlert(title, message) {
    showModal(title, message, [{ text: 'OK', class: 'primary-btn' }]);
}

export function showShareModal(url) {
    const messageHtml = `
        <p>Anyone with this link can view a read-only version of your portfolio.</p>
        <div class="share-link-wrapper">
            <input type="text" readonly value="${url}" id="share-link-input">
            <button id="copy-share-link-btn" class="primary-btn">Copy</button>
        </div>
    `;
    showModal("Share Portfolio", messageHtml, [{ text: 'Close' }], true);

    // Add copy functionality after modal is shown
    const copyBtn = document.getElementById('copy-share-link-btn');
    const linkInput = document.getElementById('share-link-input');
    if (copyBtn && linkInput) {
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent modal from closing
            linkInput.select();
            document.execCommand('copy');
            showToast("Link copied!", 'success');
        });
    }
}
