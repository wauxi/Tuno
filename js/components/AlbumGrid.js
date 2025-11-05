import { RatingUtils } from '../utils/RatingUtils.js';
import { IMAGES } from '../config/constants.js';

export class AlbumGrid {
    constructor({ container, dataType, dataService, template = 'album-item' }) {
        this.container = container;
        this.dataType = dataType;
        this.dataService = dataService;
        this.template = template;
    }

    render() {
        if (!this.container) {
            return;
        }

        const data = this.dataService.data[this.dataType];
        
        if (!data) {
            return;
        }

        if (!Array.isArray(data) || data.length === 0) {
            this.container.innerHTML = `
                <li class="empty-state">
                    <div class="empty-state-content">
                        <span class="empty-state-icon">🎵</span>
                        <p class="empty-state-text">
                            ${this.dataType === 'recentActivity' 
                                ? 'Нет недавних прослушиваний' 
                                : 'Список для прослушивания пуст'}
                        </p>
                    </div>
                </li>
            `;
            return;
        }

        let html = '';
        
        for (const item of data) {
            if (this.template === 'listen-later-item') {
                html += this.getListenLaterTemplate(item);
            } else {
                html += this.getAlbumTemplate(item);
            }
        }
        
        this.container.innerHTML = html;
    }

    getAlbumTemplate(album) {
        return this.getTemplate(album, {
            itemClass: 'recently__item',
            coverClass: 'recently__cover',
            menuActions: [
                { action: 'write-review', icon: '✍️', label: album.rating ? 'Edit review' : 'Write review', class: 'write' },
                { action: 'go-to-album', icon: '🎵', label: 'Go to album', class: 'spotify' }
            ]
        });
    }

    getListenLaterTemplate(album) {
        return this.getTemplate(album, {
            itemClass: 'listen-later__item',
            coverClass: 'listen-later__cover',
            coverSize: '50x50',
            menuPosition: 'side',
            menuActions: [
                { action: 'write-review', icon: '✍️', label: 'Write review', class: 'write' },
                { action: 'remove-listen-later', icon: '❌', label: 'Remove from Listen Later', class: 'remove' },
                { action: 'go-to-album', icon: '🎵', label: 'Go to album', class: 'spotify' }
            ]
        });
    }

    getTemplate(album, options) {
        const {
            itemClass,
            coverClass,
            coverSize = '150x150',
            menuPosition = '',
            menuActions = []
        } = options;
        
        const coverUrl = this.getCoverUrl(album);
        const albumName = album.album_name || album.albumName || 'Unknown Album';
        const artist = album.artist || 'Unknown Artist';
        const rating = album.rating || 0;
        const albumId = album.album_id || album.id || 0;
        const spotifyLink = album.spotify_link || '';
        
        const ratingData = {
            rating: album.rating || 0,
            rating_id: album.rating_id || null,
            album_id: albumId
        };
        
        const starsHtml = rating ? RatingUtils.generateStarRating(rating, true) : '';
        const placeholderUrl = IMAGES.PLACEHOLDER;
        
        const menuClass = menuPosition ? `album-menu album-menu--${menuPosition}` : 'album-menu';
        const menuHtml = menuActions.map(({ action, icon, label, class: itemClass }) => 
            `<button class="album-menu__item album-menu__item--${itemClass}" data-action="${action}">
                <span class="album-menu__icon">${icon}</span>
                ${label}
            </button>`
        ).join('');
        
        return `
            <li class="${itemClass}" 
                data-album-id="${albumId}" 
                data-spotify-link="${spotifyLink}"
                ${rating ? `data-rating-data='${JSON.stringify(ratingData)}'` : ''}>
                ${itemClass === 'recently__item' ? `
                <div class="recently__cover-container">
                    <img src="${coverUrl}" 
                        alt="${albumName}" 
                        class="${coverClass}" 
                        loading="lazy"
                        decoding="async"
                        onerror="this.src='${placeholderUrl}'"
                        onload="this.classList.add('loaded')">
                    <div class="${menuClass}">
                        <button class="album-menu__trigger" type="button">
                            <span class="album-menu__dots"></span>
                        </button>
                        <div class="album-menu__dropdown">
                            ${menuHtml}
                        </div>
                    </div>
                </div>
                <div class="recently__info">
                    <h3 class="recently__album">${albumName}</h3>
                    <p class="recently__artist">${artist}</p>
                    ${starsHtml ? `<div class="recently__rating">${starsHtml}</div>` : ''}
                </div>
                ` : `
                <img src="${coverUrl}" 
                    alt="${albumName}" 
                    class="${coverClass}" 
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='${placeholderUrl}'"
                    onload="this.classList.add('loaded')">
                <div class="listen-later__info">
                    <h3 class="listen-later__album">${albumName}</h3>
                    <p class="listen-later__artist">${artist}</p>
                </div>
                <div class="${menuClass}">
                    <button class="album-menu__trigger" type="button">
                        <span class="album-menu__dots"></span>
                    </button>
                    <div class="album-menu__dropdown">
                        ${menuHtml}
                    </div>
                </div>
                `}
            </li>
        `;
    }

    getCoverUrl(album) {
        return album.coverUrl || 
               album.cover_url || 
               album.cover || 
               IMAGES.FALLBACK;
    }
}