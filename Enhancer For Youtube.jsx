// Variable Declarations
var styleElement = document.createElement('style');
let buttonPosition;
let position;
var viewportWidth = window.innerWidth;
let observer = null;
let isClicked = true;
let toggleButton = null; // Store the toggle button reference
let isSkippingEnabled = true; // Toggle state
let isRestartScheduled = false;
let hasNavigationButtonBeenFetched = false;
const scrollToTopBtn = document.createElement('button');
const svgElement = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'svg'
);
const pathElement = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'path'
);
const divElement = document.createElement('div');
const scrollTopBtnStyles = document.createElement('style');

// Conditional Logic for Button Position
if (window.screen.width === 2560 && window.screen.height === 1440) {
  buttonPosition = viewportWidth * 0.73;
} else {
  buttonPosition = viewportWidth * 0.7 - 30;
}

// DOM Manipulations
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

svgElement.appendChild(pathElement);

divElement.classList.add('scroll-up-btn');
divElement.appendChild(svgElement);

scrollToTopBtn.appendChild(divElement);

scrollTopBtnStyles.textContent = `
  :root {
    --dark-bg: rgba(100,100,100, 0.5); /* 50% dark circle for light theme */
    --dark-bg-hover: rgba(150, 150, 150, 0.5); /* 80% dark circle for light theme hover */
    --light-bg: rgba(200, 200, 200, 0.5); /* 50% light circle for dark theme */
    --light-bg-hover: rgba(150, 150, 150, 0.5); /* 80% light circle for dark theme hover */
  }

  /* Light theme */
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
    background-color: var(--light-bg);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .scroll-top-btn:hover {
    background-color: var(--light-bg-hover);
  }
  /* Dark theme */
  @media (prefers-color-scheme: dark) {
    .scroll-top-btn {
      background-color: var(--dark-bg);
    }
    .scroll-top-btn:hover {
      background-color: var(--dark-bg-hover);
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

document.head.appendChild(styleElement);
document.head.appendChild(scrollTopBtnStyles);
document.body.appendChild(scrollToTopBtn);

// Large Functions
function updatePlayerPosition() {
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
      position = viewportWidth * 0.45 - 30;
    } else {
      maxWidthValue = 1850;
    }
    primaryElement.style.maxWidth = '1650px';
    primaryElement.style.marginTop = '12px';
    primaryElement.style.marginLeft = '0px';
    columnsElement.style.maxWidth = maxWidthValue + 'px';
  }

  var cssRules = `
    #start.ytd-masthead {
      height: 50px !important;
      border-radius: 30px !important;
      display: flex !important;
      position: static !important;
      margin: 0 10% !important;
      border: 1px solid red !important;
      backdrop-filter: brightness(0.6) !important;
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
      backdrop-filter: brightness(0.6) !important;
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
      backdrop-filter: brightness(0.6) !important;
      display: flex !important;
      justify-content: space-around !important;
    }

    #end.ytd-masthead {
      height: 50px !important;
      min-width: 10px !important;
      border-radius: 30px !important;
      position: relative !important;
      margin: 0 10% !important;
      border: 1px solid red !important;
      backdrop-filter: brightness(0.6) !important;
    }

    ytd-watch-flexy[flexy] #secondary.ytd-watch-flexy {
      min-width: 450px !important;
      padding-right: 0px !important;
    }

    .ytSearchboxComponentSearchButton {
      background: transparent !important;
      border: 1px solid red !important;
      backdrop-filter: brightness(0.6) !important;
      height: 52px !important;
    }

    .yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--text {
      backdrop-filter: brightness(0.6) !important;
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
      border: 1px solid red !important;
      background: transparent !important;
      backdrop-filter: brightness(0.6) !important;
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
      z-index: 100 !important;
    }

    body._top-right #efyt-close-mini-player {
      top: 60px !important;
      left: ${position}px !important;
      width: 3% !important;
      height: 3% !important;
    }
  `;
  styleElement.textContent = cssRules;
}

function adjustDynamicStyles() {
  const masthead = document.querySelector('#masthead-container.ytd-app');
  const center = document.querySelector('#center.ytd-masthead');

  if (masthead && center) {
    const windowWidth = window.innerWidth;
    let mastheadWidth = 0;
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

function waitForDOMElement(
  selector,
  callback,
  interval = 100,
  timeout = 10000
) {
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
        100,
        10000
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
              } else if (
                maxWidth >= 95 &&
                widthNumber < maxWidth - 10 &&
                !isClicked
              ) {
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

function addToggleButton() {
  if (checkIfShortsPage()) {
    const windowHeight = window.innerHeight;
    let buttonPosition = 0;
    if (windowHeight <= 555) {
      buttonPosition = 160;
    } else if (windowHeight >= 900) {
      buttonPosition = 365;
    } else {
      buttonPosition = 160 + ((windowHeight - 555) / (900 - 555)) * (365 - 160);
    }
    const toggleStyles = document.createElement('style');
    toggleStyles.textContent = `
    :root {
      --dark-bg: rgba(100,100,100, 0.5);
      --dark-bg-hover: rgba(150, 150, 150, 0.5);
      --light-bg: rgba(200, 200, 200, 0.5);
      --light-bg-hover: rgba(150, 150, 150, 0.5);
    }

    .skip-toggle-btn {
      position: fixed;
      top: ${buttonPosition}px;
      right: 25px;
      width: 55px;
      height: 55px;
      padding: 0;
      border: 1px solid red;
      border-radius: 50%;
      background-color: var(--light-bg);
      cursor: pointer;
      transition: background-color 0.2s ease;
      z-index: 1000;
      opacity: 1;
    }
    .skip-toggle-btn:hover {
      background-color: var(--light-bg-hover);
    }
    @media (prefers-color-scheme: dark) {
      .skip-toggle-btn {
        background-color: var(--dark-bg);
      }
      .skip-toggle-btn:hover {
        background-color: var(--dark-bg-hover);
      }
    }
    .toggle-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
      font-size: 20px;
      color: #c00;
    }
  `;
    document.head.appendChild(toggleStyles);

    const toggleButton = document.createElement('button');
    toggleButton.id = 'shorts-skip-toggle';
    toggleButton.className = 'skip-toggle-btn';
    toggleButton.title = 'Toggle Video Skipping (ON = Skip, OFF = No Skip)';

    const icon = document.createElement('span');
    icon.className = 'toggle-icon';
    icon.textContent = 'ON';
    toggleButton.appendChild(icon);

    document.body.appendChild(toggleButton);

    toggleButton.addEventListener('click', () => {
      isSkippingEnabled = !isSkippingEnabled;
      icon.textContent = isSkippingEnabled ? 'ON' : 'OFF';

      if (isSkippingEnabled) {
        const progressBarElement = document.querySelector(
          '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div'
        );
        const navigationButtonDown = document.querySelector(
          '#navigation-button-down > ytd-button-renderer > yt-button-shape > button'
        );

        if (progressBarElement && navigationButtonDown) {
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

function updateScrollToTopButtonVisibility() {
  const scrollPosition =
    window.pageYOffset || document.documentElement.scrollTop;
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  if (scrollPosition > 1000 && checkIfWatchPage()) {
    scrollToTopBtn.style.opacity = '1';
  } else {
    scrollToTopBtn.style.opacity = '0';
  }
}
function removeToggleButton() {
  if (toggleButton && toggleButton.parentNode) {
    toggleButton.parentNode.removeChild(toggleButton);
    toggleButton = null; // Clear the reference
  }
}

function checkUrlChange() {
  const currentUrl = window.location.href;
  let lastUrl = null;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (!currentUrl.includes('youtube.com/shorts')) {
      removeToggleButton();
      if (observer) {
        observer.disconnect(); // Optional: Stop observer when leaving Shorts
      }
    } else {
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

document.getElementById('scroll-to-top').addEventListener('click', function () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
});

window.addEventListener('popstate', updateScrollToTopButtonVisibility);
window.addEventListener('popstate', addToggleButton);
window.addEventListener('resize', adjustDynamicStyles);
window.addEventListener('resize', updatePlayerPosition);
window.addEventListener('resize', addToggleButton);
window.addEventListener('scroll', updatePlayerPosition);
window.addEventListener('scroll', updateScrollToTopButtonVisibility);
window.addEventListener('DOMContentLoaded', checkUrlChange);

updatePlayerPosition();
adjustDynamicStyles();
updateScrollToTopButtonVisibility();
checkUrlChange();
