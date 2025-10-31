/**
 * Утилита для работы с рейтингами
 */
export class RatingUtils {
    /**
     * Генерирует HTML звезд для отображения рейтинга
     * @param {number} currentRating - Рейтинг по 10-балльной шкале
     * @param {boolean} showHalfStars - Показывать ли половинки звезд
     * @returns {string} HTML строка со звездами
     */
    static generateStarRating(currentRating, showHalfStars = true) {
        const fiveStarRating = currentRating / 2;
        
        if (fiveStarRating === 0) {
            return '<span class="no-rating">Нет оценки</span>';
        }

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(fiveStarRating)) {
                starsHtml += `<span class="star star--full">★</span>`;
            } else if (showHalfStars && i <= fiveStarRating + 0.5) {
                starsHtml += `<span class="star star--half">
                    <span class="star-half-bg">★</span>
                    <span class="star-half-fill">★</span>
                </span>`;
            } else {
                starsHtml += `<span class="star star--empty">★</span>`;
            }
        }
        return starsHtml;
    }

    /**
     * Генерирует интерактивные звезды для выбора рейтинга
     * @param {number} currentRating - Текущий рейтинг по 10-балльной шкале
     * @returns {string} HTML строка с интерактивными звездами
     */
    static generateInteractiveStarRating(currentRating) {
        const fiveStarRating = currentRating ? currentRating / 2 : 0;
        
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(fiveStarRating)) {
                starsHtml += `<span class="rating-star rating-star--selected" data-value="${i}">★</span>`;
            } else if (i <= fiveStarRating + 0.5) {
                starsHtml += `<span class="rating-star rating-star--half" data-value="${i}">★</span>`;
            } else {
                starsHtml += `<span class="rating-star rating-star--unselected" data-value="${i}">★</span>`;
            }
        }
        return starsHtml;
    }

    /**
     * Конвертирует 5-звездочный рейтинг в 10-балльную шкалу
     * @param {number} fiveStarRating - Рейтинг от 0 до 5
     * @returns {number} Рейтинг от 0 до 10
     */
    static fiveStarToTenScale(fiveStarRating) {
        return fiveStarRating * 2;
    }

    /**
     * Конвертирует 10-балльную шкалу в 5-звездочный рейтинг
     * @param {number} tenScaleRating - Рейтинг от 0 до 10
     * @returns {number} Рейтинг от 0 до 5
     */
    static tenScaleToFiveStar(tenScaleRating) {
        return tenScaleRating / 2;
    }
}
