// --- 간단 추적 함수 (GA/GTAG/태그매니저가 있으면 dataLayer로, 없으면 console로) ---
    window.dataLayer = window.dataLayer || [];
    function track(eventName, params={}){
      try{
        window.dataLayer.push(Object.assign({event:eventName, ts:Date.now()}, params));
      }catch(e){}
      if (window.console && console.info){
        console.info('[track]', eventName, params);
      }
    }



	// Mobile menu toggle + backdrop + scroll lock
    const body = document.body;
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('primaryNav');
    const backdrop = document.querySelector('.menu-backdrop');

    function openMenu(){
      body.classList.add('menu-open');
      toggle?.setAttribute('aria-expanded', 'true');
      track('menu_open');
    }
    function closeMenu(){
      body.classList.remove('menu-open');
      toggle?.setAttribute('aria-expanded', 'false');
      track('menu_close');
    }
    function isMenuOpen(){
      return body.classList.contains('menu-open');
    }

    toggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMenuOpen() ? closeMenu() : openMenu();
    });

    nav?.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && isMenuOpen()) {
        closeMenu();
      }
    });

    backdrop?.addEventListener('click', () => {
      if (isMenuOpen()) closeMenu();
    });

    document.addEventListener('click', (e) => {
      if (!isMenuOpen()) return;
      const withinToggle = toggle?.contains(e.target);
      const withinNav = nav?.contains(e.target);
      if (!withinToggle && !withinNav) closeMenu();
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen()) closeMenu();
    });

    // 연도 표시
    document.getElementById('year').textContent = new Date().getFullYear();

    // --- 클릭 추적 바인딩 ---
    const bindTrack = (id, name, more={})=>{
      const el = document.getElementById(id);
      el && el.addEventListener('click', ()=>track(name, more));
    };
    bindTrack('btnInstaTop', 'click_instagram', {pos:'hero'});
    bindTrack('btnBlogTop', 'click_blog', {pos:'hero'});
    bindTrack('btnInstaFooter', 'click_instagram', {pos:'footer'});
    bindTrack('btnBlogFooter', 'click_blog', {pos:'footer'});
    bindTrack('btnFloat', 'click_reserve', {pos:'float_cta'});
    bindTrack('btnMap', 'click_map', {pos:'location'});
    bindTrack('btnTop', 'click_back_to_top', {pos:'location'});





	(function(){
    const root = document.getElementById('mosaicSlider');
    if(!root) return;
    const trackEl = root.querySelector('.mosaic-track');
    const slides = Array.from(root.querySelectorAll('.mosaic'));
    const prev = root.querySelector('.mosaic-prev');
    const next = root.querySelector('.mosaic-next');
    const dotsWrap = root.querySelector('.mosaic-dots');

    let index = 0;
    let isPointerDown = false, isDragging = false, startX = 0, startY = 0, lastX = 0, deltaX = 0, lastT = 0, velocity = 0, moved = false;
    let autoplayId = null; const INTERVAL = 5000;

    slides.forEach((_, i)=>{
      const d = document.createElement('button');
      d.className = 'mosaic-dot' + (i===0?' is-active':'');
      d.setAttribute('aria-label', (i+1)+'번째 슬라이드로 이동');
      d.addEventListener('click', ()=>go(i));
      dotsWrap.appendChild(d);
    });

    function update(){
      trackEl.style.transform = `translateX(-${index*100}%)`;
      dotsWrap.querySelectorAll('.mosaic-dot').forEach((el,i)=>{ el.classList.toggle('is-active', i===index); });
    }
    function go(i){ index = (i+slides.length)%slides.length; update(); restartAutoplay(); track('gallery_slide', {index}); }

    prev.addEventListener('click', ()=>go(index-1));
    next.addEventListener('click', ()=>go(index+1));

    const ACTIVATE_PX = 12, ANGLE_RATIO = 1.2;

    const onDown = (e)=>{ isPointerDown = true; isDragging = false; moved = false;
      const p = getPoint(e); startX = lastX = p.x; startY = p.y; deltaX = 0; velocity = 0; lastT = performance.now(); stopAutoplay(); };

    const onMove = (e)=>{
      if(!isPointerDown) return;
      const p = getPoint(e); const dx = p.x - lastX;
      const dyFromStart = Math.abs(p.y - startY); const dxFromStart = Math.abs(p.x - startX);

      if(!isDragging){
        if(dxFromStart < ACTIVATE_PX && dyFromStart < ACTIVATE_PX){ return; }
        if(dxFromStart >= dyFromStart * ANGLE_RATIO){
          isDragging = true; trackEl.style.transition = 'none'; root.classList.add('dragging'); e.preventDefault?.();
        } else { cancelDrag(); return; }
      }

      const now = performance.now(); const dt = Math.max(1, now - lastT);
      velocity = 0.8*velocity + 0.2*(dx/dt);
      deltaX += dx; lastX = p.x; lastT = now; moved = true;

      const atFirst = index === 0 && deltaX > 0;
      const atLast = index === slides.length-1 && deltaX < 0;
      const resistance = (atFirst || atLast) ? 0.35 : 1;
      trackEl.style.transform = `translateX(calc(-${index*100}% + ${deltaX*resistance}px))`;
      e.preventDefault?.();
    };

    const onUp = ()=>{
      if(!isPointerDown) return;
      isPointerDown = false;

      if(!isDragging){ startAutoplay(); return; }

      trackEl.style.transition = ''; root.classList.remove('dragging');
      const width = root.clientWidth; const moveThreshold = Math.max(40, width*0.16); const velocityThreshold = 0.45/1000;
      const shouldPrev = (deltaX > moveThreshold) || (deltaX > 10 && velocity >  velocityThreshold);
      const shouldNext = (deltaX < -moveThreshold) || (deltaX < -10 && velocity < -velocityThreshold);
      if(shouldPrev) go(index-1); else if(shouldNext) go(index+1); else update();

      if(moved){
        const cancelClick = (ev)=>{ ev.stopPropagation(); ev.preventDefault(); trackEl.removeEventListener('click', cancelClick, true); };
        trackEl.addEventListener('click', cancelClick, true);
      }
      isDragging = false; deltaX = 0; velocity = 0; startAutoplay();
    };

    function getPoint(e){ if(e.touches && e.touches[0]) return {x:e.touches[0].clientX, y:e.touches[0].clientY}; return {x:e.clientX, y:e.clientY}; }
    function cancelDrag(){ isPointerDown = false; isDragging = false; deltaX = 0; velocity = 0; trackEl.style.transition = ''; root.classList.remove('dragging'); }

    trackEl.addEventListener('pointerdown', onDown, {passive:true});
    trackEl.addEventListener('pointermove', onMove);
    trackEl.addEventListener('pointerup', onUp);
    trackEl.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', update, {passive:true});

    function startAutoplay(){ if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; stopAutoplay(); autoplayId = setInterval(()=>go(index+1), INTERVAL); }
    function stopAutoplay(){ if(autoplayId) clearInterval(autoplayId); autoplayId = null; }
    function restartAutoplay(){ stopAutoplay(); startAutoplay(); }

    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stopAutoplay(); else startAutoplay(); });

    update(); startAutoplay();
  })();






  // Location 슬라이더
    (function(){
      const slider = document.querySelector('.location-slider');
      if(!slider) return;
      
      const slides = slider.querySelector('.location-slides');
      const slideItems = slider.querySelectorAll('.location-slide');
      const prevBtn = slider.querySelector('.location-prev');
      const nextBtn = slider.querySelector('.location-next');
      const dotsContainer = slider.querySelector('.location-dots');
      
      if(slideItems.length < 2) return;
      
      let currentIndex = 0;
      
      // 도트 생성
      slideItems.forEach((_, idx) => {
        const dot = document.createElement('span');
        dot.className = 'location-dot' + (idx === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(idx));
        dotsContainer.appendChild(dot);
      });
      
      const dots = dotsContainer.querySelectorAll('.location-dot');
      
      function goToSlide(index) {
        currentIndex = index;
        slides.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === currentIndex);
        });
      }
      
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slideItems.length) % slideItems.length;
        goToSlide(currentIndex);
      });
      
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slideItems.length;
        goToSlide(currentIndex);
      });
    })();



	(function(){
  class BarabomModal extends HTMLElement{
    constructor(){
      super();
      var root = this.attachShadow({ mode: 'open' });
      var primary = '#C9A661';
      var primaryDark = '#B8954D';
      
      var style =
        '<style>' +
        ':host{all:initial;font-family:"Noto Sans KR",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}' +
        '@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");' +
        
        '.bbm-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(10,12,16,.65);backdrop-filter:blur(12px) saturate(140%);-webkit-backdrop-filter:blur(12px) saturate(140%);animation:bbmFadeIn .35s cubic-bezier(.16,1,.3,1);padding:20px;overflow:auto;}' +
        '@keyframes bbmFadeIn{from{opacity:0}to{opacity:1}}' +
        '@keyframes bbmSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +
        
        '.bbm-card{position:relative;width:min(540px,calc(100% - 32px));max-width:calc(100vw - 32px);background:linear-gradient(to bottom,#ffffff,#fefdfb);border-radius:20px;padding:36px 32px 32px;box-shadow:0 24px 64px rgba(0,0,0,.14),0 0 0 1px rgba(201,166,97,.08) inset,0 1px 0 rgba(255,255,255,.4) inset;animation:bbmSlideUp .4s cubic-bezier(.16,1,.3,1);overflow:auto;max-height:calc(90vh - 40px);-webkit-overflow-scrolling:touch;}' +
        '.bbm-card::before{content:"";position:absolute;top:0;left:0;right:0;height:120px;background:linear-gradient(135deg,rgba(201,166,97,.04),transparent);pointer-events:none;}' +
        
        '.bbm-kicker{display:inline-flex;align-items:center;gap:6px;font-size:.65rem;letter-spacing:.18em;font-weight:800;color:#7A6433;background:linear-gradient(135deg,rgba(201,166,97,.08),rgba(201,166,97,.12));border:1px solid rgba(201,166,97,.2);padding:6px 12px;border-radius:999px;text-transform:uppercase;box-shadow:0 2px 8px rgba(201,166,97,.08);}' +
        '.bbm-kicker::before{content:"";width:5px;height:5px;border-radius:50%;background:'+primary+';box-shadow:0 0 8px '+primary+';}' +
        
        'h2{margin:16px 0 6px;font-size:clamp(1.3rem,3vw,1.6rem);line-height:1.25;font-weight:800;letter-spacing:-.02em;color:#18181B;}' +
        'h2 em{font-style:normal;background:linear-gradient(135deg,'+primaryDark+','+primary+');-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}' +
        
        '.bbm-sub{margin:0 0 20px;color:#52525B;font-size:.92rem;font-weight:500;line-height:1.5;}' +
        
        '.bbm-list{margin:0 0 20px;padding:0;list-style:none;display:grid;gap:10px;}' +
        '.bbm-item{display:flex;gap:12px;align-items:flex-start;font-size:.9rem;padding:10px 14px;border-radius:12px;background:rgba(250,250,250,.6);border:1px solid rgba(228,228,231,.6);transition:all .2s cubic-bezier(.4,0,.2,1);}' +
        '.bbm-item:hover{background:#fff;border-color:rgba(201,166,97,.25);box-shadow:0 4px 12px rgba(201,166,97,.06);transform:translateX(4px);}' +
        '.bbm-icon{margin-top:2px;width:20px;height:20px;flex-shrink:0;display:grid;place-items:center;border-radius:6px;background:linear-gradient(135deg,rgba(201,166,97,.12),rgba(201,166,97,.08));color:'+primaryDark+';}' +
        '.bbm-item span{color:#3F3F46;line-height:1.5;} .bbm-item b{color:#18181B;font-weight:700;}' +
        
        '.bbm-note{margin:0 0 24px;font-size:.9rem;color:#52525B;background:linear-gradient(135deg,#FAFAF9,#F5F5F4);border:1px solid #E7E5E4;border-left:3px solid '+primary+';border-radius:12px;padding:12px 16px;font-weight:500;}' +
        
        '.bbm-footer{display:grid;gap:18px;}' +
        '.bbm-addr{display:flex;gap:10px;align-items:center;color:#3F3F46;font-weight:600;font-size:.92rem;padding:12px 16px;background:rgba(250,250,250,.5);border:1px solid #E4E4E7;border-radius:12px;}' +
        '.bbm-addr svg{width:20px;height:20px;flex-shrink:0;color:'+primary+';}' +
        
        '.bbm-cta{display:flex;gap:12px;flex-wrap:wrap;}' +
        '.bbm-btn{all:unset;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 24px;border-radius:12px;font-weight:700;font-size:.95rem;transition:all .25s cubic-bezier(.4,0,.2,1);user-select:none;position:relative;overflow:hidden;}' +
        '.bbm-btn::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.2),transparent);opacity:0;transition:opacity .25s;}' +
        '.bbm-btn:hover::before{opacity:1;}' +
        
        '.bbm-btn--primary{color:#fff;background:linear-gradient(135deg,'+primaryDark+','+primary+');box-shadow:0 4px 16px rgba(201,166,97,.3),0 1px 0 rgba(255,255,255,.2) inset;border:none;text-shadow:0 1px 2px rgba(0,0,0,.1);}' +
        '.bbm-btn--primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(201,166,97,.35),0 1px 0 rgba(255,255,255,.2) inset;}' +
        '.bbm-btn--primary:active{transform:translateY(0);box-shadow:0 2px 8px rgba(201,166,97,.25);}' +
        
        '.bbm-btn--ghost{background:#fff;border:1.5px solid #E4E4E7;color:#3F3F46;box-shadow:0 1px 2px rgba(0,0,0,.04);}' +
        '.bbm-btn--ghost:hover{border-color:'+primary+';color:#18181B;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08);}' +
        
        '.bbm-search{color:#71717A;font-size:.88rem;text-align:center;font-weight:500;}.bbm-search b{color:#3F3F46;font-weight:700;}' +
        
        '.bbm-close{position:absolute;top:14px;right:14px;width:36px;height:36px;display:grid;place-items:center;border:1.5px solid #E4E4E7;border-radius:10px;background:#fff;cursor:pointer;transition:all .2s cubic-bezier(.4,0,.2,1);z-index:10;}' +
        '.bbm-close:hover{border-color:'+primary+';background:#FAFAFA;transform:rotate(90deg);box-shadow:0 4px 12px rgba(0,0,0,.08);}' +
        '.bbm-x{width:16px;height:16px;display:block;color:#52525B;}' +
        
        '@media(max-width:640px){' +
        '.bbm-overlay{padding:16px;}' +
        '.bbm-card{padding:32px 24px 24px;border-radius:18px;width:calc(100% - 32px);max-height: calc(90vh - 100px);}' +
        'h2{font-size:1.25rem;}' +
        '.bbm-cta{flex-direction:column;gap:10px;}.bbm-btn{width:100%;box-sizing:border-box;padding:13px 20px;}' +
        '.bbm-item{padding:9px 12px;gap:10px;font-size:.88rem;}' +
        '.bbm-list{gap:8px;}' +
        '.bbm-note{font-size:.88rem;padding:10px 14px;}' +
        '.bbm-addr{font-size:.9rem;padding:10px 14px;}' +
        '.bbm-close{top:12px;right:12px;width:32px;height:32px;}' +
		'.popup-title em{display:block;margin-top:2px;}' +
        '}' +
        '</style>';

      var html =
        '<div class="bbm-overlay" role="dialog" aria-modal="true" aria-labelledby="bbmTitle">' +
        '<div class="bbm-card" role="document">' +
        '<button class="bbm-close" aria-label="닫기">' +
        '<svg class="bbm-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<span class="bbm-kicker">Private Self Studio</span>' +
        '<h2 id="bbmTitle" class="popup-title">범계역 핫플 무인 셀프스튜디오 <em>바라봄</em></h2>' +
        '<p class="bbm-sub">100% 무인 예약제로 이용시간 동안 편안하고 자유로운 촬영이 가능합니다</p>' +
        '<ul class="bbm-list">' +
        '<li class="bbm-item"><span class="bbm-icon">◐</span><span><b>흑백+컬러</b> 모두 가능, 배경지(화이트·핑크) 자유 변경</span></li>' +
        '<li class="bbm-item"><span class="bbm-icon">₩</span><span><b>2~4인 3만원</b> 합리적인 가격</span></li>' +
        '<li class="bbm-item"><span class="bbm-icon">⏱</span><span>평일 <b>90분</b> / 주말·공휴일 <b>60분</b> (촬영~셀렉·인화)</span></li>' +
        '<li class="bbm-item"><span class="bbm-icon">∞</span><span><b>전체 원본 무료 제공</b> · 컷수 무제한</span></li>' +
        '<li class="bbm-item"><span class="bbm-icon">✓</span><span>인화본+원본 <b>즉시 수령</b> · 포토리뷰 시 <b>추가 인화 2장 무료</b></span></li>' +
        '<li class="bbm-item"><span class="bbm-icon">✦</span><span>카메라 <b>기본 자동보정</b> 적용</span></li>' +
        '<li class="bbm-item"><span class="bbm-icon">◈</span><span><b>탈의실·화장대·고데기</b>·촬영소품 완비</span></li>' +
        '</ul>' +
        '<div class="bbm-note">※ 증명사진/여권사진은 촬영하지 않습니다</div>' +
        '<div class="bbm-footer">' +
        '<div class="bbm-addr"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>안양시 동안구 시민대로 187 (범계역 도보 5분)</div>' +
        '<div class="bbm-cta">' +
        '<a class="bbm-btn bbm-btn--primary" href="https://map.naver.com/p/entry/place/1982834426?placePath=%2Fhome" target="_blank" rel="noopener nofollow">예약하기 →</a>' +
        '<button class="bbm-btn bbm-btn--ghost" data-close>닫기</button>' +
        '</div>' +
        '<div class="bbm-search">네이버에서 <b>\'범계 바라봄\'</b> 검색</div>' +
        '</div></div></div>';

      root.innerHTML = style + html;

      var overlay = root.querySelector('.bbm-overlay');
      var card = root.querySelector('.bbm-card');
      var closeBtn = root.querySelector('.bbm-close');
      var closeGhost = root.querySelector('[data-close]');
      var self = this;


		// --- scroll lock ---
		var savedScrollY = 0;
		var saved = { position:'', top:'', left:'', right:'', width:'', overflow:'', touchAction:'' };

		function lockScroll(){
		  savedScrollY = window.scrollY || window.pageYOffset || 0;
		  var b = document.body;
		  saved.position = b.style.position; saved.top = b.style.top; saved.left = b.style.left;
		  saved.right = b.style.right; saved.width = b.style.width; saved.overflow = b.style.overflow;
		  saved.touchAction = b.style.touchAction;

		  b.style.position = 'fixed';
		  b.style.top = (-savedScrollY) + 'px';
		  b.style.left = '0';
		  b.style.right = '0';
		  b.style.width = '100%';
		  b.style.overflow = 'hidden';
		  b.style.touchAction = 'none'; // iOS에서 백드롭 스크롤 방지
		}

		function unlockScroll(){
		  var b = document.body;
		  b.style.position = saved.position; b.style.top = saved.top; b.style.left = saved.left;
		  b.style.right = saved.right; b.style.width = saved.width; b.style.overflow = saved.overflow;
		  b.style.touchAction = saved.touchAction;
		  window.scrollTo(0, savedScrollY || 0);
		}






      function closeModal(){

		// 먼저 스크롤 잠금 해제
		unlockScroll();

        if (document.body.contains(self)) {
          overlay.style.animation = 'bbmFadeIn .2s ease reverse';
          card.style.animation = 'bbmSlideUp .2s ease reverse';
          setTimeout(function(){ 
            if(document.body.contains(self)) document.body.removeChild(self); 
          }, 200);
        }
      }
      
      overlay.addEventListener('click', function(e){ if(!card.contains(e.target)) closeModal(); });
      closeBtn.addEventListener('click', closeModal);
      closeGhost.addEventListener('click', closeModal);
      window.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); }, {passive:true});

	  // 모달 열릴 때 스크롤 잠금
		lockScroll();
    }
  }

  customElements.define('barabom-modal', BarabomModal);
  
  // 페이지 로드 시 팝업 표시
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      document.body.appendChild(document.createElement('barabom-modal'));
    });
  } else {
    document.body.appendChild(document.createElement('barabom-modal'));
  }
})();






/* BARABOM Reviews – responsive & looping single source of truth */
(function(){
  const root = document.getElementById('reviewSlider');
  if(!root) return;

  const track = root.querySelector('.review-track');
  const cards = Array.from(track.querySelectorAll('.review-card'));
  const prevBtn = root.querySelector('.review-prev');
  const nextBtn = root.querySelector('.review-next');
  const dotsWrap = root.querySelector('.review-dots');

  // --- state
  let gap = 0;                 // px (from CSS gap)
  let unit = 0;                // card width + gap
  let visible = 1;             // how many cards fit in viewport
  let totalPages = 1;          // ceil(cards.length / visible)
  let pageIndex = 0;           // 0-based page
  let autoplayId = null;
  const INTERVAL = 4500;

  // --- helpers
  const getGap = () => {
    const s = getComputedStyle(track);
    const g = parseFloat(s.gap || '0');
    return Number.isFinite(g) ? g : 0;
  };

  function measure(){
    if(!cards.length) return;
    gap = getGap();
    const w = cards[0].getBoundingClientRect().width;
    unit = w + gap;

    const viewportW = root.getBoundingClientRect().width;
    visible = Math.max(1, Math.floor((viewportW + gap) / unit));

    totalPages = Math.max(1, Math.ceil(cards.length / visible));
    // 페이지가 줄어도 현재 페이지를 안전하게 유지
    pageIndex = Math.min(pageIndex, totalPages - 1);
  }

  function pageStartIndex(pi){
    // 마지막 페이지가 꽉 차지 않아도 빈칸 없이 맞추기
    const start = pi * visible;
    const maxStart = Math.max(0, cards.length - visible);
    return Math.min(start, maxStart);
  }

  function applyTransform(){
    const start = pageStartIndex(pageIndex);
    const x = -start * unit;
    track.style.transform = `translate3d(${x}px,0,0)`;
    // dots
    dotsWrap.querySelectorAll('.review-dot').forEach((d,i)=>{
      d.classList.toggle('is-active', i === pageIndex);
    });
  }

  function renderDots(){
    dotsWrap.innerHTML = '';
    for(let i=0;i<totalPages;i++){
      const b = document.createElement('button');
      b.className = 'review-dot' + (i===pageIndex?' is-active':'');
      b.setAttribute('aria-label', `${i+1}번째 후기로 이동`);
      b.addEventListener('click', ()=>go(i));
      dotsWrap.appendChild(b);
    }
  }

  function go(i){
    pageIndex = (i % totalPages + totalPages) % totalPages; // 안전 모듈러
    applyTransform();
    restartAutoplay();
  }

  function next(){ go(pageIndex + 1); }
  function prev(){ go(pageIndex - 1); }

  // --- autoplay
  function startAutoplay(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stopAutoplay();
    autoplayId = setInterval(next, INTERVAL);
  }
  function stopAutoplay(){ if(autoplayId) clearInterval(autoplayId); autoplayId = null; }
  function restartAutoplay(){ stopAutoplay(); startAutoplay(); }

  // --- drag / swipe
  let down=false, startX=0, startY=0, lastX=0, deltaX=0, dragging=false;
  const ACTIVATE=10, ANG=1.2;

  const point = (e)=> e.touches ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : {x:e.clientX,y:e.clientY};

  function onDown(e){
    down = true; dragging = false; deltaX = 0;
    const p = point(e); startX = lastX = p.x; startY = p.y;
    track.style.transition = 'none';
    stopAutoplay();
  }
  function onMove(e){
    if(!down) return;
    const p = point(e);
    const dx = p.x - lastX;
    const adx = Math.abs(p.x - startX);
    const ady = Math.abs(p.y - startY);

    if(!dragging){
      if(adx < ACTIVATE && ady < ACTIVATE) return;
      if(adx >= ady * ANG) { dragging = true; e.preventDefault?.(); } 
      else { down = false; track.style.transition = ''; startAutoplay(); return; }
    }
    deltaX += dx; lastX = p.x;
    const base = -pageStartIndex(pageIndex) * unit;
    track.style.transform = `translate3d(${base + deltaX}px,0,0)`;
    e.preventDefault?.();
  }
  function onUp(){
    if(!down) return;
    down = false; track.style.transition = '';
    const width = root.clientWidth;
    const threshold = Math.max(40, width * 0.14);
    if(deltaX > threshold) prev();
    else if(deltaX < -threshold) next();
    else applyTransform();
    deltaX = 0; dragging = false; startAutoplay();
  }

  // --- bind
  nextBtn?.addEventListener('click', next);
  prevBtn?.addEventListener('click', prev);

  track.addEventListener('pointerdown', onDown, {passive:true});
  track.addEventListener('pointermove', onMove);
  track.addEventListener('pointerup', onUp);
  track.addEventListener('pointercancel', onUp);

  window.addEventListener('resize', ()=>{ 
    const prevVisible = visible;
    measure();
    // 가시 카드 수가 바뀌면 점, 위치 재계산
    if (visible !== prevVisible) renderDots();
    applyTransform();
  }, {passive:true});

  document.addEventListener('visibilitychange', ()=>{ 
    if(document.hidden) stopAutoplay(); else startAutoplay(); 
  });

  // --- init
  measure();
  renderDots();
  applyTransform();
  startAutoplay();
})();




  // 주소창 숨김 강제 시도
  window.addEventListener('load', () => {
    setTimeout(() => window.scrollTo(0, 1), 100);
  });


// Lazy 이미지 '조금 일찍' 부드럽게: 뷰포트 ±800px에서 미리 디코드
(function(){
  if (!('IntersectionObserver' in window)) return;

  // 히어로/로고는 이미 eager로 바꿨으니 제외하고, 나머지 lazy 이미지만
  const lazies = Array.from(document.querySelectorAll('img[loading="lazy"]'));
  // 네트워크 우선순위도 한 단계 낮춰서 초기 병목 방지
  lazies.forEach(img => img.setAttribute('fetchpriority','low'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      try { await img.decode(); } catch(e) {}
      io.unobserve(img);
    });
  }, { rootMargin: '800px 0px' });

  lazies.forEach(img => io.observe(img));
})();







