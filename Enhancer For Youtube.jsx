
(function () {
    // Core Module: Shared state, utilities, and DOM cache
    const Core = (function () {
        let isClicked = true;
        let isSkippingEnabled = true;
        let hasNavigationButtonBeenFetched = false;
        let navigationButtonDown = null;
        let lastUrl = null;
        let lastShortsId = null;
        let observer = null;
        let observerShortsId = null;
        let isScrollButtonCreated = false;
        let lastProcessedShortsId = null;
        let lastMaxLoadTime = 500;
        let lastWheelEvent = 0;
        let lastKeyEvent = 0;
        const debounceDelay = 1000;

        const cache = {
            center: null,
            container: null,
            primary: null,
            columns: null
        };

        function throttle(fn, delay) {
            let lastCall = 0;
            return (...args) => {
                const now = Date.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    fn(...args);
                }
            };
        }

        function debounce(fn, delay) {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    fn(...args);
                }, delay);
            };
        }

        function waitForDOMElement(selector, callback, options = {}) {
            const { interval = 100, timeout = 15000, delay = 0 } = options;
                const startTime = Date.now();
                const checkElement = () => {
                    const element = document.querySelector(selector);
                    if (element) {
                        callback(element);
                    } else if (Date.now() - startTime < timeout) {
                        setTimeout(checkElement, interval);
                    }
                };
                if (delay > 0) {
                    setTimeout(checkElement, delay);
                } else {
                    checkElement();
                }
        }

        function waitForAllDOMElements(selectors, options = {}) {
            const { timeout = 15000, maxRetries = 2, defaultDelay = 100 } = options;
            return new Promise((resolve, reject) => {
                const results = {};
                let completed = 0;
                let retryCount = 0;

                function pollElements(remainingSelectors) {
                    if (!remainingSelectors.length) {
                        resolve(results);
                        return;
                    }

                    remainingSelectors.forEach(selector => {
                        if (results[selector]) return; // Skip already found
                        waitForDOMElement(
                            selector,
                            element => {
                                results[selector] = { element, foundAt: performance.now() };
                                completed++;
                                if (completed === selectors.length) {
                                    // Update lastMaxLoadTime based on max load time
                                    const loadTimes = Object.values(results).map(r => r.foundAt - performance.now());
                                    Core.state.lastMaxLoadTime = Math.max(...loadTimes, defaultDelay);
                                    resolve(results);
                                }
                            },
                            { interval: 100, timeout, delay: Core.state.lastMaxLoadTime || defaultDelay }
                        );
                    });

                    setTimeout(() => {
                        if (completed < selectors.length && retryCount < maxRetries) {
                            retryCount++;
                            // Calculate dynamic retry delay based on found elements
                            const foundTimes = Object.values(results).map(r => r.foundAt - performance.now());
                            const avgLoadTime = foundTimes.length ? foundTimes.reduce((a, b) => a + b, 0) / foundTimes.length : timeout / 2;
                            const retryDelay = Math.max(1000, avgLoadTime * 1.5);
                            console.warn(`Retrying ${remainingSelectors.filter(s => !results[s]).length} selectors, attempt ${retryCount + 1}/${maxRetries}, delay ${retryDelay}ms`);
                            setTimeout(() => pollElements(remainingSelectors.filter(s => !results[s])), retryDelay);
                        } else if (completed < selectors.length) {
                            const missing = selectors.filter(s => !results[s]);
                            reject(new Error(`Failed to find selectors after ${maxRetries} retries: ${missing.join(', ')}`));
                        }
                    }, timeout);
                }
                pollElements(selectors);
            });
        }

        function checkIfWatchPage() {
            return window.location.href.includes('youtube.com/watch');
        }

        function checkIfShortsPage() {
            return window.location.href.includes('youtube.com/shorts');
        }

        function getShortsId() {
            const url = window.location.href;
            const match = url.match(/youtube\.com\/shorts\/([^?]+)/);
            return match ? match[1] : null;
        }

        function pauseVideo() {
            const videoElement = document.querySelector('video');
            if (videoElement && !videoElement.paused) {
                videoElement.pause();
            }
        }

        return {
            state: {
                isClicked, isSkippingEnabled, hasNavigationButtonBeenFetched, navigationButtonDown,
                lastUrl, lastShortsId, observer, observerShortsId, isScrollButtonCreated,
                lastProcessedShortsId, lastMaxLoadTime, lastWheelEvent, lastKeyEvent, debounceDelay
            },
            utils: { throttle, debounce, waitForDOMElement, waitForAllDOMElements, checkIfWatchPage, checkIfShortsPage, getShortsId, pauseVideo },
            cache
        };
    })();

    // Styles Module: CSS injection
    const Styles = (function () {
        const styleElement = document.createElement('style');
        document.head.appendChild(styleElement);
        styleElement.textContent = `
            :root {
                --dark-bt: rgb(200 200 200 / 15%);
                --dark-bt-hover: rgba(255 255 255 /25%);
                --dark-bt-tp: rgb(0 0 0/ 1%);
                --light-bt: rgb(0 0 0 / 7%);
                --light-bt-tp: rgb(255 255 255/ 1%);
                --light-bt-hover: rgb(0 0 0 /15%);
            }
            #start.ytd-masthead, #end.ytd-masthead {
                height: 50px;
                border-radius: 30px;
                display: flex;
                position: static;
                margin: 0 10%;
                border: 1px dotted red;
                background-color: var(--light-bt);
            }
            .ytSearchboxComponentHost {
                height: 53px;
                margin: 0 12px 0 0;
            }
            .ytSearchboxComponentInputBox {
                margin: 0 0 0 0;
                border: 1px dotted red;
                box-shadow: none;
                height: 50px;
                background: transparent;
                background-color: var(--light-bt);
                display: flex;
                justify-content: space-around;
            }
            #center.ytd-masthead {
                margin: auto;
                flex: 0 0 550px;
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
                border: 1px dotted red;
                background-color: var(--light-bt);
                height: 52px;
            }
            #background.ytd-masthead {
                position: fixed;
                opacity: 0;
                visibility: visible;
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
            }
            #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
                display: none;
            }
            .yt-spec-icon-shape {
                color: #c00;
            }
            ytd-feed-filter-chip-bar-renderer {
                height: 0;
            }
            #frosted-glass.with-chipbar.ytd-app {
                display: none;
            }
            .yt-core-attributed-string--white-space-no-wrap {
                color: #c00 !important;
            }
            .yt-spec-button-shape-next--mono.yt-spec-button-shape-next--filled {
                background: none !important;
                color:black !important;
            }
            .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text,
            .yt-spec-button-shape-next--mono.yt-spec-button-shape-next--text {
                background-color: var(--light-bt) !important;
            }
            yt-chip-cloud-chip-renderer[chip-style=STYLE_DEFAULT][selected] #chip-container.yt-chip-cloud-chip-renderer {
                background-color: var(--yt-spec-badge-chip-background) !important;
                color: var(--yt-spec-text-primary) !important;
            }
            .yt-spec-touch-feedback-shape {
                border: 1px dotted red;
            }
            .yt-spec-touch-feedback-shape:hover {
                background-color: var(--light-bt-hover) !important;
            }
            #content > yt-lockup-view-model > div > yt-touch-feedback-shape > div {
                background-color: var(--light-bt-tp) !important;
                border: none !important;
            }
            #contents > yt-lockup-view-model:nth-child(n) > div > yt-touch-feedback-shape > div {
                background-color: var(--light-bt-tp) !important;
                border: none !important;
            }
            @media (prefers-color-scheme: dark) {
                #start.ytd-masthead,
                .ytSearchboxComponentInputBox,
                #container.ytd-searchbox,
                #end.ytd-masthead,
                .scroll-top-btn,
                .skip-toggle-btn,
                .ytSearchboxComponentSearchButton,
                .yt-spec-touch-feedback-shape,
                #voice-search-button.ytd-masthead
                {
                    background-color: var(--dark-bt) !important;
                }
                #content > yt-lockup-view-model > div > yt-touch-feedback-shape > div {
                    background-color: var(--dark-bt-tp) !important;
                    border: none !important;
                }
                #contents > yt-lockup-view-model:nth-child(n) > div > yt-touch-feedback-shape > div {
                    background-color: var(--dark-bt-tp) !important;
                    border: none !important;
                }
                .yt-spec-button-shape-next--mono.yt-spec-button-shape-next--filled {
                color: red !important;
                }
                #start.ytd-masthead:hover,
                .ytSearchboxComponentInputBox:hover,
                #container.ytd-searchbox:hover,
                #end.ytd-masthead:hover,
                .scroll-top-btn:hover,
                .skip-toggle-btn:hover,
                .ytSearchboxComponentSearchButton:hover,
                .yt-spec-touch-feedback-shape:hover,
                .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text:hover,
                #voice-search-button.ytd-masthead:hover
                {
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
                border: 1px dotted red;
                display: flex;
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
            .skip-toggle-btn {
                pointer-events: all;
                width: 56px;
                height: 56px;
                margin: 0;
                border-radius: 50%;
                cursor: pointer;
                border: none;
                transition: background-color 0.2s ease, opacity 4s ease;
                z-index: 1000;
                opacity: 1;
                justify-content: center;
                align-items: center;
            }
            .skip-toggle-btn:hover {
                background-color: var(--light-bt-hover);
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
        `;
    })();

    // Layout Module: Layout updates with cached DOM elements via waitForAllDOMElements
    const Layout = (function () {
        const { utils, cache } = Core;

        function updateLayout() {
            // Check if masthead elements are cached
            if (!cache.center || !cache.center.isConnected || !cache.container || !cache.container.isConnected) {
                const selectors = ['#center.ytd-masthead', '#container.ytd-masthead'];
                utils.waitForAllDOMElements(selectors, { timeout: 15000, maxRetries: 2 })
                    .then(results => {
                        cache.center = results['#center.ytd-masthead'].element;
                        cache.container = results['#container.ytd-masthead'].element;
                        if (cache.center && cache.container) {
                            const windowWidth = window.innerWidth;
                            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
                            cache.container.style.opacity = scrollPosition === 0 ? '1' : '0.6';
                            let centerFlexBasis = 200 + (windowWidth - 1035) * 0.3955;
                            centerFlexBasis = Math.max(200, Math.min(550, centerFlexBasis));
                            cache.center.style.flex = `0 0 ${centerFlexBasis}px`;
                        }
                    })
                    .catch(() => {});
            } else {
                // Use cached masthead elements
                const windowWidth = window.innerWidth;
                const scrollPosition = window.scrollY || document.documentElement.scrollTop;
                cache.container.style.opacity = scrollPosition === 0 ? '1' : '0.6';
                let centerFlexBasis = 200 + (windowWidth - 1035) * 0.3955;
                centerFlexBasis = Math.max(200, Math.min(550, centerFlexBasis));
                cache.center.style.flex = `0 0 ${centerFlexBasis}px`;
            }

            if (utils.checkIfWatchPage()) {
                // Cache primary and columns if not already cached
                if (!cache.primary || !cache.primary.isConnected || !cache.columns || !cache.columns.isConnected) {
                    const selectors = ['#primary', '#columns'];
                    utils.waitForAllDOMElements(selectors, { timeout: 15000, maxRetries: 2 })
                        .then(results => {
                            cache.primary = results['#primary'].element;
                            cache.columns = results['#columns'].element;
                            applyWatchStyles();
                        })
                        .catch(err => console.error(`Watch page caching failed: ${err.message}`));
                } else {
                    applyWatchStyles();
                }
            }

            function applyWatchStyles() {
                const viewportWidth = window.innerWidth;
                let maxWidthValue, position;
                if (window.screen.width === 2560 && window.screen.height === 1440) {
                    maxWidthValue = 2300;
                    position = window.pageYOffset >= 4200 ? viewportWidth * 0.75 + 20 : viewportWidth * 0.55 - 30;
                } else {
                    maxWidthValue = 1850;
                    position = 0.8633 * (viewportWidth - 1035) + 80;
                    position = Math.max(80, Math.min(854, position));
                }

                const cssRules = `
                    #primary.ytd-watch-flexy {
                        max-width: ${maxWidthValue}px !important;
                        margin-left: 0px !important;
                        margin-top: 12px !important;
                    }
                    #columns.ytd-watch-flexy {
                        max-width: ${maxWidthValue}px !important;
                    }
                    body.efyt-mini-player.efyt-mini-player-top-right #movie_player:not(.ytp-fullscreen) {
                        height: 315px !important;
                        border-radius: 14px !important;
                        top: 55px !important;
                        left: ${position}px !important;
                    }
                    body._top-right #efyt-close-mini-player {
                        top: 60px !important;
                        left: ${position}px !important;
                        width: 3%;
                        height: 3%;
                    }
                `;
                let pageStyles = document.querySelector('style[data-page-styles]');
                if (!pageStyles) {
                    pageStyles = document.createElement('style');
                    pageStyles.setAttribute('data-page-styles', 'true');
                    document.head.appendChild(pageStyles);
                }
                pageStyles.textContent = cssRules;
            }
        }

        return { updateLayout };
    })();

    // Shorts Module: Shorts skipping and toggle button
    const Shorts = (function () {
        const { state, utils } = Core;

        function createShortsSkipBtn() {
            if (utils.checkIfShortsPage()) {
                let autoskipContainer = document.getElementById('shorts-autoskip');
                if (!autoskipContainer) {
                    autoskipContainer = document.createElement('div');
                    autoskipContainer.className = 'navigation-button style-scope ytd-shorts';
                    autoskipContainer.id = 'shorts-autoskip';

                    const toggleButton = document.createElement('button');
                    toggleButton.id = 'shorts-skip-toggle';
                    toggleButton.className = 'skip-toggle-btn';

                    const touchFeedbackShape = document.createElement('div');
                    touchFeedbackShape.className = 'yt-spec-touch-feedback-shape';
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

                    utils.waitForDOMElement(
                        '.navigation-container.style-scope.ytd-shorts',
                        navigationContainer => {
                            utils.waitForDOMElement(
                                '#navigation-button-up',
                                navigationButtonUp => {
                                    navigationContainer.insertBefore(autoskipContainer, navigationButtonUp);
                                },
                                { interval: 100, timeout: 15000 }
                            );
                        },
                        { interval: 100, timeout: 15000 }
                    );

                    toggleButton.addEventListener('click', () => {
                        state.isSkippingEnabled = !state.isSkippingEnabled;
                        icon.textContent = state.isSkippingEnabled ? 'SKIP' : 'NO SKIP';

                        if (state.isSkippingEnabled) {
                            const progressBarElement = document.querySelector('#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div');
                            if (progressBarElement && state.observer) {
                                state.observer.observe(progressBarElement, {
                                    attributes: true,
                                    attributeFilter: ['aria-valuetext'],
                                });
                            }
                        } else if (!state.isSkippingEnabled && state.observer) {
                            state.observer.disconnect();
                        }
                    });
                }
            }
        }

        function SkippingShortsMechanism() {
            if (utils.checkIfShortsPage()) {
                const currentShortsId = utils.getShortsId();
                if (currentShortsId === state.lastProcessedShortsId && state.observer && currentShortsId === state.observerShortsId) {
                    return;
                }
                state.isClicked = false;
                state.lastProcessedShortsId = currentShortsId;

                if (state.observer) {
                    state.observer.disconnect();
                    state.observer = null;
                    state.observerShortsId = null;
                }

                const selectors = [
                    '#navigation-button-down > ytd-button-renderer > yt-button-shape > button',
                    '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div'
                ];
                utils.waitForAllDOMElements(selectors, { timeout: 15000, maxRetries: 2 })
                    .then(results => {
                        const navButton = results[selectors[0]].element;
                        let progressBarElement = results[selectors[1]].element;
                        if (!state.hasNavigationButtonBeenFetched) {
                            state.navigationButtonDown = navButton;
                            state.hasNavigationButtonBeenFetched = true;

                            state.navigationButtonDown.addEventListener('click', function observerReinitHandler(e) {
                                if (!e.isTrusted) {
                                    return;
                                }
                                state.navigationButtonDown.removeEventListener('click', observerReinitHandler);
                                if (state.observer) {
                                    state.observer.disconnect();
                                    state.observer = null;
                                    state.observerShortsId = null;
                                }
                            });
                        }

                            let maxWidth = 0;
                            let previousWidth = 0;
                            let mutationCount = 0;

                            state.observer = new MutationObserver(mutations => {
                                mutationCount++;
                                mutations.forEach(mutation => {
                                    if (mutation.attributeName === 'aria-valuetext' && state.isSkippingEnabled) {
                                        let ariaValueText = progressBarElement.getAttribute('aria-valuetext');
                                        if (!ariaValueText) {
                                            progressBarElement = document.querySelector('#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div');
                                            ariaValueText = progressBarElement ? progressBarElement.getAttribute('aria-valuetext') : null;
                                        }
                                        if (ariaValueText) {
                                            let widthNumber = parseFloat(ariaValueText.replace('%', ''));
                                            if (isNaN(widthNumber)) {
                                                return;
                                            }
                                            if (widthNumber >= maxWidth) {
                                                maxWidth = widthNumber;
                                                previousWidth = widthNumber;
                                            } else if (!state.isClicked) {
                                                if ((widthNumber === 0 || widthNumber === 1) && previousWidth >= 97) {
                                                    utils.pauseVideo();
                                                    state.navigationButtonDown.click();
                                                    state.isClicked = true;
                                                    state.observer.disconnect();
                                                    state.observer = null;
                                                    state.observerShortsId = null;
                                                    maxWidth = 0;
                                                    previousWidth = 0;
                                                } else {
                                                    previousWidth = widthNumber;
                                                }
                                            }
                                        }
                                    }
                                });
                            });
                            state.observer.observe(progressBarElement, {
                                attributes: true,
                                attributeFilter: ['aria-valuetext'],
                            });
                            state.observerShortsId = currentShortsId;
                    })
                .catch(err => console.error(`waitForAllDOMElements failed: ${err.message}`));
            }
        }

        function removeToggleButton() {
            const toggleButton = document.querySelector('#shorts-skip-toggle');
            if (toggleButton && toggleButton.parentNode) {
                toggleButton.dispatchEvent(new Event('remove'));
                toggleButton.parentNode.removeChild(toggleButton);
            }
        }

        return { createShortsSkipBtn, SkippingShortsMechanism, removeToggleButton };
    })();

    // Watch Module: Scroll-to-top button
    const Watch = (function () {
        const { state: wsState, utils } = Core;

        function createScrollToTopBtn() {
            let scrollTopContainer = document.getElementById('scroll-top-container');
            if (!scrollTopContainer) {
                scrollTopContainer = document.createElement('div');
                scrollTopContainer.setAttribute('id', 'scroll-top-container');
                scrollTopContainer.className = 'navigation-button style-scope ytd-watch-flexy';
                const scrollToTopBtn = document.createElement('button');
                scrollToTopBtn.setAttribute('id', 'scroll-to-top');
                scrollToTopBtn.className = 'scroll-top-btn';
                scrollToTopBtn.setAttribute('aria-label', 'Scroll to Top');

                const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const divElement = document.createElement('div');

                svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                svgElement.setAttribute('height', '24');
                svgElement.setAttribute('viewBox', '0 0 24 24');
                svgElement.setAttribute('width', '24');
                svgElement.setAttribute('focusable', 'false');
                svgElement.style.fill = 'red';
                svgElement.style.display = 'flex';
                pathElement.setAttribute('d', 'M19.884 10.114a1.25 1.25 0 01-1.768 1.768L13.25 7.016v12.982a1.25 1.25 0 11-2.5 0V7.016l-4.866 4.866a1.25 1.25 0 11-1.768-1.768L12 2.299l7.884 7.884Z');
                svgElement.appendChild(pathElement);
                divElement.classList.add('scroll-up-btn');
                divElement.appendChild(svgElement);
                scrollToTopBtn.appendChild(divElement);
                scrollTopContainer.appendChild(scrollToTopBtn);
                document.body.appendChild(scrollTopContainer);
                wsState.isScrollButtonCreated = true;

                const updatePosition = () => {
                    const viewportWidth = window.innerWidth;
                    let buttonPosition;
                    if (window.screen.width === 2560 && window.screen.height === 1440) {
                        buttonPosition = 0.904 * (viewportWidth - 1035) + 544;
                    } else {
                        buttonPosition = 0.904 * (viewportWidth - 1035) + 544;
                    }
                    buttonPosition = Math.max(544, Math.min(1344, buttonPosition));
                    scrollTopContainer.style.left = `${buttonPosition}px`;
                };
                updatePosition();

                scrollToTopBtn.addEventListener('click', () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                    });
                    setTimeout(() => Layout.updateLayout(), 500);
                });

                window.addEventListener('resize', utils.throttle(() => {
                    if (utils.checkIfWatchPage()) {
                        updatePosition();
                    }
                }, 30));
            }
        }

        function handleScroll() {
            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
            Layout.updateLayout();
            const scrollTopContainer = document.getElementById('scroll-top-container');
            if (scrollTopContainer) {
                scrollTopContainer.style.opacity = (scrollPosition > 1000 && utils.checkIfWatchPage()) ? '1' : '0';
            }
            if (utils.checkIfWatchPage() && !wsState.isScrollButtonCreated) {
                createScrollToTopBtn();
            }
        }

        function removeScrollButton() {
            const scrollTopContainer = document.getElementById('scroll-top-container');
            if (scrollTopContainer) {
                scrollTopContainer.remove();
                wsState.isScrollButtonCreated = false;
            }
        }

        return { createScrollToTopBtn, handleScroll, removeScrollButton };
    })();

    // MainPage Module: Placeholder for main page logic
    const MainPage = (function () {
        return {};
    })();

    // Navigation Module: URL-based navigation and event handling
    const Navigation = (function () {
        const { state, utils, cache } = Core;

        function handleNavigationChange() {
            const currentUrl = window.location.href;
            const currentPath = window.location.pathname;
            if (currentUrl !== state.lastUrl) {
                // Reset cache only if the base path changes (ignore ?v changes)
                if (!state.lastUrl || currentPath !== new URL(state.lastUrl).pathname) {
                    cache.center = null;
                    cache.container = null;
                    cache.primary = null;
                    cache.columns = null;
                }
                state.lastUrl = currentUrl;
                const currentShortsId = utils.getShortsId();
                if (currentUrl.includes('youtube.com/shorts')) {
                    if (state.isScrollButtonCreated) {
                        Watch.removeScrollButton();
                    }
                    if (currentShortsId !== state.lastShortsId || currentShortsId !== state.observerShortsId || !state.observer) {
                        state.lastShortsId = currentShortsId;
                        if (state.observer && currentShortsId !== state.observerShortsId) {
                            state.observer.disconnect();
                            state.observer = null;
                            state.observerShortsId = null;
                        }
                        Shorts.SkippingShortsMechanism();
                    }
                    Shorts.createShortsSkipBtn();
                } else if (utils.checkIfWatchPage()) {
                    Shorts.removeToggleButton();
                    if (state.observer) {
                        state.observer.disconnect();
                        state.observer = null;
                        state.observerShortsId = null;
                    }
                    state.lastShortsId = null;
                    state.lastProcessedShortsId = null;
                    if (!state.isScrollButtonCreated) {
                        Watch.createScrollToTopBtn();
                    }
                } else {
                    Shorts.removeToggleButton();
                    if (state.isScrollButtonCreated) {
                        Watch.removeScrollButton();
                    }
                    if (state.observer) {
                        state.observer.disconnect();
                        state.observer = null;
                        state.observerShortsId = null;
                    }
                    state.lastShortsId = null;
                    state.lastProcessedShortsId = null;
                }
                Layout.updateLayout();
            }
        }

        return { handleNavigationChange };
    })();

    // Global Event Listeners and Initial Calls
    document.addEventListener('wheel', function (event) {
        if (!Core.utils.checkIfShortsPage()) return;
        const now = Date.now();
        if (event.deltaY !== 0 && now - Core.state.lastWheelEvent > Core.state.debounceDelay) {
            Core.state.lastWheelEvent = now;
            if (Core.utils.checkIfShortsPage()) {
                const currentShortsId = Core.utils.getShortsId();
                if (currentShortsId !== Core.state.observerShortsId) {
                    if (Core.state.observer) {
                        Core.state.observer.disconnect();
                        Core.state.observer = null;
                        Core.state.observerShortsId = null;
                    }
                    Core.state.lastShortsId = currentShortsId;
                }
            }
        }
    });

    document.addEventListener('keydown', function (event) {
        if (!Core.utils.checkIfShortsPage()) return;
        const now = Date.now();
        if ((event.keyCode === 38 || event.keyCode === 40) && now - Core.state.lastKeyEvent > Core.state.debounceDelay) {
            Core.state.lastKeyEvent = now;
            if (Core.utils.checkIfShortsPage()) {
                const currentShortsId = Core.utils.getShortsId();
                if (currentShortsId !== Core.state.observerShortsId) {
                    if (Core.state.observer) {
                        Core.state.observer.disconnect();
                        Core.state.observer = null;
                        Core.state.observerShortsId = null;
                    }
                    Core.state.lastShortsId = currentShortsId;
                }
            }
        }
    });

    window.addEventListener('scroll', Core.utils.debounce(Watch.handleScroll, 150));

    window.addEventListener('resize', Core.utils.throttle(() => {
        Layout.updateLayout();
        if (Core.utils.checkIfWatchPage() && !Core.state.isScrollButtonCreated) {
            Watch.createScrollToTopBtn();
        }
    }, 30));

    window.addEventListener('load', () => {
        Layout.updateLayout();
        Navigation.handleNavigationChange();
    });

    window.addEventListener('popstate', () => {
        Layout.updateLayout();
        Navigation.handleNavigationChange();
    });

    window.addEventListener('DOMContentLoaded', () => {
        Navigation.handleNavigationChange();
    });

    const titleObserver = new MutationObserver(Core.utils.debounce(() => {
        Navigation.handleNavigationChange();
    }, 100));
    titleObserver.observe(document.querySelector('title'), { childList: true });

    Layout.updateLayout();
    Navigation.handleNavigationChange();
})();
