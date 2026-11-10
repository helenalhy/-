const DOG_COLORS = [
  ['#D8A879', '#F4D2A6', '#E981A8'],
  ['#F7F0E6', '#D9C8B5', '#A988D9'],
  ['#20252B', '#F7F0E6', '#72B6E8'],
  ['#E9B65E', '#F7D487', '#F08C52'],
  ['#FAF6EF', '#D7C5B5', '#E98AAE'],
  ['#D6A65B', '#F1D79D', '#85B9E7'],
  ['#C89D70', '#EBD2B1', '#D97765'],
  ['#FBF6ED', '#DCCAB8', '#83C7DB'],
  ['#FCF7EF', '#D8C8B5', '#B59AD9'],
  ['#E7C47B', '#F3DCA7', '#9BC875'],
  ['#303238', '#F2EEE6', '#D77778'],
  ['#F8F5EF', '#DCCDC0', '#7DB9DA'],
  ['#FFF9EF', '#E8D8C4', '#D88AB4'],
  ['#B98860', '#E2BA8E', '#92B6D7'],
];

const EAR_PATHS = [
  'M18 24 C7 7 9 4 27 16 Z M46 24 C57 7 55 4 37 16 Z',
  'M18 23 C5 7 9 3 28 17 Z M46 23 C59 7 55 3 36 17 Z',
  'M18 22 L11 6 L29 16 Z M46 22 L53 6 L35 16 Z',
  'M18 24 C7 10 12 3 29 17 Z M46 24 C57 10 52 3 35 17 Z',
  'M18 24 C4 10 10 2 29 17 Z M46 24 C60 10 54 2 35 17 Z',
];

function dogSvg([coat, ear, accent], index) {
  return `<span class="loader-dog" style="--delay:${index * 55}ms" role="img" aria-label="狗狗店員 ${index + 1}">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="${EAR_PATHS[index % EAR_PATHS.length]}" fill="${ear}" stroke="#8B705D" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="32" cy="43" rx="${index % 3 === 0 ? 19 : 17}" ry="13" fill="${coat}" stroke="#8B705D" stroke-width="2.4"/>
      <ellipse cx="32" cy="32" rx="17" ry="16" fill="${coat}" stroke="#8B705D" stroke-width="2.4"/>
      <ellipse cx="25" cy="32" rx="2" ry="2.6" fill="#463735"/>
      <ellipse cx="39" cy="32" rx="2" ry="2.6" fill="#463735"/>
      <ellipse cx="32" cy="38" rx="6" ry="4.2" fill="#FFF9EF"/>
      <ellipse cx="32" cy="36.5" rx="2.4" ry="1.7" fill="#76574C"/>
      <path d="M29 40 Q32 43 35 40" fill="none" stroke="#76574C" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="20" cy="38" r="3" fill="${accent}" opacity=".5"/>
      <circle cx="44" cy="38" r="3" fill="${accent}" opacity=".5"/>
      <path d="M25 18 Q32 12 39 18" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="17" r="3.4" fill="${accent}" stroke="#FFF9EF" stroke-width="1"/>
      <path d="M29 54 Q32 57 35 54" fill="none" stroke="#8B705D" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </span>`;
}

function createLoadingMarkup() {
  const dogs = DOG_COLORS.map(dogSvg).join('');
  return `<style id="momentum-loader-style">
    #momentum-loading-screen{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:#fff8fb;color:#554350;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transition:opacity .32s ease,visibility .32s ease}
    #momentum-loading-screen.is-hidden{opacity:0;visibility:hidden;pointer-events:none}
    .momentum-loader-inner{width:min(340px,90vw);text-align:center}
    .momentum-loader-halo{width:104px;height:104px;margin:0 auto 18px;border-radius:36px;background:radial-gradient(circle at 35% 28%,#fff 0,#ffe5ee 55%,#f9dbea 100%);display:grid;place-items:center;box-shadow:0 12px 34px rgba(190,105,146,.14)}
    .momentum-loader-mark{font-size:40px;line-height:1;animation:momentum-heartbeat 1.4s ease-in-out infinite}
    .momentum-loader-dogs{display:grid;grid-template-columns:repeat(7,1fr);gap:2px 6px;max-width:320px;margin:0 auto 14px}
    .loader-dog{display:block;width:38px;height:42px;justify-self:center;animation:momentum-dog-bounce .72s ease-in-out infinite alternate;animation-delay:var(--delay)}
    .loader-dog svg{width:100%;height:100%;overflow:visible}
    .momentum-loader-label{font-size:14px;font-weight:700;letter-spacing:.16em}
    .momentum-loader-dots:after{content:"";display:inline-block;width:18px;text-align:left;animation:momentum-dots 1.2s steps(4,end) infinite}
    .momentum-loader-note{font-size:11px;margin-top:6px;color:#947d8c}
    @keyframes momentum-dog-bounce{from{transform:translateY(2px) rotate(-3deg)}to{transform:translateY(-5px) rotate(3deg)}}
    @keyframes momentum-heartbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
    @keyframes momentum-dots{0%{content:""}25%{content:"."}50%{content:".."}75%,100%{content:"..."}}
    @media(prefers-reduced-motion:reduce){.loader-dog,.momentum-loader-mark,.momentum-loader-dots:after{animation:none}}
  </style>
  <div id="momentum-loading-screen" role="status" aria-live="polite">
    <div class="momentum-loader-inner">
      <div class="momentum-loader-halo"><svg class="momentum-loader-mark" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40 7.8 24.2C-1 14.8 5.1 5 14.4 5c4.2 0 7.5 2.1 9.6 5.2C26.1 7.1 29.4 5 33.6 5 42.9 5 49 14.8 40.2 24.2L24 40Z" fill="#E984AA"/></svg></div>
      <div class="momentum-loader-dogs">${dogs}</div>
      <div class="momentum-loader-label">載入中<span class="momentum-loader-dots"></span></div>
      <div class="momentum-loader-note">狗狗店員正在準備迎接你</div>
    </div>
  </div>
  `;
}

function createHideScript() {
  return `<script>
    (function(){
      var screen=document.getElementById("momentum-loading-screen");
      var root=document.getElementById("root");
      if(!screen||!root)return;
      var hide=function(){if(root.childNodes.length){screen.classList.add("is-hidden");window.setTimeout(function(){screen.remove()},400);return true}return false};
      if(hide())return;
      var observer=new MutationObserver(function(){if(hide())observer.disconnect()});
      observer.observe(root,{childList:true,subtree:true});
      window.addEventListener("pageshow",hide,{once:true});
    })();
  </script>`;
}

function injectLoadingScreen(html) {
  if (html.includes('id="momentum-loading-screen"')) return html;
  const rootMarkup = '<div id="root"></div>';
  if (!html.includes(rootMarkup)) {
    throw new Error('Expo web HTML is missing its #root mount point');
  }
  return html.replace(rootMarkup, `${createLoadingMarkup()}\n${rootMarkup}\n${createHideScript()}`);
}

module.exports = { injectLoadingScreen };
