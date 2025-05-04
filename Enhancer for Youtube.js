var styleElement = document.createElement('style');
let buttonPosition;
let position;
let observer = null;
let isClicked = true;
let lastUrl = null;
let toggleButton = null;
let isSkippingEnabled = true;
let isRestartScheduled = false;
let hasNavigationButtonBeenFetched = false;

function createScrollToTopButton() {
    const existingButton = document.getElementById('scroll-to-top');
    if (existingButton) {
        existingButton.remove();
    }
    // Remove existing styles if present
    const existingStyles = document.querySelector('style[data-scroll-top-styles]');
    if (existingStyles) {
        existingStyles.remove();
    }
    const scrollToTopBtn = document.createElement('button');
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const divElement = document.createElement('div');
    const scrollTopBtnStyles = document.createElement('style');

    scrollToTopBtn.id = 'scroll-to-top';
    scrollToTopBtn.classList.add('scroll-top-btn');
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to Top');

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

    var viewportWidth = window.innerWidth;
    if (window.screen.width === 2560 && window.screen.height === 1440) {
        buttonPosition = viewportWidth * 0.73;
    } else {
        buttonPosition = viewportWidth * 0.7;
    }

    svgElement.appendChild(pathElement);
    divElement.classList.add('scroll-up-btn');
    divElement.appendChild(svgElement);
    scrollToTopBtn.appendChild(divElement);

    scrollTopBtnStyles.setAttribute('data-scroll-top-styles', 'true');
    scrollTopBtnStyles.textContent = `
    .scroll-top-btn {
      position: fixed;
      opacity: 0;
      bottom: 20px;
      left: ${buttonPosition}px;
      width: 55px;
      height: 55px;
      border: 1px solid red;
      padding: 0;
      border-radius: 50%;
      background-color: var(--light-bt);
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .scroll-top-btn:hover {
      background-color: var(--light-bt-hover);
    }
    @media (prefers-color-scheme: dark) {
      .scroll-top-btn {
        background-color: var(--dark-bt);
      }
      .scroll-top-btn:hover {
        background-color: var(--dark-bt-hover);
      }
    }
    .scroll-up-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
    }
  `;
    scrollToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    });
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollPosition > 1000 && checkIfWatchPage()) {
        scrollToTopBtn.style.opacity = '1';
    } else {
        scrollToTopBtn.style.opacity = '0';
    }
    document.head.appendChild(styleElement);
    document.head.appendChild(scrollTopBtnStyles);
    document.body.appendChild(scrollToTopBtn);
}
// Function to update page elements under the video-player
function updatePageElements() {
    var primaryElement = document.querySelector('#primary');
    var columnsElement = document.querySelector('#columns');
    var viewportWidth = window.innerWidth;
    if (columnsElement && primaryElement) {
        var maxWidthValue;
        if (window.screen.width === 2560 && window.screen.height === 1440) {
            maxWidthValue = 2300;
            if (window.pageYOffset >= 4200) {
                position = viewportWidth * 0.75 + 20;
            } else {
                position = viewportWidth * 0.55 - 30;
            }
        } else if (window.screen.width === 1920 && window.screen.height === 1080) {
            maxWidthValue = 1850;
            position = viewportWidth * 0.45 - 10;
        } else {
            maxWidthValue = 1850;
        }
    }
    var cssRules = `
    :root {
      --dark-fl: brightness(0.6) !important;
      --dark-fl-hover: brightness(0.6) !important;
      --light-fl: brightness(0.8) !important;
      --light-fl-hover: brightness(0.6) !important;
      --dark-bt: rgba(39, 39, 39);
      --dark-bt-hover: rgba(82, 82, 82);
      --light-bt: rgba(242, 242, 242);
      --light-bt-hover: rgba(217,217,217);
    } 
    #start.ytd-masthead {
      height: 50px !important;
      border-radius: 30px !important;
      display: flex !important;
      position: static !important;
      margin: 0 10% !important;
      border: 1px solid red !important;
      backdrop-filter: var(--light-fl) !important;
    }
    .ytSearchboxComponentHost {
      height: 53px !important;
      margin: 0 12px 0 0 !important;
    }
    .ytSearchboxComponentInputBox {
      margin-left: 0 !important;
      margin-top: 0 !important;
      border: 1px solid red !important;
      box-shadow: none !important;
      height: 50px !important;
      background: transparent !important;
      backdrop-filter: var(--light-fl) !important;
      display: flex !important;
      justify-content: space-around !important;
    }
    #center.ytd-masthead {
      margin: auto !important;
    }
    #container.ytd-searchbox {
      margin-left: 0 !important;
      border: 1px solid red !important;
      box-shadow: none !important;
      background: transparent !important;
      backdrop-filter: var(--light-fl) !important;
      display: flex !important;
      opacity: 0 !important;
      justify-content: space-around !important;
    }
    #end.ytd-masthead {
      height: 50px !important;
      min-width: 10px !important;
      border-radius: 30px !important;
      position: relative !important;
      margin: 0 10% !important;
      border: 1px solid red !important;
      backdrop-filter: var(--light-fl) !important;
    } 
    #primary.ytd-watch-flexy { 
      max-width: ${maxWidthValue}px !important;
      margin-left: 0px !important;
      margin-top: 12px !important;
    }
    #columns.ytd-watch-flexy {
     max-width: ${maxWidthValue}px !important;
    }
    ytd-watch-flexy[flexy] #secondary.ytd-watch-flexy {
      min-width: 450px !important;
      padding-right: 0px !important;
    }
    .ytSearchboxComponentSearchButton {
      background: transparent !important;
      border: 1px solid red !important;
      backdrop-filter: var(--light-fl) !important;
      height: 52px !important;
    }
    .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text {
      backdrop-filter: var(--light-fl) !important;
      color: white !important;
    }
    #background.ytd-masthead {
      position: fixed !important;
      opacity: 0 !important;
      visibility: visible !important;
      --light-theme-text-color: invert !important;
    }
    #search-form.ytd-searchbox {
      height: 50px !important;
    }
    ytd-searchbox.ytd-masthead {
      margin: 0 !important;
      padding: 0 10px !important;
    }
    #sections.ytd-guide-renderer {
      position: relative !important;
    }
    #sections.ytd-guide-renderer>*.ytd-guide-renderer:first-child {
      padding: 0px !important;
    }
    #voice-search-button.ytd-masthead {
      margin-left: 0 !important;
      //border: 1px solid red !important;
      background: transparent !important;
      backdrop-filter: var(--light-fl) !important;
    }
    #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
      display: none !important;
    }
    .yt-spec-touch-feedback-shape__fill {
      background-color: black !important;
    }
    .yt-spec-icon-shape {
      color: #c00 !important;
    }
    ytd-feed-filter-chip-bar-renderer {
      height: 0 !important;
    }
    body.efyt-mini-player.efyt-mini-player-top-right #movie_player:not(.ytp-fullscreen) {
      height: 315px !important;
      border-radius: 14px !important;
      width: 560px !important;
      top: 55px !important;
      left: ${position}px !important;
      z-index: 1000 !important;
    }
    body._top-right #efyt-close-mini-player {
      top: 60px !important;
      left: ${position}px !important;
      width: 3% !important;
      height: 3% !important;
    }  
    #frosted-glass.with-chipbar.ytd-app {
     display: none;
    }
    .yt-spec-touch-feedback-shape {
    border: 1px solid red;
    }
    @media (prefers-color-scheme: dark) {
      #start.ytd-masthead {
        backdrop-filter: var(--dark-fl) !important;}
        #start.ytd-masthead:hover {
        backdrop-filter: var(--dark-fl-hover) !important;}
      .ytSearchboxComponentInputBox {
        backdrop-filter: var(--dark-fl) !important;}
        .ytSearchboxComponentInputBox:hover {
        backdrop-filter: var(--dark-fl-hover) !important;}
      #container.ytd-searchbox {
        backdrop-filter: var(--dark-fl) !important;}
        #container.ytd-searchbox:hover {
        backdrop-filter: var(--dark-fl-hover) !important;}
      #end.ytd-masthead {
        backdrop-filter: var(--dark-fl) !important;}
        #end.ytd-masthead:hover {
        backdrop-filter: var(--dark-fl-hover) !important;}
      .ytSearchboxComponentSearchButton {
        backdrop-filter: var(--dark-fl) !important;}
        .ytSearchboxComponentSearchButton:hover {
        backdrop-filter: var(--dark-fl-hover) !important;}
      .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text {
        backdrop-filter: var(--dark-fl) !important;}
        .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text:hover {
        backdrop-filter: var(--dark-fl-hover) !important;}
      #voice-search-button.ytd-masthead {
        backdrop-filter: var(--dark-fl) !important;}
        #voice-search-button.ytd-masthead:hover {
        backdrop-filter: var(--dark-fl-hover) !important;}
    }
  `;
    styleElement.textContent = cssRules;
}
// Dynamically move elements of the top bar when the page is resized or scrolled
function adjustTopBarElements() {
    const masthead = document.querySelector('#masthead-container.ytd-app');
    const center = document.querySelector('#center.ytd-masthead');
    const container = document.querySelector('#container.ytd-masthead');
    if (masthead && center && container) {
        const windowWidth = window.innerWidth;
        var scrollY = window.scrollY;
        var mastheadWidth;
        if (scrollY != 0) {
            container.style.opacity = `0.8`;
        } else if (scrollY === 0) {
            container.style.opacity = `1`;
        }
        if (windowWidth <= 658) {
            mastheadWidth = 0;
        } else if (windowWidth >= 1750) {
            mastheadWidth = 100;
        } else {
            mastheadWidth = ((windowWidth - 658) / (1750 - 658)) * 100;
        }
        //masthead.style.width = `${mastheadWidth}%`;
        let centerFlexBasis = 0;
        if (windowWidth <= 658) {
            centerFlexBasis = 200;
        } else if (windowWidth >= 1750) {
            centerFlexBasis = 550;
        } else {
            centerFlexBasis =
                200 + ((windowWidth - 658) / (1750 - 658)) * (550 - 200);
        }
        center.style.flex = `0 0 ${centerFlexBasis}px`;
    }
}
// Function to wait for a DOM element to be available
function waitForDOMElement(selector, callback, options = {}) {
    const { interval = 100, timeout = 10000 } = options;
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
        checkElement();
    } else {
        return;
    }
}
// Function to restart the observer
function restartObserver() {
    if (isRestartScheduled) {
        return;
    }
    isRestartScheduled = true;
    setTimeout(() => {
        isRestartScheduled = false;
        SkippingShorts();
    }, 1000);
}
// Function to handle skipping shorts
function SkippingShorts() {
    if (checkIfShortsPage()) {
        isClicked = false;
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
                {
                    interval: 100,
                    timeout: 10000,
                } // Pass options as an object
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
                            let widthNumber = parseFloat(ariaValueText.replace('%', ``));
                            if (widthNumber >= maxWidth) {
                                maxWidth = widthNumber;
                            } else if (maxWidth >= 95 && widthNumber < maxWidth - 10 && !isClicked) {
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
            100,
            10000
        );
    }
}
// Toggle Button for the YT Shorts Page
function addToggleButton() {
    if (checkIfShortsPage()) {
        const windowHeight = window.innerHeight;
        var buttonPosition;
        if (windowHeight <= 575) {
            buttonPosition = 123;
        } else if (windowHeight >= 900) {
            buttonPosition = 310;
        } else {
            buttonPosition = 123 + ((windowHeight - 575) / (900 - 575)) * (310 - 1123);
        }
        let toggleButton = document.getElementById('shorts-skip-toggle');
        if (!toggleButton) {
            // Create styles only once
            const toggleStyles = document.createElement('style');
            toggleStyles.id = 'toggleStyles';
            toggleStyles.textContent = `
            .skip-toggle-btn {
                pointer-events: all;
                width: 100%;
                height: 100%;
                margin: none;
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
                color: #c02;
                font-size: 13px;
                font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
                'Lucida Sans Unicode', Geneva, Verdana, serif;
                font-weight: 600;
                }
            `;
            document.head.appendChild(toggleStyles);
            // Create the container div
            const autoskipContainer = document.createElement('div');
            autoskipContainer.className = 'navigation-button style-scope ytd-shorts';
            autoskipContainer.id = 'shorts autoskip';
            autoskipContainer.style.width = '58px';
            autoskipContainer.style.height = '58px';

            // Create the button
            const toggleButton = document.createElement('button');
            toggleButton.id = 'shorts-skip-toggle';
            toggleButton.className = 'skip-toggle-btn';
            toggleButton.title = 'Toggle Video Skipping (ON = Skip, OFF = No Skip)';

            const icon = document.createElement('span');
            icon.className = 'toggle-icon';
            icon.textContent = 'SKIP';
            toggleButton.appendChild(icon);

            // Append button to container
            autoskipContainer.appendChild(toggleButton);

            waitForDOMElement(
                '.navigation-container.style-scope.ytd-shorts',
                (navigationContainer) => {
                    waitForDOMElement(
                        '#navigation-button-up',
                        (navigationButtonUp) => {
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
                    const progressBarElement = document.querySelector(
                        '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div'
                    );
                    if (progressBarElement) {
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

// Small Helper Functions
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
// Function to remove the toggle button from YT Shorts Page
function removeToggleButton() {
    const toggleButton = document.getElementById('shorts-skip-toggle');
    if (toggleButton && toggleButton.parentNode) {
        toggleButton.dispatchEvent(new Event('remove'));
        toggleButton.parentNode.removeChild(toggleButton);
    }
    const toggleStyles = document.getElementById('toggleStyles');
    if (toggleStyles && toggleStyles.parentNode) {
        toggleStyles.parentNode.removeChild(toggleStyles);
    }
}
// Function to check for URL changes when the page is not a Shorts page and remove the toggle button
function checkUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (!currentUrl.includes('youtube.com/shorts')) {
            removeToggleButton();
            if (observer) {
                observer.disconnect();
            }
        } else {
            console.log('The Shorts Script is working');
            SkippingShorts();
            addToggleButton();
        }
    }
    setTimeout(checkUrlChange, 500);
}

// Event Listeners with Debouncing
let lastWheelEvent = 0;
let lastKeyEvent = 0;
const debounceDelay = 1000;

document.addEventListener('wheel', function (event) {
    const now = Date.now();
    if (event.deltaY < 0 || event.deltaY > 0) {
        lastWheelEvent = now;
        if (observer) {
            observer.disconnect();
        }
        restartObserver();
    }
});

document.addEventListener('keydown', function (event) {
    const now = Date.now();
    if (event.keyCode === 38 || event.keyCode === 40) {
        lastKeyEvent = now;
        if (observer) {
            observer.disconnect();
        }
        restartObserver();
    }
});

//Event Listeners
window.addEventListener('load', updatePageElements);
window.addEventListener('load', adjustTopBarElements);
window.addEventListener('load', createScrollToTopButton);
window.addEventListener('load', addToggleButton);
window.addEventListener('popstate', updatePageElements);
window.addEventListener('popstate', createScrollToTopButton);
window.addEventListener('popstate', addToggleButton);
window.addEventListener('resize', adjustTopBarElements);
window.addEventListener('resize', updatePageElements);
window.addEventListener('resize', createScrollToTopButton);
window.addEventListener('resize', addToggleButton);
window.addEventListener('scroll', updatePageElements);
window.addEventListener('scroll', createScrollToTopButton);
window.addEventListener('scroll', adjustTopBarElements);
window.addEventListener('DOMContentLoaded', checkUrlChange);

// Initial function calls
updatePageElements();
adjustTopBarElements();
checkUrlChange();
createScrollToTopButton();
