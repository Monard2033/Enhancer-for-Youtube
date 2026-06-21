(function () {
    'use strict';

    // Trusted Types policy (bypass YouTube's CSP that blocks innerHTML)
    const TT = (function() {
        if (window.trustedTypes && trustedTypes.createPolicy) {
            try {
                return trustedTypes.createPolicy('efyt-html', {
                    createHTML: (s) => s
                });
            } catch (e) {
                // Policy name collision - use default
                return { createHTML: (s) => s };
            }
        }
        return { createHTML: (s) => s };
    })();

    // CONFIG - toate constantele centralizate
    const CONFIG = {
        masthead: {
            minCenter: 200,
            maxCenter: 550,
            breakpoint: 1035,
            growthFactor: 0.3955,
        },
        watch: {
            topBarHeightPx: 56,
            defaultMaxWidthPrimary: 77,
            defaultMaxWidthColumns: 98,
            defaultMaxWidthSecondary: 23,
            uhd: {
                minWidth: 2560, minHeight: 1440,
                maxWidth: 3840, maxHeight: 2160,
                maxWidthPrimary: 3300,
                maxWidthColumns: 2800
            },
            heightChangeThreshold: 0.4
        },
        miniPlayer: {
            width: 560,
            height: 315,
            top: 55,
            positionFactorUHD: 0.769,
            positionFactorDefault: 0.8633,
            positionMinUHD: 2560,
            positionMaxUHD: 3840,
            positionMinDefault: 410,
            positionMaxDefault: 1220,
            scrollThreshold: 1000
        },
        selectors: {
            mastheadCenter: '#center.ytd-masthead',
            mastheadContainer: '#container.ytd-masthead',
            watchPrimary: '#primary',
            watchColumns: '#columns',
            shortsProgressBar: '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div',
            shortsNavDown: '#navigation-button-down > ytd-button-renderer > yt-button-shape > button',
            gridRenderer: '#primary > ytd-rich-grid-renderer'
        }
    };

    // Core - state, utils, cache cu optimizări
    const Core = (function () {
        const state = {
            isSkippingEnabled: true,

            lastShortsId: null,
            observer: null,
            observerShortsId: null,
            isScrollButtonCreated: false,
            lastProcessedShortsId: null,
            lastHeightVh: '90',
            lastScrollY: 0,
            lastWidth: window.innerWidth,
            isMiniPlayerActive: false,
            lastMiniLeft: 0,
            lastUrl: null,
            lastKeyEvent: 0,
            debounceDelay: 200,
            isClicked: false
        };

        const cache = new Map();
        const playerElementsCache = new Map();

        function throttle(fn, delay) {
            let last = 0;
            return (...args) => {
                const now = Date.now();
                if (now - last >= delay) {
                    last = now;
                    fn(...args);
                }
            };
        }

        function debounce(fn, delay) {
            let id;
            return (...args) => {
                clearTimeout(id);
                id = setTimeout(() => fn(...args), delay);
            };
        }

        function getElement(selector) {
            if (!cache.has(selector)) {
                const el = document.querySelector(selector);
                if (el) cache.set(selector, el);
                return el;
            }
            const cached = cache.get(selector);
            return cached && cached.isConnected ? cached : null;
        }

        function waitForElement(selector, options = {}) {
            const { timeout = 15000, interval = 100 } = options;
            return new Promise((resolve, reject) => {
                const el = getElement(selector);
                if (el) return resolve(el);
                const start = Date.now();
                const check = () => {
                    const el = getElement(selector);
                    if (el) resolve(el);
                    else if (Date.now() - start < timeout) setTimeout(check, interval);
                    else reject(new Error(`Timeout for ${selector}`));
                };
                check();
            });
        }

        async function waitForAllDOMElements(selectors, options = {}) {
            const { timeout = 15000, maxRetries = 3 } = options;
            const results = await Promise.all(selectors.map((selector, index) => waitForElement(selector, { timeout }).then(element => ({
                selector,
                element,
                index
            })).catch(error => {
                if (maxRetries > 0) {
                    return waitForAllDOMElements([selector], { timeout, maxRetries: maxRetries - 1 });
                }
                throw error;
            })
            ));
            return results.reduce((acc, r) => {
                acc[selectors[r.index]] = { element: r.element };
                return acc;
            }, {});
        }

        function checkIfWatchPage() {
            return window.location.href.includes('youtube.com/watch');
        }

        function checkIfShortsPage() {
            return window.location.href.includes('youtube.com/shorts');
        }

        function getShortsId() {
            const match = window.location.href.match(/youtube\.com\/shorts\/([^?]+)/);
            return match ? match[1] : null;
        }

        function pauseVideo() {
            const video = document.querySelector('video');
            if (video && !video.paused) video.pause();
        }

        function safeInjectCSS(css, id) {
            let style = document.getElementById(id);
            if (!style) {
                style = document.createElement('style');
                style.id = id;
                document.head.appendChild(style);
            }
            style.textContent = css;
        }

        function clearPlayerCache() {
            playerElementsCache.clear();
        }

        return {
            state,
            cache,
            playerElementsCache,
            utils: {
                throttle,
                debounce,
                getElement,
                waitForElement,
                waitForAllDOMElements,
                checkIfWatchPage,
                checkIfShortsPage,
                getShortsId,
                pauseVideo,
                safeInjectCSS,
                clearPlayerCache
            }
        };
    })();

    // Styles - CSS base injectat o dată
    (function injectBaseStyles() {
        const styleElement = document.createElement('style');
        document.head.appendChild(styleElement);
        styleElement.textContent = `
            :root {
                --dark-bt: rgb(200 200 200 / 15%);
                --dark-bt-hover: rgba(255 255 255 /25%);
                --dark-bt-tp: rgb(0 0 0 / 1%);
                --light-bt: rgb(0 0 0 / 7%);
                --light-bt-tp: rgb(255 255 255 / 1%);
                --light-bt-hover: rgb(0 0 0 / 15%);
                --efyt-mini-player-aspect-ratio: 1.8;
                --efyt-mini-player-height: 315px;
                --efyt-mini-player-width: 560px;
                --efyt-mini-player-center-left: calc(100vw / 2 - 280px);
                --efyt-mini-player-caption-window-left: calc(var(--efyt-mini-player-width) * 1 / 10);
                --efyt-mini-player-caption-window-width: calc(var(--efyt-mini-player-width) * 8 / 10);
                --efyt-mini-player-short-width: calc(var(--efyt-mini-player-height) * var(--efyt-mini-player-aspect-ratio));
                --efyt-mini-player-short-left: calc(calc(var(--efyt-mini-player-width) - calc(var(--efyt-mini-player-height) * var(--efyt-mini-player-aspect-ratio))) / 2);
                --efyt-mini-width: 560px;
                --efyt-mini-height: 315px;
                --efyt-mini-top: 55px;
                --efyt-mini-left: 410px;
                --efyt-mini-radius: 15px;
            }
            #start.ytd-masthead, #end.ytd-masthead {
                height: 50px;
                border-radius: 30px;
                display: flex;
                position: static;
                margin: var(--efyt-masthead-margin, 0 10%);
                background-color: var(--light-bt);
            }
            .ytSearchboxComponentHost {
                height: 53px;
                margin: 0 12px 0 0;
            }
            .ytSearchboxComponentInputBox {
                margin: 0 0 0 0;
                box-shadow: none;
                height: 50px;
                background: transparent;
                background-color: var(--light-bt);
                display: flex;
                border: none;
                justify-content: space-around;
            }
            .ytSearchboxComponentSearchButtonDark {
                border: none;
            }
            #center.ytd-masthead {
                margin: auto;
                flex: 0 0 550px;
            }
            .ytp-delhi-modern.ytp-big-mode:not(.ytp-xsmall-width-mode) .ytp-chrome-bottom {
                height: 80px !important;
            }
            .ytp-big-mode .ytp-progress-bar-container {
                bottom: 65.5px !important;
            }

            ytd-rich-grid-renderer {
                --ytd-rich-grid-items-per-row: var(--efyt-grid-columns, 5) !important;
            }
            #container.ytd-masthead {
                box-shadow: none;
                background: transparent;
                display: flex;
                opacity: 1;
                z-index: 1000;
                justify-content: space-evenly;
            }

            ytd-watch-flexy[flexy] #secondary.ytd-watch-flexy {
                min-width: 450px;
                padding-right: 0px;
            }
            .ytSearchboxComponentSearchButton {
                background: transparent;
                background-color: var(--light-bt) !important;
                height: 52px;
            }
            #background.ytd-masthead {
                position: fixed;
                opacity: 0;
                visibility: visible;
                background: transparent;
                height: 56px;
                z-index: -1;
            }
            #search-form.ytd-searchbox {
                height: 50px;
            }
            ytd-searchbox.ytd-masthead {
                margin: 0;
                padding: 0 10px;
            }
            #sections.ytd-guide-renderer {
                position: relative;
            }
            #sections.ytd-guide-renderer>*.ytd-guide-renderer:first-child {
                padding: 0px;
            }
            #voice-search-button.ytd-masthead {
                margin-left: 0;
                background: transparent;
                background-color: var(--light-bt) !important;
            }
            #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
                opacity: 0.6;
            }
            .ytSpecIconShapeHost {
                color: #c00;
            }
            ytd-feed-filter-chip-bar-renderer {
                height: 0;
            }
            #frosted-glass.with-chipbar.ytd-app {
                height: 112px !important;
                backdrop-filter: blur(2px) !important;
            }
            .yt-core-attributed-string--white-space-no-wrap {
                color: #c00;
            }
            .yt-spec-button-shape-next--mono.yt-spec-button-shape-next--filled {
                background: none;
                color: black;
            }
            yt-chip-cloud-chip-renderer[chip-style=STYLE_DEFAULT][selected] #chip-container.yt-chip-cloud-chip-renderer {
                background-color: var(--yt-spec-badge-chip-background);
                color: var(--yt-spec-text-primary);
            }
            .ytSpecTouchFeedbackShapeHost:where([class="ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse"]) {
            }
            body.efyt-mini-player.efyt-short #movie_player:not(.ytp-fullscreen) video.html5-main-video,
            body.efyt-wide-player.efyt-mini-player.efyt-short ytd-watch-flexy[theater] #movie_player:not(.ytp-fullscreen) video.html5-main-video {
                left: var(--efyt-mini-player-short-left);
                aspect-ratio: auto;
                object-fit: contain;
            }
            body.efyt-mini-player #movie_player:not(.ytp-fullscreen) .ytp-caption-window-container > div.caption-window {
                left: var(--efyt-mini-player-caption-window-left);
            }
            body.efyt-mini-player.efyt-short #movie_player:not(.ytp-fullscreen) {
                height: var(--efyt-mini-player-height);
                aspect-ratio: auto;
            }
            body.efyt-mini-player ytd-player #movie_player:not(.ytp-fullscreen) {
                position: fixed !important;
                z-index: 5000 !important;
                background: rgb(0, 0, 0) !important;
            }
            .efyt-mini-active #movie_player {
                position: fixed !important;
                z-index: 5000 !important;
                width: var(--efyt-mini-width) !important;
                height: var(--efyt-mini-height) !important;
                top: var(--efyt-mini-top) !important;
                left: var(--efyt-mini-left) !important;
                border-radius: var(--efyt-mini-radius) !important;
                background: rgb(0, 0, 0) !important;
            }
            .efyt-mini-active .html5-main-video {
                width: var(--efyt-mini-width) !important;
                height: var(--efyt-mini-height) !important;
                left: 0 !important;
                border-radius: var(--efyt-mini-radius) !important;
                object-fit: contain !important;
            }
            .efyt-mini-active .ytp-chrome-bottom {
                left: 10px !important;
                width: calc(100% - 20px) !important;
                max-width: 530px !important;
            }
            @media (prefers-color-scheme: dark) {
                #start.ytd-masthead,
                .ytSearchboxComponentInputBox,
                #container.ytd-searchbox,
                #end.ytd-masthead,
                .scroll-top-btn,
                .skip-toggle-btn,
                .ytSearchboxComponentSearchButton,
                .ytSpecTouchFeedbackShapeHost:where([class="ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse"]),
                #voice-search-button.ytd-masthead {
                    background-color: var(--dark-bt) !important;
                }
                #content > yt-lockup-view-model > div > yt-touch-feedback-shape > div {
                    background-color: var(--dark-bt-tp);
                }
                .yt-spec-button-shape-next__button-text-content {
                    color: red;
                }
                #start.ytd-masthead:hover,
                .ytSearchboxComponentInputBox:hover,
                #container.ytd-searchbox:hover,
                #end.ytd-masthead:hover,
                .scroll-top-btn:hover,
                .skip-toggle-btn:hover,
                .ytSearchboxComponentSearchButton:hover,
                .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text:hover,
                #voice-search-button.ytd-masthead:hover {
                    background-color: var(--dark-bt-hover) !important;
                }
            }
            #scroll-top-container {
                position: fixed;
                bottom: 20px;
                width: 55px;
                height: 55px;
                transition: opacity 0.3s ease;
                z-index: 1000;
                opacity: 0;
            }
            .scroll-top-btn {
                pointer-events: all;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                border: none;
                justify-content: center;
                align-items: center;
                background-color: var(--light-bt);
            }
            .scroll-top-btn:hover {
                background-color: var(--light-bt-hover);
            }
            .scroll-up-btn {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                width: 100%;
            }
            .scroll-tooltip {
            display: flex;
                position: absolute;
                left: -100px;
                top: 0;
                height: 25px;
                transform: translateY(8px);
                background-color: #707070;
                color: #ffffff;
                padding: 6px 8px;
                border-radius: 4px;
                font-family: "Roboto", "Arial", sans-serif;
                font-size: 1.2rem;
                line-height: 1.8rem;
                font-weight: 400;
                align-items: center;
                z-index: 1001;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease-in-out;
            }
            .scroll-top-btn:hover+.scroll-tooltip,
            .scroll-tooltip:hover {
            opacity: 1;
                visibility: visible;
                }
            .skip-toggle-btn {
                pointer-events: all;
                width: 56px;
                height: 56px;
                margin: 0;
                border-radius: 50%;
                cursor: pointer;
                border: none;
                transition: background-color 0.2s ease, opacity 4s ease;
                opacity: 1;
                justify-self: center;
                align-items: center;
            }
            .skip-toggle-btn:hover {
                background-color: var(--light-bt-hover) !important;
            }
            .toggle-icon {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                width: 100%;
                color: #c00;
                font-size: 13px;
                font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
                'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
                font-weight: 600;
            }
            .skip-tooltip {
                display: flex;
                position: absolute;
                left: -150px;
                top: 0;
                height: 25px;
                transform: translateY(8px);
                background-color: #707070;
                color: #ffffff;
                padding: 6px 8px;
                border-radius: 4px;
                font-family: "Roboto", "Arial", sans-serif;
                font-size: 1.2rem;
                line-height: 1.8rem;
                font-weight: 400;
                align-items: center;
                z-index: 1001;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease-in-out;
            }
            .skip-toggle-btn:hover+.skip-tooltip,
            .skip-tooltip:hover {
                opacity: 1;
                visibility: visible;
            }
        /* ===== Settings Panel ===== */
            #efyt-gear-btn {
                width: 40px !important;
                height: 40px !important;
                min-width: 40px !important;
                border-radius: 50% !important;
                border: none !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: transparent !important;
                transition: background 0.2s;
                margin: auto 4px !important;
                font-size: 20px;
                color: #c00;
                opacity: 0.85;
                padding: 0;
                position: relative;
                outline: none;
                line-height: 1;
                box-sizing: border-box;
            }
            #efyt-gear-btn svg {
                width: 20px;
                height: 20px;
                fill: #c00;
            }
            #efyt-gear-btn:hover {
                background: var(--light-bt-hover) !important;
                opacity: 1;
            }
            @media (prefers-color-scheme: dark) {
                #efyt-gear-btn:hover {
                    background: var(--dark-bt-hover);
                }
            }
            #efyt-settings-panel {
                position: fixed;
                top: 60px;
                right: 80px;
                width: 320px;
                max-height: 80vh;
                overflow-y: auto;
                background: var(--yt-spec-base-background, #fff);
                border: 1px solid var(--yt-spec-text-disabled, #ccc);
                border-radius: 12px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.2);
                z-index: 9999;
                padding: 16px 20px;
                font-family: 'Roboto', Arial, sans-serif;
                font-size: 14px;
                color: var(--yt-spec-text-primary, #0f0f0f);
                display: none;
            }
            #efyt-settings-panel.efyt-open {
                display: block;
            }
            #efyt-settings-panel h3 {
                margin: 0 0 16px 0;
                font-size: 16px;
                font-weight: 500;
                border-bottom: 1px solid var(--yt-spec-text-disabled, #ddd);
                padding-bottom: 10px;
            }
            .efyt-setting-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--yt-spec-text-disabled, #eee);
            }
            .efyt-setting-row:last-of-type {
                border-bottom: none;
            }
            .efyt-setting-label {
                font-size: 14px;
                font-weight: 400;
            }
            .efyt-setting-desc {
                font-size: 12px;
                color: var(--yt-spec-text-secondary, #666);
                margin-top: 2px;
            }
            .efyt-setting-row select {
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid var(--yt-spec-text-disabled, #ccc);
                background: var(--yt-spec-base-background, #fff);
                color: var(--yt-spec-text-primary, #0f0f0f);
                font-size: 13px;
            }
            .efyt-setting-row input[type="number"] {
                width: 70px;
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid var(--yt-spec-text-disabled, #ccc);
                background: var(--yt-spec-base-background, #fff);
                color: var(--yt-spec-text-primary, #0f0f0f);
                font-size: 13px;
                text-align: center;
            }
            .efyt-toggle-track {
                width: 36px;
                height: 20px;
                border-radius: 10px;
                background: var(--yt-spec-text-disabled, #ccc);
                position: relative;
                cursor: pointer;
                transition: background 0.2s;
                flex-shrink: 0;
            }
            .efyt-toggle-track.efyt-on {
                background: #c00;
            }
            .efyt-toggle-knob {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: white;
                position: absolute;
                top: 2px;
                left: 2px;
                transition: left 0.2s;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            .efyt-toggle-track.efyt-on .efyt-toggle-knob {
                left: 18px;
            }
            #efyt-save-btn {
                display: block;
                width: 100%;
                margin-top: 16px;
                padding: 10px;
                border: none;
                border-radius: 8px;
                background: #c00;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
            }
            #efyt-save-btn:hover {
                background: #a00;
            }

            /* Fixed masthead (absolute = scrolls away) */
            html[data-efyt-masthead="fixed"] #masthead-container.ytd-app {
                position: absolute !important;
            }
            html[data-efyt-masthead="fixed"][data-efyt-scrolled="true"] #scroll-container.ytd-feed-filter-chip-bar-renderer {
                transform: translateY(-56px);
            }
            html[data-efyt-masthead="fixed"][data-efyt-scrolled="true"] #frosted-glass.with-chipbar.ytd-app {
                top: -56px !important;
            }

            /* Data-attribute controlled red borders */
            html[data-efyt-borders="on"] #start.ytd-masthead,
            html[data-efyt-borders="on"] #end.ytd-masthead,
            html[data-efyt-borders="on"] .ytSearchboxComponentInputBox,
            html[data-efyt-borders="on"] .ytSearchboxComponentSearchButton,
            html[data-efyt-borders="on"] .ytSpecTouchFeedbackShapeHost:where([class="ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse"]),
            html[data-efyt-borders="on"] .scroll-top-btn {
                border: 1px dotted red !important;
            }
        `;
    })();

    const Layout = (function () {
        const { utils, state } = Core;
        let mastheadCacheInitialized = false;

        function calculateFlexBasis(w) {
            let basis = CONFIG.masthead.minCenter + (w - CONFIG.masthead.breakpoint) * CONFIG.masthead.growthFactor;
            return Math.max(CONFIG.masthead.minCenter, Math.min(CONFIG.masthead.maxCenter, basis));
        }

        function initMastheadCache() {
            if (mastheadCacheInitialized) return;
            mastheadCacheInitialized = true;
            utils.waitForElement(CONFIG.selectors.mastheadCenter).catch(() => { });
            utils.waitForElement(CONFIG.selectors.mastheadContainer).catch(() => { });
        }

        function updateMasthead() {
            const center = utils.getElement(CONFIG.selectors.mastheadCenter);
            const container = utils.getElement(CONFIG.selectors.mastheadContainer);
            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
            if (!center || !container) return;
            container.style.opacity = scrollPosition <= 25 ? '1' : '0.6';
            center.style.flex = `0 0 ${calculateFlexBasis(window.innerWidth)}px`;
        }

        function calculateWatchHeight() {
            const vh = window.innerHeight;
            const topVh = (CONFIG.watch.topBarHeightPx / vh) * 100;
            const availVh = 100 - topVh;
            const aspectVh = (window.innerWidth / vh) * (9 / 16) * 100;
            return Math.min(availVh, aspectVh).toFixed(2);
        }

        function getWatchMaxWidths() {
            let primW = CONFIG.watch.defaultMaxWidthPrimary;
            let colW = CONFIG.watch.defaultMaxWidthColumns;
            let secW = CONFIG.watch.defaultMaxWidthSecondary;
            const sw = window.screen.width, sh = window.screen.height;
            if (sw >= CONFIG.watch.uhd.minWidth && sw <= CONFIG.watch.uhd.maxWidth &&
                sh >= CONFIG.watch.uhd.minHeight && sh <= CONFIG.watch.uhd.maxHeight) {
                primW = CONFIG.watch.uhd.maxWidthPrimary;
                colW = CONFIG.watch.uhd.maxWidthColumns;
                secW = CONFIG.watch.defaultMaxWidthSecondary;
            }
            return { primW, colW };
        }

        function updateWatchStyles() {
            if (!utils.checkIfWatchPage()) return;

            const newHeight = calculateWatchHeight();
            if (Math.abs(parseFloat(newHeight) - parseFloat(state.lastHeightVh)) <= CONFIG.watch.heightChangeThreshold) return;
            state.lastHeightVh = newHeight;

            const { primW, colW, secW } = getWatchMaxWidths();

            const css = `
                #primary.ytd-watch-flexy {
                    min-width: ${primW}% !important;
                    margin-left: 10px !important;
                    margin-top: 12px !important;
                }
                #columns.ytd-watch-flexy {
                    max-width: ${colW}% !important;
                }
                #secondary.ytd-watch-flexy {
                  max-width: ${secW}% !important;
                 }
                ytd-watch-flexy[full-bleed-player][respect-aspect-ratio]:not([fullscreen]) #full-bleed-container.ytd-watch-flexy,
                ytd-watch-flexy[full-bleed-player] #full-bleed-container.ytd-watch-flexy {
                    z-index: 1200 !important;
                    height: ${newHeight}vh;
                    max-height: ${newHeight}vh;
                }
                .html5-video-player .video-stream {
                    height: ${newHeight}vh;
                }
                .ytp-fit-cover-video .html5-main-video {
                    object-fit: contain !important;
                }
                .ytp-delhi-modern .ytp-heat-map-container {
                    left: 5px !important;
                }
                .ytp-progress-bar {
                    left: 5px !important;
                }
                ytd-watch-flexy[full-bleed-player] #player-container.ytd-watch-flexy,
                ytd-watch-flexy[full-bleed-player] #player.ytd-watch-flexy {
                    max-height: ${newHeight}vh !important;
                    height: ${newHeight}vh !important;
                }
            `;
            utils.safeInjectCSS(css, 'efyt-watch-styles');
        }

        return { initMastheadCache, updateMasthead, updateWatchStyles };
    })();

    const Shorts = (function () {
        const { state, utils } = Core;

        function createShortsSkipBtn() {
            if (!utils.checkIfShortsPage()) return;
            let autoskipContainer = document.getElementById('shorts-autoskip');
            if (!autoskipContainer) {
            const autoskipContainer = document.createElement('div');
            autoskipContainer.className = 'navigation-button style-scope ytd-shorts';
            autoskipContainer.id = 'shorts-autoskip';

            const toggleButton = document.createElement('button');
            toggleButton.id = 'shorts-skip-toggle';
            toggleButton.className = 'skip-toggle-btn';

            const touchFeedbackShape = document.createElement('div');
            touchFeedbackShape.className = 'ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse';
            toggleButton.appendChild(touchFeedbackShape);

            const icon = document.createElement('span');
            icon.className = 'toggle-icon';
            icon.textContent = 'SKIP';
            toggleButton.appendChild(icon);

            const tooltip = document.createElement('div');
            tooltip.className = 'skip-tooltip';
            tooltip.textContent = 'Toggle Video Skipping';
            tooltip.setAttribute('role', 'tooltip');
            tooltip.setAttribute('aria-label', 'Toggle Video Skipping');

            autoskipContainer.appendChild(toggleButton);
            autoskipContainer.appendChild(tooltip);


            utils.waitForElement('.navigation-container.style-scope.ytd-shorts')
                .then(navigationContainer => {
                    return utils.waitForElement('#navigation-button-up', { timeout: 10000 });
                })
                .then(navigationButtonUp => {
                    const navigationContainer = navigationButtonUp.closest('.navigation-container.style-scope.ytd-shorts');
                    if (navigationContainer) {
                        navigationContainer.insertBefore(autoskipContainer, navigationButtonUp);
                    }

                    toggleButton.addEventListener('click', () => {
                        state.isSkippingEnabled = !state.isSkippingEnabled;
                        icon.textContent = state.isSkippingEnabled ? 'SKIP' : 'NO SKIP';

                        if (state.isSkippingEnabled && state.observer) {
                            const progressBarElement = document.querySelector(CONFIG.selectors.shortsProgressBar);
                            if (progressBarElement) {
                                state.observer.observe(progressBarElement, {
                                    attributes: true,
                                    attributeFilter: ['aria-valuetext'],
                                });
                            }
                        } else if (!state.isSkippingEnabled && state.observer) {
                            state.observer.disconnect();
                        }
                    });
                })
            }
        }



        function skippingShortsMechanism() {
            if (!utils.checkIfShortsPage()) return;
            const currentShortsId = utils.getShortsId();

            if (currentShortsId === state.observerShortsId && state.observer) {
                return;
            }

            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }

            state.isClicked = false;
            state.lastProcessedShortsId = currentShortsId;

            setTimeout(() => {
                const progressBar = document.querySelector(CONFIG.selectors.shortsProgressBar);
                if (progressBar) {
                    setupObserver(progressBar);
                } else {
                    setTimeout(() => {
                        const retryBar = document.querySelector(CONFIG.selectors.shortsProgressBar);
                        if (retryBar) setupObserver(retryBar);
                    }, 1000);
                }
            }, 500);

            function setupObserver(progressBarElement) {
                let maxWidth = 0;
                let previousWidth = 0;

                state.observer = new MutationObserver(() => {
                    if (!state.isSkippingEnabled) return;

                    const ariaValueText = progressBarElement.getAttribute('aria-valuetext');
                    if (!ariaValueText) return;

                    const widthNumber = parseFloat(ariaValueText.replace('%', ''));

                    if (widthNumber >= maxWidth) {
                        maxWidth = widthNumber;
                        previousWidth = widthNumber;
                    } else if (!state.isClicked && (widthNumber === 0 || widthNumber === 1) && previousWidth >= 97) {
                        // Final de video → skip la următorul shorts
                        utils.pauseVideo();
                        const navDown = document.querySelector(CONFIG.selectors.shortsNavDown);
                        if (navDown) navDown.click();
                        state.isClicked = true;
                        // Observerul moare natural când elementul vechi e eliminat din DOM
                        maxWidth = 0;
                        previousWidth = 0;
                    } else {
                        previousWidth = widthNumber;
                    }
                });

                state.observer.observe(progressBarElement, {
                    attributes: true,
                    attributeFilter: ['aria-valuetext'],
                });
                state.observerShortsId = currentShortsId;
            }
        }

        function handleKeyEvent() {
            // Eliminat — observerul se resetează doar la URL change (Navigation.handleChange) și final de video
        }

        function removeToggleButton() {
            const toggleButton = document.querySelector('#shorts-skip-toggle');
            if (toggleButton && toggleButton.parentNode) {
                toggleButton.dispatchEvent(new Event('remove'));
                toggleButton.parentNode.removeChild(toggleButton);
            }
        }

        function cleanup() {
            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }
            removeToggleButton();
        }

        return { createShortsSkipBtn, skippingShortsMechanism, handleKeyEvent, removeToggleButton, cleanup };
    })();

    const Watch = (function () {
        const { state, utils, playerElementsCache } = Core;
        let miniPlayerInitialized = false;
        let wasAbove1000 = false;
        let scrubberEnforceObserver = null;
        const originalStyles = new Map();

        function calculatePosition(w) {
            let position;
            if ((window.screen.width >= CONFIG.miniPlayer.positionMinUHD && window.screen.width <= CONFIG.miniPlayer.positionMaxUHD)) {
                console.log('UHD detected for mini player positioning');
                position = Math.max(710, Math.min(1820, CONFIG.miniPlayer.positionFactorUHD * (w - 900) + 900));
            } else {
                console.log('Default settings for mini player positioning');
                position = Math.max(400, Math.min(1265, CONFIG.miniPlayer.positionFactorDefault * (w - 985) + 100));
            }
            return position;
        }

        function stopScrubberEnforcer() {
            if (scrubberEnforceObserver) {
                console.log("Enforcer found and destroyed");
                scrubberEnforceObserver.disconnect();
                scrubberEnforceObserver = null;
            }
        }

        function resetMiniPlayer() {
            stopScrubberEnforcer();
            const player = document.querySelector("#player");
            const moviePlayer = document.querySelector("#movie_player");
            const video = document.querySelector("video.html5-main-video");
            const chromeBottom = document.querySelector(".ytp-chrome-bottom");
            const progressContainer = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-heat-map-container");
            const progressBar = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar");
            const chapterContainer = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-chapters-container > div");
            const scrubber = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-scrubber-container");
            const nextbtn = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > a.ytp-next-button.ytp-button.ytp-playlist-ui")
            const buttonsvg = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > button > svg");

            if (player) {
                player.classList.remove(
                    'ytp-delhi-modern-compact-controls',
                    'ytp-rounded-miniplayer-not-regular-wide-video',
                    'playing-mode'
                );
            }

            // Restore original styles instead of clearing them
            const elementsToRestore = [
                { el: video, id: 'video' },
                { el: moviePlayer, id: 'moviePlayer' },
                { el: chromeBottom, id: 'chromeBottom' },
                { el: progressContainer, id: 'progressContainer' },
                { el: progressBar, id: 'progressBar' },
                { el: scrubber, id: 'scrubber' },
                { el: buttonsvg, id: 'buttonsvg' },
                { el: chapterContainer, id: 'chapterContainer' }
            ];

            elementsToRestore.forEach(({ el, id }) => {
                if (el && originalStyles.has(id)) {
                    el.style.cssText = originalStyles.get(id);
                }
            });

            // Also remove custom CSS properties from player
            if (player) {
                const storedPlayerStyles = originalStyles.get('player');
                if (storedPlayerStyles) {
                    player.style.cssText = storedPlayerStyles;
                }
            }

            if (nextbtn) {
                nextbtn.removeAttribute('style');
            }

            // Remove custom property from document root
            document.documentElement.style.removeProperty('--efyt-mini-left');

            document.body.classList.remove('efyt-mini-player');
            document.body.classList.remove('efyt-mini-active');
            wasAbove1000 = false;
        }

        function activateMiniPlayer() {
            const viewportWidth = window.innerWidth;
            const position = calculatePosition(viewportWidth);
            const player = document.querySelector("#player");
            const moviePlayer = document.querySelector("#movie_player");
            const video = document.querySelector("video.html5-main-video");
            const chromeBottom = document.querySelector(".ytp-chrome-bottom");
            const progressContainer = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-heat-map-container");
            const progressBar = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar");
            const chapterContainer = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-chapters-container > div");
            const scrubber = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-scrubber-container");

            const buttonsvg = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > button > svg");

            // Store original styles before modifying (only once per activation)
            if (!originalStyles.has('player') && player) {
                originalStyles.set('player', player.getAttribute('style') || '');
            }
            if (!originalStyles.has('moviePlayer') && moviePlayer) {
                originalStyles.set('moviePlayer', moviePlayer.getAttribute('style') || '');
            }
            if (!originalStyles.has('video') && video) {
                originalStyles.set('video', video.getAttribute('style') || '');
            }
            if (!originalStyles.has('chromeBottom') && chromeBottom) {
                originalStyles.set('chromeBottom', chromeBottom.getAttribute('style') || '');
            }
            if (!originalStyles.has('progressContainer') && progressContainer) {
                originalStyles.set('progressContainer', progressContainer.getAttribute('style') || '');
            }
            if (!originalStyles.has('progressBar') && progressBar) {
                originalStyles.set('progressBar', progressBar.getAttribute('style') || '');
            }
            if (!originalStyles.has('scrubber') && scrubber) {
                originalStyles.set('scrubber', scrubber.getAttribute('style') || '');
            }
            if (!originalStyles.has('buttonsvg') && buttonsvg) {
                originalStyles.set('buttonsvg', buttonsvg.getAttribute('style') || '');
            }
            if (!originalStyles.has('chapterContainer') && chapterContainer) {
                originalStyles.set('chapterContainer', chapterContainer.getAttribute('style') || '');
            }

            document.documentElement.style.setProperty('--efyt-mini-left', `${position}px`);

            if (player) {
                Object.assign(player.style, {
                    '--yt-delhi-pill-height': '40px',
                    '--yt-delhi-pill-top-height': '8px',
                    '--yt-delhi-bottom-controls-height': '56px',
                    '--yt-delhi-bottom-controls-height-xsmall-width-mode': '56px',
                    '--yt-delhi-big-mode-pill-height': '48px',
                    '--yt-delhi-big-mode-pill-top-height': '12px',
                    '--yt-delhi-big-mode-bottom-controls-height': '72px'
                });
            }

            if (moviePlayer) {
                Object.assign(moviePlayer.style, {
                    width: `${CONFIG.miniPlayer.width}px`,
                    height: `${CONFIG.miniPlayer.height}px`,
                    left: `${position}px`,
                    top: `${CONFIG.miniPlayer.top}px`,
                    borderRadius: "15px",
                });
            }

            if (video) {
                Object.assign(video.style, {
                    width: `${CONFIG.miniPlayer.width}px`,
                    height: `${CONFIG.miniPlayer.height}px`,
                    left: "0px",
                    borderRadius: "15px",
                });
            }

            if (chromeBottom) {
                Object.assign(chromeBottom.style, {
                    left: "10px",
                    width: "99%",
                    maxWidth: `${CONFIG.miniPlayer.width - 30}px`,
                });
            }

            if (progressBar) {
                Object.assign(progressBar.style, {
                    width: `${CONFIG.miniPlayer.width - 30}px !important`,
                });
            }

            if (progressContainer) {
                Object.assign(progressContainer.style, {
                    zIndex: "60",
                    bottom: "0",
                    height: "60px",
                });
            }

            if (chapterContainer) {
                Object.assign(chapterContainer.style, {
                    width: "99%",
                });
            }

            if (scrubber && progressBar) {
                // Set up observer for scrubber position enforcement
                if (scrubberEnforceObserver) {
                    scrubberEnforceObserver.disconnect();
                }
                scrubberEnforceObserver = new MutationObserver(() => {
                    const cur = Number(progressBar.getAttribute("aria-valuenow") || 0);
                    const tot = Number(progressBar.getAttribute("aria-valuemax") || 100);
                    const computedW = progressBar.getBoundingClientRect().width;
                    const xPos = (cur / tot) * computedW;
                    scrubber.style.cssText = `transform: translateX(${xPos}px) !important;`;
                });
                scrubberEnforceObserver.observe(progressBar, {
                    attributes: true,
                    attributeFilter: ['aria-valuenow', 'aria-valuemax'],
                    subtree: false
                });
            }

            if (buttonsvg) {
                Object.assign(buttonsvg.style, {
                    padding: "12px !important",
                });
            }

            player.classList.add('efyt-reinit');
            void player.offsetHeight;
            player.classList.remove('efyt-reinit');

            player.classList.add(
                'ytp-delhi-modern-compact-controls',
                'ytp-rounded-miniplayer-not-regular-wide-video',
                'playing-mode'
            );
            document.body.classList.add('efyt-mini-player');
            document.body.classList.add('efyt-mini-active');
        }

        function handleScroll(scrollY) {
            const scrollContainer = document.getElementById('scroll-top-container');
            if (scrollContainer) {
                scrollContainer.style.opacity = (scrollY > CONFIG.miniPlayer.scrollThreshold && utils.checkIfWatchPage()) ? '1' : '0';
            }

            const currentScroll = scrollY > CONFIG.miniPlayer.scrollThreshold;
            if (currentScroll !== wasAbove1000) {
                wasAbove1000 = currentScroll;
                if (currentScroll) {
                    activateMiniPlayer();
                    state.isMiniPlayerActive = true;
                } else {
                    resetMiniPlayer();
                    state.isMiniPlayerActive = false;
                }
            }
        }

        function createScrollToTopBtn() {
            let scrollTopContainer = document.getElementById('scroll-top-container');
            if (!scrollTopContainer) {
                const buttonPosition = calculatePosition(window.innerWidth) + CONFIG.miniPlayer.width - 50;
                scrollTopContainer = document.createElement('div');
                scrollTopContainer.id = 'scroll-top-container';
                scrollTopContainer.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 55px;
                    height: 55px;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                scrollTopContainer.style.left = `${buttonPosition}px`;

                const button = document.createElement('button');
                button.className = 'scroll-top-btn';
                const scrollUpDiv = document.createElement('div');
                scrollUpDiv.className = 'scroll-up-btn';
                scrollUpDiv.style.color = 'red';
                scrollUpDiv.style.position = 'relative';
                scrollUpDiv.style.top = '-2px';
                //scrollUpDiv.textContent = '⮝'; -this arrow require 32px font size and -3px top
                scrollUpDiv.textContent = '🡩';
                scrollUpDiv.style.fontSize = '24px';
                button.appendChild(scrollUpDiv);

                const tooltip = document.createElement('div');
                tooltip.className = 'scroll-tooltip';
                tooltip.textContent = 'Scroll to Top';
                tooltip.setAttribute('role', 'tooltip');
                tooltip.setAttribute('aria-label', 'Scroll to Top');

                button.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                scrollTopContainer.appendChild(button);
                scrollTopContainer.appendChild(tooltip);
                document.body.appendChild(scrollTopContainer);
                state.isScrollButtonCreated = true;
            }
        }

        function removeScrollButton() {
            const scrollTopContainer = document.getElementById('scroll-top-container');
            if (scrollTopContainer) {
                scrollTopContainer.remove();
                state.isScrollButtonCreated = false;
            }
        }

        function cleanup() {
            stopScrubberEnforcer();
            resetMiniPlayer();
            removeScrollButton();
            playerElementsCache.clear();
            originalStyles.clear();
            miniPlayerInitialized = false;
        }

        return { handleScroll, createScrollToTopBtn, removeScrollButton, cleanup, calculatePosition };
    })();

    // Settings - persistent user config with gear icon in #end.ytd-masthead
    const Settings = (function () {
        const STORAGE_KEY = 'efyt-settings';
        const DEFAULTS = {
            gridColumns: 5,
            redBorders: true,
            mastheadMargin: '0 10%',
            fixedMasthead: false
        };

        let current = { ...DEFAULTS };
        let panelEl = null;
        let gearEl = null;

        function load() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    current = { ...DEFAULTS, ...JSON.parse(saved) };
                }
            } catch (e) {
                current = { ...DEFAULTS };
            }
            return current;
        }

        function save(updates) {
            current = { ...current, ...updates };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        }

        function apply() {
            // Grid columns
            document.documentElement.style.setProperty('--efyt-grid-columns', String(current.gridColumns));
            // Red borders
            document.documentElement.dataset.efytBorders = current.redBorders ? 'on' : 'off';
            // Masthead margin
            document.documentElement.style.setProperty('--efyt-masthead-margin', current.mastheadMargin);
            // Fixed masthead toggle
            document.documentElement.dataset.efytMasthead = current.fixedMasthead ? 'fixed' : 'default';
            // Re-run grid update for dynamic elements
            MainPage.updateGrid();
        }

        function createGearButton() {
            // Try to insert the gear immediately
            if (tryInsertGear()) return;

            // If #end.ytd-masthead isn't ready yet, watch for it
            if (Core.state._endObserver) Core.state._endObserver.disconnect();
            Core.state._endObserver = new MutationObserver(() => {
                if (tryInsertGear()) {
                    Core.state._endObserver.disconnect();
                }
            });
            Core.state._endObserver.observe(document.body, { childList: true, subtree: true });
        }

        function tryInsertGear() {
            if (document.getElementById('efyt-gear-btn')) return true;

            // Primary target: #buttons.ytd-masthead inside #end.ytd-masthead
            let container = document.querySelector('#end.ytd-masthead #buttons.ytd-masthead, #buttons.ytd-masthead');
            // Fallback: try to find #end first, then look for #buttons inside
            if (!container) {
                const end = document.querySelector('#end.ytd-masthead, [id="end"]');
                if (end) {
                    const buttons = end.querySelector('#buttons');
                    if (buttons) container = buttons;
                }
            }
            // Fallback: find the container that has notification/avatar buttons
            if (!container) {
                const notifBtn = document.querySelector('ytd-notification-topbar-button-renderer');
                if (notifBtn && notifBtn.parentElement) {
                    container = notifBtn.parentElement;
                }
            }
            if (!container) {
                const avatar = document.querySelector('yt-avatar-shape');
                if (avatar) {
                    const walk = (el) => {
                        let parent = el.parentElement;
                        while (parent && parent.children.length < 4) {
                            parent = parent.parentElement;
                        }
                        return parent;
                    };
                    container = walk(avatar);
                }
            }
            if (!container) return false;

            gearEl = document.createElement('button');
            gearEl.id = 'efyt-gear-btn';
            // SVG gear icon built with DOM API to bypass Trusted Types CSP
            const svgNS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', '20');
            svg.setAttribute('height', '20');
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z');
            svg.appendChild(path);
            gearEl.appendChild(svg);
            gearEl.title = 'Enhancer Settings';
            gearEl.setAttribute('aria-label', 'Enhancer Settings');

            gearEl.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePanel();
            });

            // Insert as first child of #buttons (before notification bell)
            if (container.firstChild) {
                container.insertBefore(gearEl, container.firstChild);
            } else {
                container.appendChild(gearEl);
            }

            // Watch for YouTube re-rendering the masthead and removing our gear
            if (!Core.state._endPersistenceObserver) {
                Core.state._endPersistenceObserver = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        for (const removed of m.removedNodes) {
                            if (removed.nodeType === 1) {
                                if (removed.id === 'efyt-gear-btn' || (removed.querySelector && removed.querySelector('#efyt-gear-btn'))) {
                                    setTimeout(tryInsertGear, 100);
                                    return;
                                }
                            }
                        }
                    }
                });
            }
            Core.state._endPersistenceObserver.observe(container, { childList: true });

            buildPanel();
            return true;
        }

        function buildPanel() {
            if (panelEl) return;
            panelEl = document.createElement('div');
            panelEl.id = 'efyt-settings-panel';

            const cols = current.gridColumns;
            const bordersOn = current.redBorders;
            const marginVal = current.mastheadMargin;
            const fixedOn = current.fixedMasthead;

            panelEl.innerHTML = TT.createHTML(`
                <h3>Enhancer Settings</h3>
                <div class="efyt-setting-row">
                    <div>
                        <div class="efyt-setting-label">Grid columns</div>
                        <div class="efyt-setting-desc">Thumbnails per row on home page</div>
                    </div>
                    <select id="efyt-col-select" style="border-radius: 5px">
                        <option value="2"${cols===2?' selected':''}>2</option>
                        <option value="3"${cols===3?' selected':''}>3</option>
                        <option value="4"${cols===4?' selected':''}>4</option>
                        <option value="5"${cols===5?' selected':''}>5</option>
                        <option value="6"${cols===6?' selected':''}>6</option>
                        <option value="7"${cols===7?' selected':''}>7</option>
                        <option value="8"${cols===8?' selected':''}>8</option>
                    </select>
                </div>
                <div class="efyt-setting-row">
                    <div>
                        <div class="efyt-setting-label">Red dotted borders</div>
                        <div class="efyt-setting-desc">Toggle debug borders on elements</div>
                    </div>
                    <div class="efyt-toggle-track${bordersOn?' efyt-on':''}" id="efyt-border-toggle">
                        <div class="efyt-toggle-knob"></div>
                    </div>
                </div>
                <div class="efyt-setting-row">
                    <div>
                        <div class="efyt-setting-label">Top Bar margin</div>
                        <div class="efyt-setting-desc">Left/right margins for header ends (e.g. 0, 0 10%)</div>
                    </div>
                    <input type="text" id="efyt-margin-input" value="${marginVal}" style="width:90px;text-align:center;border-radius: 5px;">
                </div>
                <div class="efyt-setting-row">
                    <div>
                        <div class="efyt-setting-label">Auto-Hide Top Bar</div>
                        <div class="efyt-setting-desc">Top Bar scrolls away, content fills top</div>
                    </div>
                    <div class="efyt-toggle-track${fixedOn?' efyt-on':''}" id="efyt-masthead-toggle">
                        <div class="efyt-toggle-knob"></div>
                    </div>
                </div>
                <button id="efyt-save-btn">Save</button>
            `);

            document.body.appendChild(panelEl);

            // Wire up toggles
            panelEl.querySelector('#efyt-border-toggle').addEventListener('click', function () {
                this.classList.toggle('efyt-on');
            });
            panelEl.querySelector('#efyt-masthead-toggle').addEventListener('click', function () {
                this.classList.toggle('efyt-on');
            });

            // Save button
            panelEl.querySelector('#efyt-save-btn').addEventListener('click', () => {
                const newCols = parseInt(panelEl.querySelector('#efyt-col-select').value, 10);
                const newBorders = panelEl.querySelector('#efyt-border-toggle').classList.contains('efyt-on');
                const newMargin = panelEl.querySelector('#efyt-margin-input').value.trim() || '0 10%';
                const newFixed = panelEl.querySelector('#efyt-masthead-toggle').classList.contains('efyt-on');

                save({
                    gridColumns: newCols,
                    redBorders: newBorders,
                    mastheadMargin: newMargin,
                    fixedMasthead: newFixed
                });
                apply();
                panelEl.classList.remove('efyt-open');
            });

            // Click outside to close
            document.addEventListener('click', (e) => {
                if (panelEl.classList.contains('efyt-open') &&
                    !panelEl.contains(e.target) &&
                    e.target !== gearEl &&
                    !gearEl.contains(e.target)) {
                    panelEl.classList.remove('efyt-open');
                }
            });
        }

        function togglePanel() {
            if (!panelEl) return;
            panelEl.classList.toggle('efyt-open');
        }

        function updateScrollState(scrollY) {
            if (!current.fixedMasthead) {
                document.documentElement.removeAttribute('data-efyt-scrolled');
                return;
            }
            document.documentElement.dataset.efytScrolled = scrollY > 10 ? 'true' : 'false';
        }

        return { load, save, apply, createGearButton, updateScrollState };
    })();

    // MainPage
    const MainPage = (function () {
        const { utils } = Core;

        function updateGrid() {
            const cols = Settings.load().gridColumns || 5;
            // Apply to all existing grid containers
            document.querySelectorAll('ytd-rich-grid-renderer, ytd-rich-section-renderer').forEach(el => {
                el.style.setProperty('--ytd-rich-grid-items-per-row', String(cols), 'important');
            });
            // Watch for dynamically added grid containers
            if (Core.state._gridObserver) return;
            Core.state._gridObserver = new MutationObserver(() => {
                document.querySelectorAll('ytd-rich-grid-renderer, ytd-rich-section-renderer').forEach(el => {
                    if (!el.dataset.efytApplied) {
                        el.dataset.efytApplied = 'true';
                        el.style.setProperty('--ytd-rich-grid-items-per-row', String(cols), 'important');
                    }
                });
            });
            Core.state._gridObserver.observe(document.body, { childList: true, subtree: true });
        }

        return { updateGrid };
    })();

    // Navigation - selective cache clear
    const Navigation = (function () {
        const { state, cache, utils } = Core;

        function handleChange() {
            const url = window.location.href;
            if (url === state.lastUrl) return;
            state.lastUrl = url;

            const relevantSelectors = [CONFIG.selectors.mastheadCenter, CONFIG.selectors.mastheadContainer];
            relevantSelectors.forEach(selector => cache.delete(selector));

            if (utils.checkIfShortsPage()) {
                Shorts.createShortsSkipBtn();
                Shorts.skippingShortsMechanism();
                Watch.cleanup();
            } else if (utils.checkIfWatchPage()) {
                Watch.createScrollToTopBtn();
                Layout.updateWatchStyles();
                Layout.initMastheadCache();
                MainPage.updateGrid();
                Shorts.cleanup();
            } else {
                Watch.cleanup();
                Shorts.cleanup();
            }

            Layout.updateMasthead(window.scrollY);
        }

        return { handleChange };
    })();

    // Global Events
    const debouncedResize = Core.utils.debounce(() => {
        Layout.updateMasthead(Core.state.lastScrollY);
        Layout.updateWatchStyles();

        if (Core.utils.checkIfWatchPage()) {
            const newLeft = Watch.calculatePosition(window.innerWidth);
            if (Math.abs(newLeft - Core.state.lastMiniLeft) > 5) {
                Core.state.lastMiniLeft = newLeft;
            }
        }
    }, 120);

    /* Single scroll handler — rAF to avoid layout thrashing */
    let scrollRafPending = false;
    window.addEventListener('scroll', () => {
        if (!scrollRafPending) {
            scrollRafPending = true;
            requestAnimationFrame(() => {
                scrollRafPending = false;
                Layout.updateMasthead();
                Settings.updateScrollState(window.scrollY);
                if (Core.utils.checkIfWatchPage()) {
                    Watch.handleScroll(window.scrollY);
                }
            });
        }
    });
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('popstate', Navigation.handleChange);

    // Init
    Settings.load();
    Settings.apply();
    Layout.initMastheadCache();
    MainPage.updateGrid();

    // Mount gear button — uses MutationObserver internally, no need to wait
    Settings.createGearButton();

    const titleObserver = new MutationObserver(Core.utils.debounce(() => {
        Navigation.handleChange();
    }, 100));
    const titleElement = document.querySelector('title');
    if (titleElement) {
        titleObserver.observe(titleElement, { childList: true });
    }
})();
