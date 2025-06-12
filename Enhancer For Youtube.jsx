/**
 * ==UserScript==
 * @name         YouTube Enhancer Ultimate
 * @namespace    http://tampermonkey.net/
 * @version      1.0
 * @description  Enhances YouTube watch and shorts pages with custom layout, scroll-to-top, and auto-skip features.
 * @author       You
 * @match        https://www.youtube.com/*
 * @grant        none
 * ==/UserScript==
 */

(function () {
    // Core Module: Utility functions and shared state
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
                timeoutId = setTimeout(() => fn(...args), delay);
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

        function waitForAllDOMElements(selectors, timeout = 15000, retryCount = 0) {
            return new Promise((resolve, reject) => {
                const results = {};
                let completed = 0;
                selectors.forEach(selector => {
                    waitForDOMElement(
                        selector,
                        element => {
                            results[selector] = { element, foundAt: performance.now() };
                            completed++;
                            if (completed === selectors.length) {
                                resolve(results);
                            }
                        },
                        { interval: 100, timeout, delay: lastMaxLoadTime }
                    );
                });
                setTimeout(() => {
                    if (completed < selectors.length) {
                        if (retryCount < 1) {
                            setTimeout(() => {
                                waitForAllDOMElements(selectors, timeout, retryCount + 1)
                                    .then(resolve)
                                    .catch(reject);
                            }, 5000);
                        } else {
                            reject(new Error('Timeout waiting for all DOM elements after retries'));
                        }
                    }
                }, timeout);
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
            utils: { throttle, debounce, waitForDOMElement, waitForAllDOMElements, checkIfWatchPage, checkIfShortsPage, getShortsId, pauseVideo }
        };
    })();

    // Watch Module
    const WatchModule = (function () {
        let cacheInitialized = false;
        const cache = {
            center: null,
            container: null,
            masthead: null,
            primary: null,
            columns: null
        };

        async function initializeCache() {
            const selectors = [
                '#center.ytd-masthead',
                '#container.ytd-masthead',
                '#masthead-container.ytd-app',
                '#primary',
                '#columns'
            ];

            const results = await Core.utils.waitForAllDOMElements(selectors);
            cache.center = results['#center.ytd-masthead']?.element;
            cache.container = results['#container.ytd-masthead']?.element;
            cache.masthead = results['#masthead-container.ytd-app']?.element;
            cache.primary = results['#primary']?.element;
            cache.columns = results['#columns']?.element;

            if (cache.center) {
                const windowWidth = window.innerWidth;
                let centerFlexBasis = 200 + (windowWidth - 1035) * 0.3955;
                centerFlexBasis = Math.max(200, Math.min(550, centerFlexBasis));
                cache.center.style.flex = `0 0 ${centerFlexBasis}px`;
            }

            cacheInitialized = true;
        }

        function createScrollToTopBtn() {
            if (!Core.state.isScrollButtonCreated && Core.utils.checkIfWatchPage()) {
                const scrollTopContainer = document.createElement('div');
                scrollTopContainer.id = 'scroll-top-container';
                scrollTopContainer.className = 'navigation-button style-scope ytd-watch-flexy';
                const scrollToTopBtn = document.createElement('button');
                scrollToTopBtn.id = 'scroll-to-top';
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
                pathElement.setAttribute('d', 'M19.884 10.114a1.25 1.25 0 01-1.768 1.768L13.25 7.016v12.982a1.25 1.25 0 11-2.5 0V7.016l-4.866 4.866a1.25 1.25 0 11-1.768-1.768L12 2.23l7.884 7.884Z');
                svgElement.appendChild(pathElement);
                divElement.classList.add('scroll-up-btn');
                divElement.appendChild(svgElement);
                scrollToTopBtn.appendChild(divElement);
                scrollTopContainer.appendChild(scrollToTopBtn);
                document.body.appendChild(scrollTopContainer);

                const updatePosition = () => {
                    const viewportWidth = window.innerWidth;
                    let buttonPosition = 0.904 * (viewportWidth - 1035) + 544;
                    buttonPosition = Math.max(544, Math.min(1344, buttonPosition));
                    scrollTopContainer.style.left = `${buttonPosition}px`;
                };
                updatePosition();

                scrollToTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                window.addEventListener('resize', Core.utils.throttle(updatePosition, 30));
                Core.state.isScrollButtonCreated = true;
            }

            const handleScrollVisibility = () => {
                const scrollTopContainer = document.getElementById('scroll-top-container');
                const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
                if (scrollTopContainer) {
                    scrollTopContainer.style.opacity = (scrollPosition > 1000 && Core.utils.checkIfWatchPage()) ? '1' : '0';
                }
            };

            window.removeEventListener('scroll', handleScrollVisibility);
            window.addEventListener('scroll', handleScrollVisibility);
            handleScrollVisibility();
        }

        function getVideoId(url) {
            try {
                return new URL(url).searchParams.get('v') || null;
            } catch {
                return null;
            }
        }

        return {
            initialize: initializeCache,
            updateScrollButton: createScrollToTopBtn,
            isWatchPage: Core.utils.checkIfWatchPage,
            getVideoId,
            getCache: () => cache,
            isInitialized: () => cacheInitialized,
            resetCache: () => {
                cacheInitialized = false;
                Object.keys(cache).forEach(key => cache[key] = null);
            }
        };
    })();

    // Shorts Module
    const ShortsModule = (function () {
        function createShortsSkipBtn() {
            if (Core.utils.checkIfShortsPage()) {
                let toggleButton = document.getElementById('shorts-skip-toggle');
                if (!toggleButton) {
                    const autoskipContainer = document.createElement('div');
                    autoskipContainer.className = 'navigation-button style-scope ytd-shorts';
                    autoskipContainer.id = 'shorts-autoskip';

                    toggleButton = document.createElement('button');
                    toggleButton.id = 'shorts-skip-toggle';
                    toggleButton.className = 'skip-toggle-btn';

                    const touchFeedbackShape = document.createElement('div');
                    touchFeedbackShape.className = 'yt-spec-touch-feedback-shape';
                    toggleButton.appendChild(touchFeedbackShape);

                    const icon = document.createElement('span');
                    icon.className = 'toggle-icon';
                    icon.textContent = Core.state.isSkippingEnabled ? 'SKIP' : 'NO SKIP';
                    toggleButton.appendChild(icon);

                    const tooltip = document.createElement('div');
                    tooltip.className = 'skip-tooltip';
                    tooltip.textContent = 'Toggle Video Skipping';
                    tooltip.setAttribute('role', 'tooltip');
                    tooltip.setAttribute('aria-label', 'Toggle Video Skipping');

                    autoskipContainer.appendChild(toggleButton);
                    autoskipContainer.appendChild(tooltip);

                    Core.utils.waitForDOMElement(
                        '.navigation-container.style-scope.ytd-shorts',
                        navigationContainer => {
                            Core.utils.waitForDOMElement(
                                '#navigation-button-up',
                                navigationButtonUp => {
                                    navigationContainer.insertBefore(autoskipContainer, navigationButtonUp);
                                },
                                { interval: 100, timeout: 10000 }
                            );
                        },
                        { interval: 100, timeout: 10000 }
                    );

                    toggleButton.addEventListener('click', () => {
                        Core.state.isSkippingEnabled = !Core.state.isSkippingEnabled;
                        icon.textContent = Core.state.isSkippingEnabled ? 'SKIP' : 'NO SKIP';
                        if (Core.state.isSkippingEnabled) {
                            const progressBarElement = document.querySelector('#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div');
                            if (progressBarElement && Core.state.observer) {
                                Core.state.observer.observe(progressBarElement, { attributes: true, attributeFilter: ['aria-valuetext'] });
                            }
                        } else if (!Core.state.isSkippingEnabled && Core.state.observer) {
                            Core.state.observer.disconnect();
                        }
                    });
                }
            }
        }

        function SkippingShortsMechanism() {
            if (Core.utils.checkIfShortsPage()) {
                Core.state.isClicked = false;
                if (!Core.state.hasNavigationButtonBeenFetched) {
                    Core.utils.waitForDOMElement(
                        '#navigation-button-down > ytd-button-renderer > yt-button-shape > button',
                        button => {
                            Core.state.navigationButtonDown = button;
                            Core.state.hasNavigationButtonBeenFetched = true;
                            Core.state.navigationButtonDown.addEventListener('click', function observerReinitHandler(e) {
                                if (!e.isTrusted) return;
                                Core.state.navigationButtonDown.removeEventListener('click', observerReinitHandler);
                                if (Core.state.observer) Core.state.observer.disconnect();
                                restartObserver();
                            });
                        },
                        { interval: 100, timeout: 10000 }
                    );
                }
                Core.utils.waitForDOMElement(
                    '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div',
                    progressBarElement => {
                        if (Core.state.observer) Core.state.observer.disconnect();
                        let maxWidth = 0;
                        let previousWidth = 0;

                        Core.state.observer = new MutationObserver(mutations => {
                            mutations.forEach(mutation => {
                                if (mutation.attributeName === 'aria-valuetext' && Core.state.isSkippingEnabled) {
                                    let ariaValueText = progressBarElement.getAttribute('aria-valuetext');
                                    let widthNumber = parseFloat(ariaValueText.replace('%', ''));
                                    if (widthNumber >= maxWidth) {
                                        maxWidth = widthNumber;
                                        previousWidth = widthNumber;
                                    } else if (!Core.state.isClicked) {
                                        if ((widthNumber === 0 || widthNumber === 1) && previousWidth >= 97) {
                                            Core.utils.pauseVideo();
                                            Core.state.navigationButtonDown.click();
                                            Core.state.isClicked = true;
                                            Core.state.observer.disconnect();
                                            restartObserver();
                                            maxWidth = 0;
                                            previousWidth = 0;
                                        } else {
                                            previousWidth = widthNumber;
                                        }
                                    }
                                }
                            });
                        });
                        Core.state.observer.observe(progressBarElement, { attributes: true, attributeFilter: ['aria-valuetext'] });
                    },
                    { interval: 100, timeout: 10000 }
                );
            }
        }

        function restartObserver() {
            if (isRestartScheduled) return;
            isRestartScheduled = true;
            setTimeout(() => {
                isRestartScheduled = false;
                SkippingShortsMechanism();
            }, 1000);
        }

        let isRestartScheduled = false;

        function removeToggleButton() {
            const toggleButton = document.getElementById('shorts-skip-toggle');
            if (toggleButton && toggleButton.parentNode) {
                toggleButton.dispatchEvent(new Event('remove'));
                toggleButton.parentNode.removeChild(toggleButton);
            }
        }

        return {
            initialize: () => {
                SkippingShortsMechanism();
                createShortsSkipBtn();
            },
            removeToggle: removeToggleButton,
            isShortsPage: Core.utils.checkIfShortsPage
        };
    })();

    // Layout Module
    const LayoutModule = (function () {
        function initialize() {
            const styleElement = document.createElement('style');
            document.head.appendChild(styleElement);
            styleElement.textContent = `
                :root {
                    --dark-bt: rgb(200 200 200 / 15%);
                    --dark-bt-hover: rgba(255 255 255 /25%);
                    --dark-bt-tp: rgb(255 255 255/ 1%);
                    --light-bt: rgb(0 0 0 / 7%);
                    --light-bt-hover: rgb(0 0 0 /15%);
                    --light-bt-tp: rgb(255 255 255/ 1%);
                }
                #start.ytd-masthead {
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
                    margin-left: 0;
                    margin-top: 0;
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
                }
                #container.ytd-masthead {
                    margin-left: 0;
                    box-shadow: none;
                    background: transparent;
                    display: flex;
                    opacity: 0;
                    z-index: 1000;
                    justify-content: space-around;
                }
                #end.ytd-masthead {
                    height: 50px;
                    min-width: 10px;
                    border-radius: 30px;
                    position: relative;
                    margin: 0 10%;
                    border: 1px dotted red;
                    background-color: var(--light-bt);
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
                }
                yt-chip-cloud-chip-renderer[chip-style=STYLE_DEFAULT][selected] #chip-container.yt-chip-cloud-chip-renderer {
                    background-color: var(--yt-spec-badge-chip-background) !important;
                    color: var(--yt-spec-text-primary) !important;
                }
                .yt-spec-touch-feedback-shape {
                    border: 1px dotted red;
                    background-color: var(--light-bt) !important;
                }
                .yt-spec-touch-feedback-shape:hover {
                    background-color: var(--light-bt-hover) !important;
                }
                #contents > yt-lockup-view-model:nth-child(n) > div > yt-touch-feedback-shape > dsiv {
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
                    #voice-search-button.ytd-masthead {
                        background-color: var(--dark-bt) !important;
                    }
                    #contents > yt-lockup-view-model > div > yt-touch-feedback-shape > div {
                        background-color: var(--dark-bt-tp) !important;
                        border: none !important;
                    }
                    #contents > yt-lockup-view-model:nth-child(n) > div > yt-touch-feedback-shape > div {
                        background-color: var(--dark-bt-tp) !important;
                        border: none !important;
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
                    background-color: var(--light-bt);
                    cursor: pointer;
                    transition: background-color 0.2s ease, opacity 4s ease;
                    z-index: 1000;
                    opacity: 1;
                    border: 1px dotted red;
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
                    font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
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
        }

        function update() {
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            const cache = WatchModule.getCache();

            if (cache.masthead && cache.center && cache.container) {
                const windowWidth = window.innerWidth;
                cache.container.style.opacity = scrollPosition !== 0 ? '0.6' : '1';
                let centerFlexBasis = 200 + (windowWidth - 1035) * 0.3955;
                centerFlexBasis = Math.max(200, Math.min(550, centerFlexBasis));
                cache.center.style.flex = `0 0 ${centerFlexBasis}px`;
            }

            if (cache.primary && cache.columns) {
                const viewportWidth = window.innerWidth;
                let maxWidthValue, position;
                if (window.screen.width === 2560 && window.screen.height === 1440) {
                    maxWidthValue = 2300;
                    position = scrollPosition >= 4200 ? viewportWidth * 0.75 + 20 : viewportWidth * 0.55 - 30;
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

        return {
            initialize,
            update
        };
    })();

    // Main Script
    async function checkUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl === Core.state.lastUrl) {
            setTimeout(checkUrlChange, 200);
            return;
        }

        const isWatchPage = WatchModule.isWatchPage();
        const isShortsPage = ShortsModule.isShortsPage();
        const currentVideoId = WatchModule.getVideoId(currentUrl);
        const prevVideoId = Core.state.lastUrl ? WatchModule.getVideoId(Core.state.lastUrl) : null;

        if (isWatchPage && (!Core.state.lastUrl || !WatchModule.isWatchPage(Core.state.lastUrl))) {
            await WatchModule.initialize();
            LayoutModule.update();
            WatchModule.updateScrollButton();
        } else if (isWatchPage && currentVideoId !== prevVideoId && WatchModule.isInitialized()) {
            LayoutModule.update();
            WatchModule.updateScrollButton();
        } else if (isShortsPage) {
            ShortsModule.removeToggle();
            ShortsModule.initialize();
        } else {
            ShortsModule.removeToggle();
            WatchModule.resetCache();
        }

        Core.state.lastUrl = currentUrl;
        setTimeout(checkUrlChange, 200);
    }

    // Event listeners
    document.addEventListener('wheel', function (event) {
        const now = Date.now();
        if (event.deltaY !== 0 && now - Core.state.lastWheelEvent > Core.state.debounceDelay) {
            Core.state.lastWheelEvent = now;
            if (Core.state.observer) Core.state.observer.disconnect();
            ShortsModule.initialize();
        }
    });

    document.addEventListener('keydown', function (event) {
        const now = Date.now();
        if ((event.keyCode === 38 || event.keyCode === 40) && now - Core.state.lastKeyEvent > Core.state.debounceDelay) {
            Core.state.lastKeyEvent = now;
            if (Core.state.observer) Core.state.observer.disconnect();
            ShortsModule.initialize();
        }
    });

    window.addEventListener('scroll', Core.utils.debounce(() => {
        if (WatchModule.isWatchPage()) LayoutModule.update();
    }, 100));

    window.addEventListener('resize', Core.utils.throttle(() => {
        if (WatchModule.isWatchPage()) LayoutModule.update();
        WatchModule.updateScrollButton();
    }, 30));

    window.addEventListener('popstate', () => {
        if (WatchModule.isWatchPage()) LayoutModule.update();
        WatchModule.updateScrollButton();
    });

    // Initialize
    LayoutModule.initialize();
    checkUrlChange();
})();
