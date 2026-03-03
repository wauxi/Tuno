const ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return str ?? '';
    return str.replace(/[&<>"']/g, ch => ESC_MAP[ch]);
}
