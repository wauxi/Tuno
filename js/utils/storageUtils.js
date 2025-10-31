/**
 * LocalStorage Utilities
 * Утилиты для работы с localStorage
 */

/**
 * Безопасно получить и распарсить данные из localStorage
 * @param {string} key - ключ
 * @param {*} defaultValue - значение по умолчанию
 * @returns {*}
 */
export const getItem = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;
        
        try {
            return JSON.parse(item);
        } catch {
            return item;
        }
    } catch (error) {
        console.warn(`Failed to get item from localStorage: ${key}`, error);
        return defaultValue;
    }
};

/**
 * Безопасно сохранить данные в localStorage
 * @param {string} key - ключ
 * @param {*} value - значение
 * @returns {boolean} успех операции
 */
export const setItem = (key, value) => {
    try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        return true;
    } catch (error) {
        console.warn(`Failed to set item in localStorage: ${key}`, error);
        return false;
    }
};

/**
 * Безопасно удалить данные из localStorage
 * @param {string} key - ключ
 * @returns {boolean} успех операции
 */
export const removeItem = (key) => {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn(`Failed to remove item from localStorage: ${key}`, error);
        return false;
    }
};

/**
 * Удалить несколько ключей
 * @param {string[]} keys - массив ключей
 */
export const removeItems = (keys) => {
    keys.forEach(key => removeItem(key));
};

/**
 * Очистить весь localStorage (осторожно!)
 * @returns {boolean} успех операции
 */
export const clear = () => {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.warn('Failed to clear localStorage', error);
        return false;
    }
};

/**
 * Проверить наличие ключа
 * @param {string} key - ключ
 * @returns {boolean}
 */
export const hasItem = (key) => {
    return localStorage.getItem(key) !== null;
};

/**
 * Получить размер данных в localStorage (приблизительно)
 * @returns {number} размер в байтах
 */
export const getSize = () => {
    let size = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            size += localStorage[key].length + key.length;
        }
    }
    return size;
};
