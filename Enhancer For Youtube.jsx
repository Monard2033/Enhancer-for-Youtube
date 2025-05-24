(function () {
    // Global variables for state tracking
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

    // Throttle utility
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

    // Debounce utility
    function debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fn(...args);
            }, delay);
        };
    }

    // Inject global styles once
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
            .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text,
            #voice-search-button.ytd-masthead {
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

    // Create and position the scroll-to-top button
    function createScrollToTopBtn() {
        let scrollTopContainer = document.getElementById('scroll-top-container');
        if (!scrollTopContainer) {
            scrollTopContainer = document.createElement('div');
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
            isScrollButtonCreated = true;

            // Position the button
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

            // Add click event listener
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
            });

            // Update position on resize
            window.addEventListener('resize', throttle(() => {
                if (checkIfWatchPage()) {
                    updatePosition();
                }
            }, 30));
        }
    }

    // Toggle button for YouTube Shorts
    function createShortsSkipBtn() {
        if (checkIfShortsPage()) {
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
                icon.textContent = 'SKIP';
                toggleButton.appendChild(icon);

                const tooltip = document.createElement('div');
                tooltip.className = 'skip-tooltip';
                tooltip.textContent = 'Toggle Video Skipping';
                tooltip.setAttribute('role', 'tooltip');
                tooltip.setAttribute('aria-label', 'Toggle Video Skipping');

                autoskipContainer.appendChild(toggleButton);
                autoskipContainer.appendChild(tooltip);

                waitForDOMElement(
                    '.navigation-container.style-scope.ytd-shorts',
                    navigationContainer => {
                        waitForDOMElement(
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
                    isSkippingEnabled = !isSkippingEnabled;
                    icon.textContent = isSkippingEnabled ? 'SKIP' : 'NO SKIP';

                    if (isSkippingEnabled) {
                        const progressBarElement = document.querySelector('#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div');
                        if (progressBarElement && observer) {
                            observer.observe(progressBarElement, {
                                attributes: true,
                                attributeFilter: ['aria-valuetext'],
                            });
                        }
                    } else if (!isSkippingEnabled && observer) {
                        observer.disconnect();
                    }
                });
            }
        }
    }

    // Combined layout update
    function updateLayout() {
        const masthead = document.querySelector('#masthead-container.ytd-app');
        const center = document.querySelector('#center.ytd-masthead');
        const container = document.querySelector('#container.ytd-masthead');
        const primaryElement = document.querySelector('#primary');
        const columnsElement = document.querySelector('#columns');

        if (masthead && center && container) {
            const windowWidth = window.innerWidth;
            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
            container.style.opacity = scrollPosition === 0 ? '1' : '0.6';
            let centerFlexBasis = 200 + (windowWidth - 1035) * 0.3955;
            centerFlexBasis = Math.max(200, Math.min(550, centerFlexBasis));
            center.style.flex = `0 0 ${centerFlexBasis}px`;
        }

        if (primaryElement && columnsElement) {
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

    // Updated waitForDOMElement with forced delay
    function waitForDOMElement(selector, callback, options = {}) {
        const { interval = 100, timeout = 10000, delay = 0 } = options;
        if (checkIfShortsPage()) {
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
    }

    // Handle skipping shorts with Shorts ID-based observer
    function SkippingShortsMechanism() {
        if (checkIfShortsPage()) {
            const currentShortsId = getShortsId();
            if (currentShortsId === lastProcessedShortsId && observer && currentShortsId === observerShortsId) {
                return;
            }
            isClicked = false;
            lastProcessedShortsId = currentShortsId;

            // Disconnect existing observer
            if (observer) {
                observer.disconnect();
                observer = null;
                observerShortsId = null;
            }

            if (!hasNavigationButtonBeenFetched) {
                waitForDOMElement(
                    '#navigation-button-down > ytd-button-renderer > yt-button-shape > button',
                    button => {
                        navigationButtonDown = button;
                        hasNavigationButtonBeenFetched = true;

                        navigationButtonDown.addEventListener('click', function observerReinitHandler(e) {
                            if (!e.isTrusted) {
                                return;
                            }
                            navigationButtonDown.removeEventListener('click', observerReinitHandler);
                            if (observer) {
                                observer.disconnect();
                                observer = null;
                                observerShortsId = null;
                            }
                        });
                    },
                    { interval: 100, timeout: 10000 }
                );
            }

            waitForDOMElement(
                '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div',
                progressBarElement => {
                    let maxWidth = 0;
                    let previousWidth = 0;

                    observer = new MutationObserver(mutations => {
                        mutations.forEach(mutation => {
                            if (mutation.attributeName === 'aria-valuetext' && isSkippingEnabled) {
                                let ariaValueText = progressBarElement.getAttribute('aria-valuetext');
                                let widthNumber = parseFloat(ariaValueText.replace('%', ''));
                                if (widthNumber >= maxWidth) {
                                    maxWidth = widthNumber;
                                    previousWidth = widthNumber;
                                } else if (!isClicked) {
                                    if ((widthNumber === 0 || widthNumber === 1) && previousWidth >= 97) {
                                        pauseVideo();
                                        navigationButtonDown.click();
                                        isClicked = true;
                                        observer.disconnect();
                                        observer = null;
                                        observerShortsId = null;
                                        maxWidth = 0;
                                        previousWidth = 0;
                                    } else {
                                        previousWidth = widthNumber;
                                    }
                                }
                            }
                        });
                    });
                    observer.observe(progressBarElement, {
                        attributes: true,
                        attributeFilter: ['aria-valuetext'],
                    });
                    observerShortsId = currentShortsId;
                },
                { interval: 100, timeout: 10000, delay: 300 }
            );
        }
    }

    // Helper functions
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

    function removeToggleButton() {
        const toggleButton = document.getElementById('shorts-skip-toggle');
        if (toggleButton && toggleButton.parentNode) {
            toggleButton.dispatchEvent(new Event('remove'));
            toggleButton.parentNode.removeChild(toggleButton);
        }
    }

    function removeScrollButton() {
        const scrollTopContainer = document.getElementById('scroll-top-container');
        if (scrollTopContainer) {
            scrollTopContainer.remove();
            isScrollButtonCreated = false;
        }
    }

    // Consolidated scroll handling
    function handleScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        updateLayout();
        const scrollTopContainer = document.getElementById('scroll-top-container');
        if (scrollTopContainer) {
            scrollTopContainer.style.opacity = (scrollPosition > 1000 && checkIfWatchPage()) ? '1' : '0';
        }
        if (checkIfWatchPage() && !isScrollButtonCreated) {
            createScrollToTopBtn();
        }
    }

    // Handle navigation changes with Shorts ID check
    function handleNavigationChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            const currentShortsId = getShortsId();
            if (currentUrl.includes('youtube.com/shorts')) {
                if (isScrollButtonCreated) {
                    removeScrollButton();
                }
                if (currentShortsId !== lastShortsId || currentShortsId !== observerShortsId || !observer) {
                    lastShortsId = currentShortsId;
                    if (observer && currentShortsId !== observerShortsId) {
                        observer.disconnect();
                        observer = null;
                        observerShortsId = null;
                    }
                    SkippingShortsMechanism();
                }
                createShortsSkipBtn();
            } else if (currentUrl.includes('youtube.com/watch')) {
                removeToggleButton();
                if (observer) {
                    observer.disconnect();
                    observer = null;
                    observerShortsId = null;
                }
                lastShortsId = null;
                lastProcessedShortsId = null;
                if (!isScrollButtonCreated) {
                    createScrollToTopBtn();
                }
            } else {
                removeToggleButton();
                if (isScrollButtonCreated) {
                    removeScrollButton();
                }
                if (observer) {
                    observer.disconnect();
                    observer = null;
                    observerShortsId = null;
                }
                lastShortsId = null;
                lastProcessedShortsId = null;
            }
            updateLayout();
        }
    }

    // Event listeners
    let lastWheelEvent = 0;
    let lastKeyEvent = 0;
    const debounceDelay = 1000;

    document.addEventListener('wheel', function (event) {
        const now = Date.now();
        if (event.deltaY !== 0 && now - lastWheelEvent > debounceDelay) {
            lastWheelEvent = now;
            if (checkIfShortsPage()) {
                const currentShortsId = getShortsId();
                if (currentShortsId !== observerShortsId) {
                    if (observer) {
                        observer.disconnect();
                        observer = null;
                        observerShortsId = null;
                    }
                    lastShortsId = currentShortsId;
                }
            }
        }
    });

    document.addEventListener('keydown', function (event) {
        const now = Date.now();
        if ((event.keyCode === 38 || event.keyCode === 40) && now - lastKeyEvent > debounceDelay) {
            lastKeyEvent = now;
            if (checkIfShortsPage()) {
                const currentShortsId = getShortsId();
                if (currentShortsId !== observerShortsId) {
                    if (observer) {
                        observer.disconnect();
                        observer = null;
                        observerShortsId = null;
                    }
                    lastShortsId = currentShortsId;
                }
            }
        }
    });

    window.addEventListener('scroll', debounce(handleScroll, 100));

    window.addEventListener('resize', throttle(() => {
        updateLayout();
        if (checkIfWatchPage() && !isScrollButtonCreated) {
            createScrollToTopBtn();
        }
    }, 30));

    window.addEventListener('load', () => {
        updateLayout();
        handleNavigationChange();
    });

    window.addEventListener('popstate', () => {
        updateLayout();
        handleNavigationChange();
    });

    window.addEventListener('DOMContentLoaded', () => {
        handleNavigationChange();
    });

    // Observe title changes for SPA navigation
    const titleObserver = new MutationObserver(() => {
        handleNavigationChange();
    });
    titleObserver.observe(document.querySelector('title'), { childList: true });

    updateLayout();
    handleNavigationChange();
})();
