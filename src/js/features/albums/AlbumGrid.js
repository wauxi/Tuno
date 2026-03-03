import { RatingUtils } from '../ratings/RatingUtils.js';
import { IMAGES } from '../../config/constants.js';
import { escapeHtml } from '../../shared/utils/sanitize.js';

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
            if (this.dataType === 'favoriteAlbums') {
                this.container.innerHTML = '';
                return;
            }
            this.container.innerHTML = `
                <li class="empty-state">
                    <div class="empty-state-content">
                        <span class="empty-state-icon">🎵</span>
                        <p class="empty-state-text">
                            ${this.dataType === 'recentActivity' 
                                ? 'No recent listens' 
                                : 'Listen later list is empty'}
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
            } else if (this.template === 'favs-item') {
                html += this.getFavsTemplate(item);
            } else {
                html += this.getAlbumTemplate(item);
            }
        }
        
        this.container.innerHTML = html;
    }

    getFavsTemplate(album) {
        const coverUrl = this.getCoverUrl(album);
        const albumName = escapeHtml(album.album_name || album.albumName || 'Unknown Album');
        const artist = escapeHtml(album.artist || 'Unknown Artist');
        const albumId = album.album_id || album.id || 0;
        const spotifyLink = escapeHtml(album.spotify_link || '');
        const placeholderUrl = IMAGES.PLACEHOLDER;

        return `
            <li class="favs__item"
                data-album-id="${albumId}"
                data-spotify-link="${spotifyLink}">
                <div class="favs__cover-container">
                    <img src="${coverUrl}"
                        alt="${albumName}"
                        class="favs__cover"
                        loading="lazy"
                        decoding="async"
                        onerror="this.src='${placeholderUrl}'"
                        onload="this.classList.add('loaded')">
                    <div class="album-menu">
                        <button class="album-menu__trigger" type="button">
                            <span class="album-menu__dots"></span>
                        </button>
                        <div class="album-menu__dropdown">
                            <button class="album-menu__item album-menu__item--write" data-action="write-review">
                                <span class="album-menu__icon">✍️</span>
                                Write review
                            </button>
                            <button class="album-menu__item album-menu__item--spotify" data-action="go-to-album">
                                <span class="album-menu__icon">🎵</span>
                                Go to album
                            </button>
                        </div>
                    </div>
                </div>
                <div class="favs__info">
                    <h3 class="favs__album">${albumName}</h3>
                    <p class="favs__artist">${artist}</p>
                </div>
            </li>
        `;
    }

    getAlbumTemplate(album) {
        return this.getTemplate(album, {
            itemClass: 'recently__item',
            coverClass: 'recently__cover',
            layout: 'card',
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
            layout: 'row',
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
            layout = 'card',
            coverSize = '150x150',
            menuPosition = '',
            menuActions = []
        } = options;
        
        const coverUrl = this.getCoverUrl(album);
        const albumName = escapeHtml(album.album_name || album.albumName || 'Unknown Album');
        const artist = escapeHtml(album.artist || 'Unknown Artist');
        const rating = album.rating || 0;
        const albumId = album.album_id || album.id || 0;
        const spotifyLink = escapeHtml(album.spotify_link || '');
        
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
        
        const imgHtml = `<img src="${coverUrl}" 
            alt="${albumName}" 
            class="${coverClass}" 
            loading="lazy"
            decoding="async"
            onerror="this.src='${placeholderUrl}'"
            onload="this.classList.add('loaded')">`;
        
        const menuBlockHtml = `<div class="${menuClass}">
            <button class="album-menu__trigger" type="button">
                <span class="album-menu__dots"></span>
            </button>
            <div class="album-menu__dropdown">
                ${menuHtml}
            </div>
        </div>`;
        
        const contentHtml = layout === 'card'
            ? this._renderCardLayout(imgHtml, menuBlockHtml, albumName, artist, starsHtml)
            : this._renderRowLayout(imgHtml, menuBlockHtml, albumName, artist);
        
        return `
            <li class="${itemClass}" 
                data-album-id="${albumId}" 
                data-spotify-link="${spotifyLink}"
                ${rating ? `data-rating-data='${JSON.stringify(ratingData)}'` : ''}>
                ${contentHtml}
            </li>
        `;
    }

    _renderCardLayout(imgHtml, menuHtml, albumName, artist, starsHtml) {
        return `
            <div class="recently__cover-container">
                ${imgHtml}
                ${menuHtml}
            </div>
            <div class="recently__info">
                <h3 class="recently__album">${albumName}</h3>
                <p class="recently__artist">${artist}</p>
                ${starsHtml ? `<div class="recently__rating">${starsHtml}</div>` : ''}
            </div>`;
    }

    _renderRowLayout(imgHtml, menuHtml, albumName, artist) {
        return `
            ${imgHtml}
            <div class="listen-later__info">
                <h3 class="listen-later__album">${albumName}</h3>
                <p class="listen-later__artist">${artist}</p>
            </div>
            ${menuHtml}`;
    }

    getCoverUrl(album) {
        return album.coverUrl || 
               album.cover_url || 
               album.cover || 
               IMAGES.FALLBACK;
    }
}