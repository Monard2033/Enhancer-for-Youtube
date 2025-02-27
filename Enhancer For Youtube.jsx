var styleElement = document.createElement('style');
let buttonPosition;
let position;
var viewportWidth = window.innerWidth;
let observer = null;
let isClicked = true;
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

if (window.screen.width === 2560 && window.screen.height === 1440) {
  buttonPosition = viewportWidth * 0.73;
} else {
  buttonPosition = viewportWidth * 0.7 - 30;
}

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
      console.log('Default resolution');
      maxWidthValue = 1850;
    }
    primaryElement.style.maxWidth = maxWidthValue + 'px';
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

        .ytSearchboxComponentInputBox  {
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

        #columns.ytd-watch-flexy {
            margin-top: 0 !important;
        }

        ytd-watch-flexy[flexy] #secondary.ytd-watch-flexy {
            min-width: 450px !important;
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

        #sections.ytd-guide-renderer>*.ytd-guide-renderer:first-child{
            padding: 0px !important;
        }

        #voice-search-button.ytd-masthead {
            margin-left:0 !important;
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

        body._top-right._560x315 #efyt-progress {
            top: 360px !important;
            border-bottom-right-radius: 860px;
            border-bottom-left-radius: 860px;
            left: ${position}px !important;
            height: 10px !important;
            max-width: 560px !important;
            margin-left: 1.5px !important;
            z-index: 200 !important;
            overflow: hidden !important;
        }

        #efyt-progress::-webkit-progress-bar {
            max-width: 560px !important;
            overflow: hidden !important;
            border-bottom-left-radius: 860px;
            border-bottom-right-radius: 860px;
        }
         #efyt-progress::-webkit-progress-value {
            border-top-right-radius: 860px;
            border-bottom-right-radius: 860px;
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

    // Calculate masthead width
    let mastheadWidth = 0;
    if (windowWidth <= 658) {
      mastheadWidth = 0; // Minimum width for masthead
    } else if (windowWidth >= 1750) {
      mastheadWidth = 100; // Maximum width for masthead
    } else {
      mastheadWidth = ((windowWidth - 658) / (1750 - 658)) * 100; // Interpolated width
    }
    masthead.style.width = `${mastheadWidth}%`;

    // Calculate center flex-basis
    let centerFlexBasis = 0;
    if (windowWidth <= 658) {
      centerFlexBasis = 200; // Minimum flex-basis for center
    } else if (windowWidth >= 1750) {
      centerFlexBasis = 550; // Maximum flex-basis for center
    } else {
      centerFlexBasis =
        200 + ((windowWidth - 658) / (1750 - 658)) * (550 - 200); // Interpolated flex-basis
    }
    center.style.flex = `0 0 ${centerFlexBasis}px`; // Apply calculated flex-basis
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
      } else {
        console.error(
          `Element with selector "${selector}" not found within ${timeout}ms.`
        );
      }
    };
    checkElement();
  }
}

function setupObserverForShort() {
  if (checkIfShortsPage() && isClicked) {
    console.log('YT Shorts Found, Script is working');
    isClicked = false;
    waitForDOMElement(
      '#scrubber > desktop-shorts-player-controls > div > yt-progress-bar > div',
      progressBarElement => {
        waitForDOMElement(
          '#navigation-button-down > ytd-button-renderer > yt-button-shape > button',
          navigationButtonDown => {
            if (observer) {
              observer.disconnect();
            }

            observer = new MutationObserver(mutations => {
              mutations.forEach(mutation => {
                if (mutation.attributeName === 'aria-valuetext') {
                  let ariaValueText =
                    progressBarElement.getAttribute('aria-valuetext');
                  let widthNumber = parseFloat(ariaValueText.replace('%', ''));
                  console.log('PB: ', widthNumber);

                  if (widthNumber >= 98 && !isClicked) {
                    navigationButtonDown.click();
                    isClicked = true;
                    setTimeout(setupObserverForShort, 1000);
                  }
                }
              });
            });
            observer.observe(progressBarElement, {
              attributes: true,
              attributeFilter: ['aria-valuetext'],
            });

            navigationButtonDown.addEventListener(
              'click',
              function observerReinitHandler() {
                navigationButtonDown.removeEventListener(
                  'click',
                  observerReinitHandler
                );
                isClicked = true;
                setTimeout(setupObserverForShort, 1000);
              }
            );
          },
          100, // Polling interval
          10000 // Timeout
        );
      },
      100, // Polling interval
      10000 // Timeout
    );
  }
}
document.addEventListener('wheel', function (event) {
  if (event.deltaY > 0) {
    console.log('Mouse wheel scrolled down');
    isClicked = true;
    setTimeout(setupObserverForShort, 1000);
  }
});

document.addEventListener('keydown', function (event) {
  if (event.keyCode === 38 || event.keyCode === 40) {
    isClicked = true;
    setTimeout(setupObserverForShort, 1000);
  }
});

function checkIfWatchPage() {
  return window.location.href.includes('youtube.com/watch');
}
function checkIfShortsPage() {
  return window.location.href.includes('youtube.com/shorts');
}

function toggleScrollToTopButton() {
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  scrollToTopBtn.style.opacity = checkIfWatchPage() ? '1' : '0';
}

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
        height: 100%; /* Adjust as necessary */
        width: 100%;  /* Adjust as necessary */
    }
`;

document.head.appendChild(styleElement);
document.head.appendChild(scrollTopBtnStyles);
document.body.appendChild(scrollToTopBtn);
updatePlayerPosition();
setupObserverForShort();

window.addEventListener('resize', adjustDynamicStyles);
window.addEventListener('resize', updatePlayerPosition);
window.addEventListener('scroll', updatePlayerPosition);
window.addEventListener('scroll', () => {
  const scrollPosition =
    window.pageYOffset || document.documentElement.scrollTop;
  const scrollToTopBtn = document.getElementById('scroll-to-top');

  if (scrollPosition > 1000 && checkIfWatchPage()) {
    scrollToTopBtn.classList.add('show');
    scrollToTopBtn.style.opacity = 1;
  } else {
    scrollToTopBtn.classList.remove('show');
    scrollToTopBtn.style.opacity = 0;
  }
});
document.getElementById('scroll-to-top').addEventListener('click', function () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
});
document.addEventListener('DOMContentLoaded', adjustDynamicStyles);
document.addEventListener('DOMContentLoaded', toggleScrollToTopButton);
document.addEventListener('DOMContentLoaded', setupObserverForShort);
window.addEventListener('popstate', toggleScrollToTopButton);
