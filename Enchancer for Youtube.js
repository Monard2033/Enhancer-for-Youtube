var styleElement = document.createElement('style');
let buttonPosition;
let position;
var viewportWidth = window.innerWidth;
if (window.screen.width == 2560 && window.screen.height == 1440) {
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
    if (window.screen.width == 2560 && window.screen.height == 1440) {
           maxWidthValue = 2300;
          primaryElement.style.minWidth = 'none';
      if (window.pageYOffset >= 4200) {
        position = viewportWidth * 0.75 + 20;
      } else {
        position = viewportWidth * 0.55 - 30;
      }
    } else if (window.screen.width == 1920 && window.screen.height == 1080) {
           maxWidthValue = 1850;
           primaryElement.style.maxWidth = 'none';
      if (window.pageYOffset >= 3200) {
        position = viewportWidth * 0.72 - 20;
      } else {
        position = viewportWidth * 0.45 - 30;
      }
    } else {
      console.log('Default resolution');
      maxWidthValue = 1850;
    }

    columnsElement.style.maxWidth = maxWidthValue + 'px';
  }

  var cssRules = `
    #start.ytd-masthead {
      height: 50px;
      border-radius: 30px !important;
      display: flex !important;
      position: static !important;
      margin: 0 10% !important;
      border: 1px solid red !important;
      backdrop-filter: brightness(0.6) !important;
    }

    #center.ytd-masthead {
      flex: 0 0 550px !important;
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

    #search-icon-legacy.ytd-searchbox {
      background: transparent !important;
      border: 1px solid red !important;
      backdrop-filter: brightness(0.6) !important;
      height: 50px !important;
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

    body.efyt-mini-player._top-right #movie_player:not(.ytp-fullscreen) {
      height: 315px !important;
      border-radius: 14px !important;
      width: 560px !important;
      top: 55px !important;
      left: ${position}px !important;
      z-index: 100 !important;
    }

    body._top-right._560x315 #efyt-progress {
      top: 361px !important;
      border-bottom-right-radius: 560px;
      border-bottom-left-radius: 560px;
      left: ${position}px !important;
      height: 8px !important;
      max-width: 554px !important;
      margin-left: 2.5px !important;
      z-index: 200 !important;
    }

    #efyt-progress::-webkit-progress-bar,
    #efyt-progress::-webkit-progress-value {
      border-bottom-left-radius: 560px;
      border-bottom-right-radius: 560px;
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

updatePlayerPosition();

window.addEventListener('scroll', updatePlayerPosition);
window.addEventListener('resize', updatePlayerPosition);
document.head.appendChild(styleElement);

function checkIfWatchPage() {
  return window.location.href.includes('youtube.com/watch');
}

function toggleScrollToTopButton() {
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  scrollToTopBtn.style.opacity = checkIfWatchPage() ? '1' : '0';
}

const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.id = 'scroll-to-top';
scrollToTopBtn.classList.add('scroll-top-btn');

const svgElement = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'svg'
);
svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
svgElement.setAttribute('height', '24');
svgElement.setAttribute('viewBox', '0 0 24 24');
svgElement.setAttribute('width', '24');
svgElement.setAttribute('focusable', 'false');
svgElement.style.fill = 'red';
svgElement.style.display = 'flex';

const pathElement = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'path'
);
pathElement.setAttribute(
  'd',
  'M19.884 10.114a1.25 1.25 0 01-1.768 1.768L13.25 7.016v12.982a1.25 1.25 0 11-2.5 0V7.016l-4.866 4.866a1.25 1.25 0 11-1.768-1.768L12 2.23l7.884 7.884Z'
);

svgElement.appendChild(pathElement);

const divElement = document.createElement('div');
divElement.classList.add('scroll-up-btn');
divElement.appendChild(svgElement);

scrollToTopBtn.appendChild(divElement);

document.body.appendChild(scrollToTopBtn);
const scrollTopBtnStyles = document.createElement('style');
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

document.head.appendChild(scrollTopBtnStyles);
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

document.addEventListener('DOMContentLoaded', toggleScrollToTopButton);
window.addEventListener('popstate', toggleScrollToTopButton);
