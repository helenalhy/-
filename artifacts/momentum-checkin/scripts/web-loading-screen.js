'use strict';

/**
 * Web-only loading screen injected into the exported index.html.
 * It shows the fourteen shopkeeper dogs (new fluffy heads, transparent
 * PNGs under assets/dogs-expressions/, copied into the web build as
 * dogs-expressions/) while the app bundle loads.
 *
 * Layout follows the existing prototype: pale-pink page, a single heart
 * on top (56px, no rounded square behind it), two rows of seven dogs,
 * then the "載入中." title and subtitle.
 *
 * Animation (loops until the app mounts):
 * - each dog cycles its four expressions ping-pong
 *   (smile -> wink -> tongue -> closed-eyes -> tongue -> wink),
 *   one frame every 300ms, so one loop takes 1.8s;
 * - the dogs bounce in a travelling wave, left to right, with a phase
 *   offset per dog and ~10px amplitude;
 * - the heart pulses +/-5% on the same 1.8s loop;
 * - the dots after "載入中" cycle . -> .. -> ... -> .
 *
 * Plain CSS + a tiny inline script (no GIF): the screen has to run
 * before the React bundle loads, so it cannot use the React Native
 * Animated API. The CSS animations and the frame swap below are the
 * web equivalent.
 */

const HEART_PATH = 'M24 40 7.8 24.2C-1 14.8 5.1 5 14.4 5c4.2 0 7.5 2.1 9.6 5.2C26.1 7.1 29.4 5 33.6 5 42.9 5 49 14.8 40.2 24.2L24 40Z';

// Folder (relative to the exported index.html) holding the 56
// transparent head images, copied there by scripts/build.js.
const IMAGE_BASE = 'dogs-expressions/';

// Shopkeeper list order: top row first, then the bottom row.
// Each dog has four expression frames in smile, wink, tongue,
// closed-eyes order (see expressions-manifest.json; the transparent
// file is the manifest base name with .webp replaced by -nobg.png).
const DOGS = [
  { id: 'huahua', name: '花花', frames: [
    'media-generation-huahua-smile-0-b3918998-2cff-4127-9ca7-d5075d0cf14b-nobg.png',
    'media-generation-huahua-wink-v2-0-1adeb012-6948-49b4-8afa-0a583d630784-nobg.png',
    'media-generation-huahua-tongue-v2-0-2a767f28-905a-447d-be4b-d97d2f8ab89e-nobg.png',
    'media-generation-huahua-closed-eyes-v2-0-a60d1564-416c-4631-8754-889436872b46-nobg.png',
  ] },
  { id: 'naixi', name: '奶昔', frames: [
    'media-generation-naixi-smile-pinkcheeks-0-c18c1de5-f56c-4726-ae8b-aca12db2790b-nobg.png',
    'media-generation-naixi-wink-0-e49e8674-9403-4f90-afe2-8bc5539be251-nobg.png',
    'media-generation-naixi-tongue-0-55887577-ee5d-44a7-b948-63ef128ff73a-nobg.png',
    'media-generation-naixi-closed-eyes-0-a199577e-d416-44bc-bd9e-8bef86e9302f-nobg.png',
  ] },
  { id: 'xiaoniu', name: '小牛', frames: [
    'media-generation-xiaoniu-smile-v1style-0-cd78130a-5205-4b6c-9404-b7f6de7ed02a-nobg.png',
    'media-generation-xiaoniu-wink-0-678211a7-49b1-4d87-a65c-5cc813c04d6a-nobg.png',
    'media-generation-xiaoniu-tongue-0-40140437-9256-4909-83ef-f44c4552ff70-nobg.png',
    'media-generation-xiaoniu-closed-eyes-0-3d62fee1-4f90-4ba7-9f21-03db4faae1eb-nobg.png',
  ] },
  { id: 'buding', name: '布丁', frames: [
    'media-generation-buding-smile-v1style-0-09364d5e-f8ed-41ce-8eee-164ef5479b77-nobg.png',
    'media-generation-buding-wink-0-46893ed0-7301-4a31-aeeb-86cf569f5ec5-nobg.png',
    'media-generation-buding-tongue-0-be938d45-886a-4b05-85be-ff0a231db3dd-nobg.png',
    'media-generation-buding-closed-eyes-0-0b9f4b08-1e71-4e8a-b62b-ed17c5036be4-nobg.png',
  ] },
  { id: 'tangtang', name: '糖糖', frames: [
    'media-generation-tangtang-smile-0-f89f9ace-217f-4198-9e9f-a8a601964cd5-nobg.png',
    'media-generation-tangtang-wink-0-b6b4d5eb-bc8e-447a-9df4-29007da7ae24-nobg.png',
    'media-generation-tangtang-tongue-0-441231a2-7987-4435-af5f-f38284705caf-nobg.png',
    'media-generation-tangtang-closed-eyes-0-d8b115cd-90ad-4ca4-bdef-83e9be7208a4-nobg.png',
  ] },
  { id: 'pipi', name: '皮皮', frames: [
    'media-generation-pipi-smile-0-1a592d46-7735-410e-837b-4f545891daeb-nobg.png',
    'media-generation-pipi-wink-0-463f0ccd-a69d-4aa6-a2ec-792f15329578-nobg.png',
    'media-generation-pipi-tongue-0-24c2ca57-5654-47b3-b0ee-0f28f171157a-nobg.png',
    'media-generation-pipi-closed-eyes-0-ef131594-60a0-40b8-b08b-4915c24a85cf-nobg.png',
  ] },
  { id: 'hupo', name: '琥珀', frames: [
    'media-generation-hupo-smile-0-d751f6f6-fc32-4fdf-a1ae-433b5601b778-nobg.png',
    'media-generation-hupo-wink-0-a8bc7e0d-9a6a-4850-b52d-6ab41cafe2a8-nobg.png',
    'media-generation-hupo-tongue-0-5bb8574d-d1f6-43cd-a8a3-c15306c67fd5-nobg.png',
    'media-generation-hupo-closed-eyes-0-e4930dcc-dcd6-421e-b9a6-1e9892ea1c8b-nobg.png',
  ] },
  { id: 'yunduo', name: '雲朵', frames: [
    'media-generation-yunduo-smile-0-0150a8d9-93cb-4769-a403-4911643e811e-nobg.png',
    'media-generation-yunduo-wink-0-156f2fa6-79f7-4ad5-a6a2-19a45f25920e-nobg.png',
    'media-generation-yunduo-tongue-0-b44a7c25-d612-46e3-a744-05d67f636ba7-nobg.png',
    'media-generation-yunduo-closed-eyes-0-e874ab0a-d06f-44ef-97ad-0f11db4c3ff2-nobg.png',
  ] },
  { id: 'yuntun', name: '雲吞', frames: [
    'media-generation-yuntun-smile-pinkcheeks-0-9c02c62e-c4a3-40a9-8d77-6aae599c13dc-nobg.png',
    'media-generation-yuntun-wink-pinkcheeks-0-b274380a-d302-4c40-b9b1-e3da143d2316-nobg.png',
    'media-generation-yuntun-tongue-pinkcheeks-0-fbcced3a-dbd1-436c-9480-b123897a5030-nobg.png',
    'media-generation-yuntun-closed-eyes-pinkcheeks-0-c06a8a85-02b8-4669-8a15-00e3f8c656e7-nobg.png',
  ] },
  { id: 'naiyou', name: '奶油', frames: [
    'media-generation-naiyou-smile-v2-0-5513ab38-bd9f-4bbb-a713-5e74308b1d81-nobg.png',
    'media-generation-naiyou-wink-0-15b4ce91-168a-4e40-ba90-e6e4d2423d15-nobg.png',
    'media-generation-naiyou-tongue-0-e5d77bbd-b5ce-4fb6-859d-a6f5f27061a6-nobg.png',
    'media-generation-naiyou-closed-eyes-0-66f679e2-d90c-4ac3-bdc0-9dc70796a732-nobg.png',
  ] },
  { id: 'zhima', name: '芝麻', frames: [
    'media-generation-zhima-smile-0-2dc0a39f-e67d-4cf1-a0b7-101e64e3108f-nobg.png',
    'media-generation-zhima-wink-v2-0-446533bb-26fa-4be2-90b4-9c99697607d6-nobg.png',
    'media-generation-zhima-tongue-0-e4771634-b193-46c1-bfc6-947884b05d96-nobg.png',
    'media-generation-zhima-closed-eyes-0-709b0f0e-1f50-4ab0-9b22-b328f3a4aa3e-nobg.png',
  ] },
  { id: 'xueqiu', name: '雪球', frames: [
    'media-generation-xueqiu-smile-v2-0-68861154-bbca-484e-a3a7-d7ebd7458ffb-nobg.png',
    'media-generation-xueqiu-wink-0-712a0584-a03d-4792-af33-ef92adaeb3eb-nobg.png',
    'media-generation-xueqiu-tongue-0-e9cdb183-83a7-43e8-b846-6bbf56ce84d7-nobg.png',
    'media-generation-xueqiu-closed-eyes-0-ce320fb3-fa07-4455-9653-ccc4f1166c7e-nobg.png',
  ] },
  { id: 'maomao', name: '毛毛', frames: [
    'media-generation-maomao-smile-0-5528dd02-955e-4a32-aa4d-9150ae08f3e7-nobg.png',
    'media-generation-maomao-wink-0-b0ca5f14-7991-46f6-8cfe-3266f7e36603-nobg.png',
    'media-generation-maomao-tongue-0-584d31bd-db72-4bbe-be67-87ea1539ec82-nobg.png',
    'media-generation-maomao-closed-eyes-v2-0-eecfab9f-85a3-41a7-b33d-a48e98542ed4-nobg.png',
  ] },
  { id: 'bobi', name: '波比', frames: [
    'media-generation-bobi-smile-v6-0-6239dcff-ef77-46bb-a3b7-ee726a4e535e-nobg.png',
    'media-generation-bobi-wink-0-76207f4e-5bba-48e8-b7ec-c634b36b85a3-nobg.png',
    'media-generation-bobi-tongue-0-90b7fb55-489d-41c0-a893-068f7f9fb4b8-nobg.png',
    'media-generation-bobi-closed-eyes-0-1d2ddd60-db5e-4a27-adeb-9754ab80f2ce-nobg.png',
  ] },
];

// Ping-pong order over the four frames, one frame every 300ms:
// smile -> wink -> tongue -> closed-eyes -> tongue -> wink (1.8s loop).
const EXPRESSION_ORDER = [0, 1, 2, 3, 2, 1];
const FRAME_MS = 300;
const LOOP_MS = 1800;

// One dog image: free-floating transparent head, no circular frame.
// --delay staggers the bounce so the wave travels left to right
// across the fourteen dogs over one 1.8s loop (negative delay so the
// wave is already moving when the screen first appears).
function dogImg(dog, index) {
  const urls = dog.frames.map((file) => IMAGE_BASE + file);
  const delay = -(index * Math.round(LOOP_MS / DOGS.length));
  return '<img class="loader-dog" src="' + urls[0] + '" data-frames="' + urls.join('|') + '" alt="' + dog.name + '" draggable="false" style="--delay:' + delay + 'ms">';
}

function createLoadingMarkup() {
  const dogs = DOGS.map(dogImg).join('');
  return '<style id="momentum-loader-style">'
    + '#momentum-loading-screen{position:fixed; inset:0; z-index:2147483000; display:flex; align-items:center; justify-content:center; background:#FEF7FA; color:#5A4A52; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; transition:opacity .32s ease, visibility .32s ease}'
    + '#momentum-loading-screen.is-hidden{opacity:0; visibility:hidden; pointer-events:none}'
    + '.momentum-loader-inner{width:min(340px,90vw); text-align:center}'
    + '.momentum-loader-heart{width:72px; height:72px; margin:0 auto 18px; animation:momentum-heartbeat 1.8s ease-in-out infinite}'
    + '.momentum-loader-heart svg{display:block; width:72px; height:72px}'
    + '.momentum-loader-dogs{display:grid; grid-template-columns:repeat(7,1fr); gap:2px 6px; max-width:320px; margin:0 auto 14px; align-items:center}'
    + '.loader-dog{display:block; width:40px; max-height:56px; height:auto; justify-self:center; object-fit:contain; animation:momentum-dog-bounce 1.8s ease-in-out infinite; animation-delay:var(--delay)}'
    + '.momentum-loader-label{font-size:14px; font-weight:700; letter-spacing:.16em}'
    + '.momentum-loader-dots:after{display:inline-block; width:18px; text-align:left; animation:momentum-dots 1.2s steps(4,end) infinite; content:""}'
    + '.momentum-loader-note{font-size:11px; margin-top:6px; color:#947d8c}'
    + '@keyframes momentum-heartbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}'
    + '@keyframes momentum-dog-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}'
    + '@keyframes momentum-dots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}'
    + '</style>'
    + '<div id="momentum-loading-screen">'
    + '<div class="momentum-loader-inner">'
    + '<div class="momentum-loader-heart"><svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true"><path d="' + HEART_PATH + '" fill="#E883A9"/></svg></div>'
    + '<div class="momentum-loader-dogs">' + dogs + '</div>'
    + '<div class="momentum-loader-label">載入中<span class="momentum-loader-dots"></span></div>'
    + '<div class="momentum-loader-note">狗狗店員正在準備迎接你</div>'
    + '</div>'
    + '</div>'
    + createExpressionScript();
}

// Swaps each dog's head through its four expressions ping-pong
// (smile -> wink -> tongue -> closed-eyes -> tongue -> wink), one
// frame every 300ms. All fourteen dogs change together; the bounce
// wave (CSS) is what travels. Runs until the app mounts and the
// loading screen is removed. Frames are preloaded up front so the
// first loop does not flicker while the other expressions download.
function createExpressionScript() {
  return `<script>
    (function(){
      var dogs=document.querySelectorAll('#momentum-loading-screen .loader-dog');
      if(!dogs.length)return;
      var frames=[];
      var order=[0,1,2,3,2,1];
      for(var i=0;i<dogs.length;i++){
        var list=(dogs[i].getAttribute('data-frames')||'').split('|');
        frames.push(list);
        for(var j=0;j<list.length;j++){var pre=new Image();pre.src=list[j];}
      }
      var step=0;
      window.setInterval(function(){
        step=(step+1)%order.length;
        var frame=order[step];
        for(var k=0;k<dogs.length;k++){
          var src=frames[k][frame];
          if(src&&dogs[k].getAttribute('src')!==src){dogs[k].setAttribute('src',src);}
        }
      },300);
    })();
  </script>`;
}

function createHideScript() {
  return `<script>
    (function(){
      var screen=document.getElementById("momentum-loading-screen");
      var root=document.getElementById("root");
      if(!screen||!root)return;
      var hide=function(){
        if(root.childNodes.length){
          screen.classList.add("is-hidden");
          window.setTimeout(function(){screen.remove()},450);
          return true;
        }
        return false;
      };
      if(hide())return;
      var observer=new MutationObserver(function(){if(hide()){observer.disconnect()}});
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

module.exports = { injectLoadingScreen, DOGS, IMAGE_BASE, EXPRESSION_ORDER, FRAME_MS, LOOP_MS };
