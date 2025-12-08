import { logger } from '../utils/Logger.js';

export class Navigation {
    constructor() {
        this.navLinks = document.querySelectorAll('.info__navbar a');
        this.init();
    }
    
    init() {
        const currentPath = window.location.pathname;
        
        this.navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('button--active');
            }
            
            link.addEventListener('click', (event) => {
                if (link.getAttribute('href') === window.location.pathname) {
                    event.preventDefault();
                    logger.debug("Already on this page!");
                }
            });
        });
    }
}