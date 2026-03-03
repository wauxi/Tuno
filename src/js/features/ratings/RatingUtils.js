/**
 * Rating utilities
 */
export class RatingUtils {
    /**
     * Generates star rating HTML for display
     * @param {number} currentRating - Rating on a 10-point scale
     * @param {boolean} showHalfStars - Whether to show half stars
     * @returns {string} HTML string with stars
     */
    static generateStarRating(currentRating, showHalfStars = true) {
        const fiveStarRating = currentRating / 2;
        
        if (fiveStarRating === 0) {
            return '<span class="no-rating">No rating</span>';
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
     * Generates interactive stars for rating selection
     * @param {number} currentRating - Current rating on a 10-point scale
     * @returns {string} HTML string with interactive stars
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
     * Converts a 5-star rating to a 10-point scale
     * @param {number} fiveStarRating - Rating from 0 to 5
     * @returns {number} Rating from 0 to 10
     */
    static fiveStarToTenScale(fiveStarRating) {
        return fiveStarRating * 2;
    }

    /**
     * Converts a 10-point scale to a 5-star rating
     * @param {number} tenScaleRating - Rating from 0 to 10
     * @returns {number} Rating from 0 to 5
     */
    static tenScaleToFiveStar(tenScaleRating) {
        return tenScaleRating / 2;
    }
}
