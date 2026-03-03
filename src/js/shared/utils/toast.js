/**
 * Lightweight toast notification — replaces alert() across the app.
 */

const TOAST_DURATION = 3500;

let container = null;

function getContainer() {
    if (!container || !document.body.contains(container)) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
export function showToast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = message;

    const wrap = getContainer();
    wrap.appendChild(el);

    requestAnimationFrame(() => el.classList.add('toast--visible'));

    setTimeout(() => {
        el.classList.remove('toast--visible');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        setTimeout(() => el.remove(), 400);
    }, TOAST_DURATION);
}
