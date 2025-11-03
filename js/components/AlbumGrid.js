import { RatingUtils } from '../utils/RatingUtils.js';

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
        
        const starsHtml = RatingUtils.generateStarRating(rating, true);
        
        return `
            <li class="recently__item" 
                data-album-id="${albumId}" 
                data-spotify-link="${spotifyLink}"
                data-rating-data='${JSON.stringify(ratingData)}'>
                <div class="recently__cover-container">
                    <img src="${coverUrl}" 
                        alt="${albumName}" 
                        class="recently__cover" 
                        loading="lazy"
                        decoding="async"
                        onerror="this.src='https://via.placeholder.com/150x150/333/666?text=No+Image'"
                        onload="this.classList.add('loaded')">
                    <div class="album-menu">
                        <button class="album-menu__trigger" type="button">
                            <span class="album-menu__dots"></span>
                        </button>
                        <div class="album-menu__dropdown">
                            <button class="album-menu__item album-menu__item--write" data-action="write-review">
                                <span class="album-menu__icon">✍️</span>
                                ${rating ? 'Edit review' : 'Write review'}
                            </button>
                            <button class="album-menu__item album-menu__item--spotify" data-action="go-to-album">
                                <span class="album-menu__icon">🎵</span>
                                Go to album
                            </button>
                        </div>
                    </div>
                </div>
                <div class="recently__info">
                    <h3 class="recently__album">${albumName}</h3>
                    <p class="recently__artist">${artist}</p>
                    <div class="recently__rating">
                        ${starsHtml}
                    </div>
                </div>
            </li>
        `;
    }

    getListenLaterTemplate(album) {
        const coverUrl = this.getCoverUrl(album);
        const albumName = album.album_name || album.albumName || 'Unknown Album';
        const artist = album.artist || 'Unknown Artist';
        const albumId = album.album_id || album.id || 0;
        const spotifyLink = album.spotify_link || '';
            
        return `
            <li class="listen-later__item" data-album-id="${albumId}" data-spotify-link="${spotifyLink}">
                <img src="${coverUrl}" 
                    alt="${albumName}" 
                    class="listen-later__cover" 
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='https://via.placeholder.com/50x50/333/666?text=No+Image'"
                    onload="this.classList.add('loaded')">
                <div class="listen-later__info">
                    <h3 class="listen-later__album">${albumName}</h3>
                    <p class="listen-later__artist">${artist}</p>
                </div>
                <div class="album-menu album-menu--side">
                    <button class="album-menu__trigger" type="button">
                        <span class="album-menu__dots"></span>
                    </button>
                    <div class="album-menu__dropdown">
                        <button class="album-menu__item album-menu__item--write" data-action="write-review">
                            <span class="album-menu__icon">✍️</span>
                            Write review
                        </button>
                        <button class="album-menu__item album-menu__item--remove" data-action="remove-listen-later">
                            <span class="album-menu__icon">❌</span>
                            Remove from Listen Later
                        </button>
                        <button class="album-menu__item album-menu__item--spotify" data-action="go-to-album">
                            <span class="album-menu__icon">🎵</span>
                            Go to album
                        </button>
                    </div>
                </div>
            </li>
        `;
    }

    getCoverUrl(album) {
        return album.coverUrl || 
               album.cover_url || 
               album.cover || 
               `https://via.placeholder.com/150x150/1a1a1a/ffffff?text=${encodeURIComponent(album.album_name || 'Album')}`;
    }
}