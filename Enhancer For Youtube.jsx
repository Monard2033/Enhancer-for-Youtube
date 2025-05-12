(function () {
    // Global variables for state tracking
    let isClicked = true;
    let isSkippingEnabled = true;
    let hasNavigationButtonBeenFetched = false;
    let navigationButtonDown = null;

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
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    }

    // Inject global styles once
    const styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
    styleElement.textContent = `
        :root {
            --dark-fl: brightness(0.8);
            --dark-fl-hover: brightness(0.9);
            --light-fl: brightness(0.9);
            --light-fl-hover: brightness(0.8);
            --dark-bt: rgba(39, 39, 39 ,1);
            --dark-bt-hover: rgba(82, 82, 82, 1);
            --light-bt: rgba(242, 242, 242, 0.1);
            --light-bt-hover: rgba(229, 229, 229, 1);
        }
        #start.ytd-masthead {
            height: 50px;
            border-radius: 30px;
            display: flex;
            position: static;
            margin: 0 10%;
            border: 1px solid red;
            backdrop-filter: var(--light-fl);
        }
        .ytSearchboxComponentHost {
            height: 53px;
            margin: 0 12px 0 0;
        }
        .ytSearchboxComponentInputBox {
            margin-left: 0;
            margin-top: 0;
            border: 1px solid red;
            box-shadow: none;
            height: 50px;
            background: transparent;
            backdrop-filter: var(--light-fl);
            display: flex;
            justify-content: space-around;
        }
        #center.ytd-masthead {
            margin: auto;
        }
        #container.ytd-searchbox {
            margin-left: 0;
            border: 1px solid red;
            box-shadow: none;
            background: transparent;
            backdrop-filter: var(--light-fl);
            display: flex;
            opacity: 0;
            justify-content: space-around;
        }
        #end.ytd-masthead {
            height: 50px;
            min-width: 10px;
            border-radius: 30px;
            position: relative;
            margin: 0 10%;
            border: 1px solid red;
            backdrop-filter: var(--light-fl);
        }
        ytd-watch-flexy[flexy] #secondary.ytd-watch-flexy {
            min-width: 450px;
            padding-right: 0px;
        }
        .ytSearchboxComponentSearchButton {
            background: transparent;
            border: 1px solid red;
            backdrop-filter: var(--light-fl);
            height: 52px;
        }
        .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text {
            backdrop-filter: var(--light-fl);
            color: white;
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
        #sections.ytd-guide-renderer > *.ytd-guide-renderer:first-child {
            padding: 0px;
        }
        #voice-search-button.ytd-masthead {
            margin-left: 0;
            background: transparent;
            backdrop-filter: var(--light-fl);
        }
        #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
            display: none;
        }
        .yt-spec-touch-feedback-shape__fill {
            background-color: black;
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
        .yt-spec-touch-feedback-shape {
            border: 1px solid red;
        }
        @media (prefers-color-scheme: dark) {
        #start.ytd-masthead, .ytSearchboxComponentInputBox, #container.ytd-searchbox, #end.ytd-masthead,
        .ytSearchboxComponentSearchButton, .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text,
        #voice-search-button.ytd-masthead {
            backdrop-filter: var(--dark-fl) !important;
            }
        #start.ytd-masthead:hover, .ytSearchboxComponentInputBox:hover, #container.ytd-searchbox:hover,
        #end.ytd-masthead:hover, .ytSearchboxComponentSearchButton:hover,
        .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text:hover,
        #voice-search-button.ytd-masthead:hover {
            backdrop-filter: var(--dark-fl-hover) !important;
            }
        }
        #scroll-top-container {
            position: fixed;
            bottom: 20px;
            width: 55px;
            height: 55px;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1000;
        }
        .scroll-top-btn {
            pointer-events: all;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: transparent;
            cursor: pointer;
            opacity: 1;
            border: 1px solid red;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--light-bt);
        }
        .scroll-top-btn:hover {
            background-color: var(--light-bt-hover);
            transition: background-color 0.2s ease;
        }
        @media (prefers-color-scheme: dark) {
            .scroll-top-btn {
                background-color: transparent;
                background-color: var(--dark-bt);
            }
            .scroll-top-btn:hover {
                border-color: var(--dark-bt-hover);
            }
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
            width: 100%;
            height: 100%;
            margin: 0;
            border-radius: 50%;
            background-color: var(--light-bt);
            cursor: pointer;
            transition: background-color 0.2s ease;
            z-index: 1000;
            opacity: 1;
            border: 1px solid red;
            justify-content: center;
            align-items: center;
        }
        .skip-toggle-btn:hover {
            background-color: var(--light-bt-hover);
        }
        @media (prefers-color-scheme: dark) {
            .skip-toggle-btn {
                background-color: var(--dark-bt);
            }
            .skip-toggle-btn:hover {
                background-color: var(--dark-bt-hover);
            }
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

            pathElement.setAttribute(
                'd',
                'M19.884 10.114a1.25 1.25 0 01-1.768 1.768L13.25 7.016v12.982a1.25 1.25 0 11-2.5 0V7.016l-4.866 4.866a1.25 1.25 0 11-1.768-1.768L12 2.23l7.884 7.884Z'
            );

            svgElement.appendChild(pathElement);
            divElement.classList.add('scroll-up-btn');
            divElement.appendChild(svgElement);
            scrollToTopBtn.appendChild(divElement);
            scrollTopContainer.appendChild(scrollToTopBtn);
            document.body.appendChild(scrollTopContainer);

            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        const viewportWidth = window.innerWidth;
        const buttonPosition = window.screen.width === 2560 && window.screen.height === 1440
            ? viewportWidth * 0.73
            : viewportWidth * 0.7;
        scrollTopContainer.style.left = `${buttonPosition}px`;

        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        scrollTopContainer.style.opacity = (scrollPosition > 1000 && checkIfWatchPage()) ? '1' : '0';
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
            container.style.opacity = window.scrollY !== 0 ? '0.6' : '1';
            const centerFlexBasis = windowWidth <= 658 ? 200 :
                windowWidth >= 1750 ? 550 :
                200 + ((windowWidth - 658) / (1750 - 658)) * (550 - 200);
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
                position = viewportWidth * 0.45 - 10;
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

    // Wait for DOM element using MutationObserver
    function waitForDOMElement(selector, callback, options = {}) {
        const { timeout = 15000 } = options;
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const target = document.querySelector(selector);
            if (target) {
                obs.disconnect();
                callback(target);
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        setTimeout(() => observer.disconnect(), timeout);
    }

    // Restart observer
    function restartObserver() {
        let isRestartScheduled = false;
        if (isRestartScheduled) return;
        isRestartScheduled = true;
        setTimeout(() => {
            isRestartScheduled = false;
            SkippingShortsMechanism();
        }, 1000);
    }

    // Handle skipping shorts (unchanged as per request)
    function SkippingShortsMechanism() {
        if (checkIfShortsPage() && isClicked) {
            isClicked = false;
            let observer = null;
            if (!hasNavigationButtonBeenFetched) {
                waitForDOMElement(
                    '#navigation-button-down > ytd-button-renderer > yt-button-shape > button',
                    button => {
                        navigationButtonDown = button;
                        hasNavigationButtonBeenFetched = true;

                        navigationButtonDown.addEventListener(
                            'click',
                            function observerReinitHandler(e) {
                                if (!e.isTrusted) return;
                                navigationButtonDown.removeEventListener(
                                    'click',
                                    observerReinitHandler
                                );
                                if (observer) {
                                    observer.disconnect();
                                }
                                restartObserver();
                            }
                        );
                    },
                    { timeout: 15000 }
                );
            }
            waitForDOMElement(
                '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div',
                progressBarElement => {
                    if (observer) {
                        observer.disconnect();
                    }
                    let maxWidth = 0;

                    observer = new MutationObserver(mutations => {
                        mutations.forEach(mutation => {
                            if (
                                mutation.attributeName === 'aria-valuetext' &&
                                isSkippingEnabled
                            ) {
                                let ariaValueText =
                                    progressBarElement.getAttribute('aria-valuetext');
                                let widthNumber = parseFloat(ariaValueText.replace('%', ''));
                                if (widthNumber >= maxWidth) {
                                    maxWidth = widthNumber;
                                } else if (widthNumber < maxWidth - 10 && !isClicked) {
                                    dispatchSpacebarEvent();
                                    navigationButtonDown.click();
                                    isClicked = true;
                                    observer.disconnect();
                                    restartObserver();
                                    maxWidth = 0;
                                }
                            }
                        });
                    });
                    observer.observe(progressBarElement, {
                        attributes: true,
                        attributeFilter: ['aria-valuetext'],
                    });
                },
                { timeout: 15000 }
            );
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
                autoskipContainer.style.width = '58px';
                autoskipContainer.style.height = '58px';

                toggleButton = document.createElement('button');
                toggleButton.id = 'shorts-skip-toggle';
                toggleButton.className = 'skip-toggle-btn';
                toggleButton.title = 'Toggle Video Skipping (ON = Skip, OFF = No Skip)';

                const icon = document.createElement('span');
                icon.className = 'toggle-icon';
                icon.textContent = 'SKIP';
                toggleButton.appendChild(icon);

                autoskipContainer.appendChild(toggleButton);

                waitForDOMElement(
                    '.navigation-container.style-scope.ytd-shorts',
                    (navigationContainer) => {
                        waitForDOMElement(
                            '#navigation-button-up',
                            (navigationButtonUp) => {
                                navigationContainer.insertBefore(autoskipContainer, navigationButtonUp);
                            },
                            { timeout: 15000 }
                        );
                    },
                    { timeout: 15000 }
                );

                toggleButton.addEventListener('click', () => {
                    isSkippingEnabled = !isSkippingEnabled;
                    icon.textContent = isSkippingEnabled ? 'SKIP' : 'NO SKIP';

                    if (isSkippingEnabled) {
                        const progressBarElement = document.querySelector(
                            '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div'
                        );
                        if (progressBarElement) {
                            let observer = new MutationObserver(mutations => {
                                mutations.forEach(mutation => {
                                    if (
                                        mutation.attributeName === 'aria-valuetext' &&
                                        isSkippingEnabled
                                    ) {
                                        let ariaValueText =
                                            progressBarElement.getAttribute('aria-valuetext');
                                        let widthNumber = parseFloat(ariaValueText.replace('%', ''));
                                        if (widthNumber >= maxWidth) {
                                            maxWidth = widthNumber;
                                        } else if (widthNumber < maxWidth - 10 && !isClicked) {
                                            dispatchSpacebarEvent();
                                            navigationButtonDown.click();
                                            isClicked = true;
                                            observer.disconnect();
                                            restartObserver();
                                            maxWidth = 0;
                                        }
                                    }
                                });
                            });
                            observer.observe(progressBarElement, {
                                attributes: true,
                                attributeFilter: ['aria-valuetext'],
                            });
                        }
                    } else {
                        let observer = null;
                        if (observer) {
                            observer.disconnect();
                        }
                    }
                });
            }
        }
    }

    // Helper functions
    function checkIfWatchPage() {
        return window.location.href.includes('youtube.com/watch');
    }

    function checkIfShortsPage() {
        return window.location.href.includes('youtube.com/shorts');
    }

    function dispatchSpacebarEvent() {
        const spacebarEvent = new KeyboardEvent('keydown', {
            key: ' ',
            code: 'Space',
            keyCode: 32,
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(spacebarEvent);
    }

    function removeToggleButton() {
        const toggleButton = document.getElementById('shorts-skip-toggle');
        if (toggleButton && toggleButton.parentNode) {
            toggleButton.dispatchEvent(new Event('remove'));
            toggleButton.parentNode.removeChild(toggleButton);
        }
    }

    // URL change detection with MutationObserver fallback
    function observeUrlChanges() {
        let lastUrl = null;
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            originalPushState.apply(this, args);
            handleUrlChange();
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function (...args) {
            originalReplaceState.apply(this, args);
            handleUrlChange();
        };

        window.addEventListener('popstate', handleUrlChange);

        const urlObserver = new MutationObserver(() => {
            handleUrlChange();
        });
        urlObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        function handleUrlChange() {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                if (currentUrl.includes('youtube.com/shorts')) {
                    SkippingShortsMechanism();
                    createShortsSkipBtn();
                } else {
                    removeToggleButton();
                    let observer = null;
                    if (observer) {
                        observer.disconnect();
                    }
                }
            }
        }

        handleUrlChange();
    }

    // Event listeners with debouncing
    let lastWheelEvent = 0;
    let lastKeyEvent = 0;
    const debounceDelay = 1000;

    document.addEventListener('wheel', function (event) {
        const now = Date.now();
        if (event.deltaY !== 0 && now - lastWheelEvent > debounceDelay) {
            lastWheelEvent = now;
            let observer = null;
            if (observer) {
                observer.disconnect();
            }
            restartObserver();
        }
    });

    document.addEventListener('keydown', function (event) {
        const now = Date.now();
        if ((event.keyCode === 38 || event.keyCode === 40) && now - lastKeyEvent > debounceDelay) {
            lastKeyEvent = now;
            let observer = null;
            if (observer) {
                observer.disconnect();
            }
            restartObserver();
        }
    });

    window.addEventListener('scroll', () => {
        updateLayout();
        createScrollToTopBtn();
    });

    window.addEventListener('resize', throttle(() => {
        updateLayout();
        createScrollToTopBtn();
    }, 30));

    window.addEventListener('load', () => {
        updateLayout();
        createScrollToTopBtn();
        observeUrlChanges();
    });

    window.addEventListener('popstate', () => {
        updateLayout();
        createScrollToTopBtn();
    });

    window.addEventListener('DOMContentLoaded', () => {
        observeUrlChanges();
    });

    // Initial calls
    updateLayout();
    createScrollToTopBtn();
    observeUrlChanges();
})();
