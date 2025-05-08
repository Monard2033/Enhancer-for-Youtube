var styleElement = document.createElement('style');
document.head.appendChild(styleElement); // Append styleElement to DOM immediately
let buttonPosition;
let position;
let observer = null;
let isClicked = true;
let lastUrl = null;
let toggleButton = null;
let isSkippingEnabled = true;
let isRestartScheduled = false;
let hasNavigationButtonBeenFetched = false;

// Global CSS variables
styleElement.textContent = `
:root {
    --dark-fl: brightness(0.8) !important;
    --dark-fl-hover: brightness(0.9) !important;
    --light-fl: brightness(0.9) !important;
    --light-fl-hover: brightness(0.8) !important;
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
 #frosted-glass.with-chipbar.ytd-app {
    display: none;
}
.yt-spec-touch-feedback-shape {
    border: 1px solid red;
}
@media (prefers-color-scheme: dark) {
    #start.ytd-masthead {
        backdrop-filter: var(--dark-fl) !important;
    }
    #start.ytd-masthead:hover {
        backdrop-filter: var(--dark-fl-hover) !important;
    }
    .ytSearchboxComponentInputBox {
        backdrop-filter: var(--dark-fl) !important;
    }
    .ytSearchboxComponentInputBox:hover {
        backdrop-filter: var(--dark-fl-hover) !important;
    }
    #container.ytd-searchbox {
        backdrop-filter: var(--dark-fl) !important;
    }
    #container.ytd-searchbox:hover {
        backdrop-filter: var(--dark-fl-hover) !important;
    }
    #end.ytd-masthead {
        backdrop-filter: var(--dark-fl) !important;
    }
    #end.ytd-masthead:hover {
        backdrop-filter: var(--dark-fl-hover) !important;
    }
    .ytSearchboxComponentSearchButton {
        backdrop-filter: var(--dark-fl) !important;
    }
    .ytSearchboxComponentSearchButton:hover {
        backdrop-filter: var(--dark-fl-hover) !important;
    }
    .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text {
        backdrop-filter: var(--dark-fl) !important;
    }
    .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text:hover {
        backdrop-filter: var(--dark-fl-hover) !important;
    }
    #voice-search-button.ytd-masthead {
        backdrop-filter: var(--dark-fl) !important;
    }
    #voice-search-button.ytd-masthead:hover {
        backdrop-filter: var(--dark-fl-hover) !important;
    }
}
/* Scroll to Top Button Styles */
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

/* Shorts Skip Button Styles */
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
// Function to create and position the scroll-to-top button
function createScrollToTopBtn() {
  console.log('createScrollToTopBtn called'); // Debug log
  // Remove existing button
  const existingButton = document.getElementById('scroll-top-container');
  if (existingButton) {
      existingButton.remove();
  }

  // Calculate button position
  const viewportWidth = window.innerWidth;
  if (window.screen.width === 2560 && window.screen.height === 1440) {
      buttonPosition = viewportWidth * 0.73;
  } else {
      buttonPosition = viewportWidth * 0.7;
  }

  // Create the container div
  const scrollTopContainer = document.createElement('div');
  scrollTopContainer.id = 'scroll-top-container';
  scrollTopContainer.className = 'navigation-button style-scope ytd-watch-flexy';
  scrollTopContainer.style.left = `${buttonPosition}px`;

   // Create button elementsd
   const scrollToTopBtn = document.createElement('button');
   scrollToTopBtn.id = 'scroll-to-top';
   scrollToTopBtn.className = 'scroll-top-btn';
   scrollToTopBtn.setAttribute('aria-label', 'Scroll to Top');

  // Create SVG elements
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const divElement = document.createElement('div');

  // Set SVG attributes
  svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgElement.setAttribute('height', '24');
  svgElement.setAttribute('viewBox', '0 0 24 24');
  svgElement.setAttribute('width', '24');
  svgElement.setAttribute('focusable', 'false');
  svgElement.style.fill = 'red';
  svgElement.style.display = 'flex';

  // Set path attributes
  pathElement.setAttribute(
      'd',
      'M19.884 10.114a1.25 1.25 0 01-1.768 1.768L13.25 7.016v12.982a1.25 1.25 0 11-2.5 0V7.016l-4.866 4.866a1.25 1.25 0 11-1.768-1.768L12 2.23l7.884 7.884Z'
  );

  // Append SVG elements
  svgElement.appendChild(pathElement);
  divElement.classList.add('scroll-up-btn');
  divElement.appendChild(svgElement);
  scrollToTopBtn.appendChild(divElement);

// Append button to container
scrollTopContainer.appendChild(scrollToTopBtn);
// Append to body
document.body.appendChild(scrollTopContainer);
console.log('scrollTopContainer appended to body', scrollTopContainer); // Debug log

  // Add click event listener
  scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
          top: 0,
          behavior: 'smooth',
      });
  });

  // Handle scroll visibility
  const handleScroll = () => {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      scrollTopContainer.style.opacity = (scrollPosition > 1000 && checkIfWatchPage()) ? '1' : '0';
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check
}

// Function to update page elements under the video-player
function updatePageElements() {
    const primaryElement = document.querySelector('#primary');
    const columnsElement = document.querySelector('#columns');
    const viewportWidth = window.innerWidth;
    
    if (columnsElement && primaryElement) {
        let maxWidthValue;
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
        `;
        // Append or update styles
        const pageStyles = document.createElement('style');
        pageStyles.setAttribute('data-page-styles', 'true');
        pageStyles.textContent = cssRules;
        document.head.appendChild(pageStyles);
    }
}

// Dynamically move elements of the top bar when the page is resized or scrolled
function adjustTopBarElements() {
    const masthead = document.querySelector('#masthead-container.ytd-app');
    const center = document.querySelector('#center.ytd-masthead');
    const container = document.querySelector('#container.ytd-masthead');
    
    if (masthead && center && container) {
        const windowWidth = window.innerWidth;
        const scrollY = window.scrollY;
        
        container.style.opacity = scrollY !== 0 ? '0.6' : '1';
        
        let mastheadWidth;
        if (windowWidth <= 658) {
            mastheadWidth = 0;
        } else if (windowWidth >= 1750) {
            mastheadWidth = 100;
        } else {
            mastheadWidth = ((windowWidth - 658) / (1750 - 658)) * 100;
        }
        
        let centerFlexBasis = windowWidth <= 658 ? 200 :
            windowWidth >= 1750 ? 550 :
            200 + ((windowWidth - 658) / (1750 - 658)) * (550 - 200);
            
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
        SkippingShortsMechanism();
    }, 1000);
}

// Function to handle skipping shorts
function SkippingShortsMechanism() {
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
                { interval: 100, timeout: 10000 }
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
            { interval: 100, timeout: 10000 }
        );
    }
}
// Toggle Button for the YT Shorts Page
function createShortsSkipBtn() {
  if (checkIfShortsPage()) {
      let toggleButton = document.getElementById('shorts-skip-toggle');
      if (!toggleButton) {
          // Create the container div
          const autoskipContainer = document.createElement('div');
          autoskipContainer.className = 'navigation-button style-scope ytd-shorts';
          autoskipContainer.id = 'shorts-autoskip';
          autoskipContainer.style.width = '58px';
          autoskipContainer.style.height = '58px';

          // Create the button
          toggleButton = document.createElement('button');
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
}

// Function to check for URL changes
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
            SkippingShortsMechanism();
            createShortsSkipBtn();
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
    if (event.deltaY !== 0 && now - lastWheelEvent > debounceDelay) {
        lastWheelEvent = now;
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
        if (observer) {
            observer.disconnect();
        }
        restartObserver();
    }
});

// Event Listeners
window.addEventListener('load', () => {
    updatePageElements();
    adjustTopBarElements();
    createScrollToTopBtn();
});
window.addEventListener('popstate', () => {
    updatePageElements();
    createScrollToTopBtn();
});
window.addEventListener('resize', () => {
    adjustTopBarElements();
    updatePageElements();
    createScrollToTopBtn();
});
window.addEventListener('scroll', () => {
    updatePageElements();
    adjustTopBarElements();
});
window.addEventListener('DOMContentLoaded', () => {
    checkUrlChange();
});

// Initial function calls
updatePageElements();
adjustTopBarElements();
createScrollToTopBtn();
