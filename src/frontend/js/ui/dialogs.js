import { elements } from '../state.js';
import { t } from '../../i18n.js';

export function showSaveErrorDialog(message) {
    return new Promise((resolve) => {
        elements.errorMessage.textContent = message;
        elements.errorDialog.classList.remove('hidden');

        const onRetry = () => {
            cleanup();
            resolve('retry');
        };

        const onSaveAs = () => {
            cleanup();
            resolve('saveAs');
        };

        const onCancel = () => {
            cleanup();
            resolve('cancel');
        };

        function cleanup() {
            elements.errorDialog.classList.add('hidden');
            elements.retryBtn.removeEventListener('click', onRetry);
            elements.saveAsBtn.removeEventListener('click', onSaveAs);
            elements.cancelExitBtn.removeEventListener('click', onCancel);
        }

        elements.retryBtn.addEventListener('click', onRetry);
        elements.saveAsBtn.addEventListener('click', onSaveAs);
        elements.cancelExitBtn.addEventListener('click', onCancel);
    });
}

export function showAlertDialog(message, title = null) {
    return new Promise((resolve) => {
        if (!elements.alertDialog) {
            console.warn('alertDialog element not found');
            resolve();
            return;
        }

        elements.alertTitle.textContent = title || t('ui.dialog.alert.title');
        elements.alertMessage.textContent = message;
        elements.alertDialog.classList.remove('hidden');

        if (elements.alertOkBtn) {
            elements.alertOkBtn.focus();
        }

        const onClose = () => {
            cleanup();
            resolve();
        };

        const onKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        function cleanup() {
            elements.alertDialog.classList.add('hidden');
            if (elements.alertOkBtn) {
                elements.alertOkBtn.removeEventListener('click', onClose);
            }
            window.removeEventListener('keydown', onKeyDown, true);
        }

        if (elements.alertOkBtn) {
            elements.alertOkBtn.addEventListener('click', onClose);
        }
        window.addEventListener('keydown', onKeyDown, true);
    });
}

