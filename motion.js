/* =====================================================================
   2AE CONSEIL — MOTION DESIGN (JS léger, sans dépendance)
   À charger dans le <head>, juste après motion.css :
     <link rel="stylesheet" href="motion.css">
     <script src="motion.js"></script>
   Désactivation : <html lang="fr" data-motion="off"> ou retirer ces 2 lignes.
   ===================================================================== */
(function(){
  'use strict';

  /* ---------- Réglages centralisés ---------- */
  var CONFIG = {
    parallax:   { back: 14, mid: 24, hero: 28 },   // px max (desktop)
    mouse:      { back: 6,  mid: 12, hero: 9 },    // px max (desktop, pointeur fin)
    tabletFactor: 0.5,                             // 768–1100 px
    mobileParallax: false,                         // < 768 px : pas de parallaxe
    lerp: 0.06,                                    // inertie du suivi souris
    revealSelector: '.article-card, .card, .stats__item, .section__head, .tabpanel-cta, .cta-banner__inner, .team-grid > *, .values-grid > *, .timeline > *',
    revealStagger: [0, 100, 180, 260, 320, 380],   // ms selon la position dans la grille
    heroSelector: '.page-hero, .hero, .cta-banner',
    arrowSelector: '.article-card__link, .card__link, .btn',
    revealFailsafe: 3500                           // ms : tout s'affiche quoi qu'il arrive
  };

  var root = document.documentElement;
  if (root.getAttribute('data-motion') === 'off') return;
  if (!('IntersectionObserver' in window) || !window.requestAnimationFrame) return;

  // Posée immédiatement (script dans le <head>) : évite tout flash de contenu.
  root.classList.add('m-js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- Fond global ---------- */
  function buildBackground(){
    var wrap = document.createElement('div');
    wrap.className = 'motion-background';
    wrap.setAttribute('aria-hidden', 'true');
    // Couche arrière : grands arcs + filets. Couche intermédiaire : courbes et points.
    wrap.innerHTML =
      '<div class="motion-layer motion-layer--back">' +
        '<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">' +
          '<g class="motion-grid"><line x1="360" y1="-40" x2="360" y2="940"/><line x1="1080" y1="-40" x2="1080" y2="940"/></g>' +
          '<circle class="motion-orbit" cx="1560" cy="-180" r="860"/>' +
          '<circle class="motion-orbit motion-orbit--b" cx="-300" cy="1160" r="640"/>' +
        '</svg>' +
      '</div>' +
      '<div class="motion-layer motion-layer--mid">' +
        '<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">' +
          '<g class="motion-drift motion-drift--a">' +
            '<path class="motion-line motion-line--a" d="M-60 318 C 250 300 470 392 742 350 S 1150 214 1500 238"/>' +
          '</g>' +
          '<g class="motion-drift motion-drift--b">' +
            '<path class="motion-line motion-line--b" d="M-60 792 C 330 770 610 838 900 756 S 1250 640 1500 676"/>' +
          '</g>' +
          '<g class="motion-drift motion-drift--c">' +
            // Signature 2AE : une trajectoire ascendante, calme et continue.
            '<path id="m-sig" class="motion-curve motion-curve--signature" pathLength="1" d="M-80 700 C 230 690 380 548 640 560 S 1010 470 1180 360 S 1400 200 1540 176"/>' +
            '<path class="motion-curve motion-curve--echo" pathLength="1" d="M-80 742 C 250 734 410 600 670 612 S 1040 520 1210 414 S 1420 262 1540 240"/>' +
            dot('m-sig', 46, 0, 'a') +
            dot('m-sig', 46, 23, 'b') +
          '</g>' +
          '<path id="m-line-a" d="M-60 318 C 250 300 470 392 742 350 S 1150 214 1500 238" fill="none" stroke="none"/>' +
          dot('m-line-a', 60, 12, 'c') +
        '</svg>' +
      '</div>';
    document.body.insertBefore(wrap, document.body.firstChild);
    return wrap;
  }

  // Point qui glisse lentement le long d'une courbe, apparaît puis s'efface.
  function dot(pathId, dur, delay, key){
    var anim = 'dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite"';
    var fade = '<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.18;.72;1" ' + anim + '/>';
    var move = '<animateMotion ' + anim + ' keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#' + pathId + '"/></animateMotion>';
    return '<g class="motion-particle--' + key + '" opacity="0">' + fade + move +
             '<circle class="motion-particle-halo" r="7"/><circle class="motion-particle" r="2.1"/>' +
           '</g>';
  }

  /* ---------- Décor des bandeaux de tête ---------- */
  function isLight(el){
    var bg = getComputedStyle(el).backgroundImage !== 'none' ? '' : getComputedStyle(el).backgroundColor;
    if (!bg) return true; // .hero : dégradé clair
    var m = bg.match(/\d+(\.\d+)?/g); if (!m) return true;
    var l = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]);
    return l > 170;
  }
  function buildHero(el, i){
    var layer = document.createElement('div');
    layer.className = 'motion-hero' + (isLight(el) ? ' is-light' : '');
    layer.setAttribute('aria-hidden', 'true');
    var id = 'mh-c' + i;
    layer.innerHTML =
      '<svg viewBox="0 0 1440 520" preserveAspectRatio="xMidYMid slice" focusable="false">' +
        '<g class="mh-breath">' +
          '<circle class="mh-arc" cx="1290" cy="690" r="560"/>' +
          '<circle class="mh-arc mh-arc--thin" cx="1290" cy="690" r="640"/>' +
        '</g>' +
        '<g class="mh-slide">' +
          '<path id="' + id + '" class="mh-curve" pathLength="1" d="M-40 430 C 260 424 420 330 660 338 S 1020 262 1180 186 S 1390 88 1500 70"/>' +
          heroDot(id, 30, 0, 'a') + heroDot(id, 30, 15, 'b') +
        '</g>' +
      '</svg>';
    el.insertBefore(layer, el.firstChild);
    return layer;
  }
  function heroDot(pathId, dur, delay, key){
    var anim = 'dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite"';
    return '<g class="mh-dot--' + key + '" opacity="0">' +
             '<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.2;.7;1" ' + anim + '/>' +
             '<animateMotion ' + anim + '><mpath href="#' + pathId + '"/></animateMotion>' +
             '<circle class="mh-halo" r="8"/><circle class="mh-dot" r="2.4"/>' +
           '</g>';
  }

  /* ---------- Flèches « → » animables ---------- */
  function wrapArrows(){
    var els = document.querySelectorAll(CONFIG.arrowSelector);
    Array.prototype.forEach.call(els, function(el){
      if (el.querySelector('.m-arrow')) return;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var node, last = null;
      while ((node = walker.nextNode())) { if (node.nodeValue.indexOf('→') !== -1) last = node; }
      if (!last) return;
      var idx = last.nodeValue.lastIndexOf('→');
      var after = last.splitText(idx);
      after.splitText(1);
      var span = document.createElement('span');
      span.className = 'm-arrow'; span.setAttribute('aria-hidden', 'true'); span.textContent = '→';
      after.parentNode.replaceChild(span, after);
    });
  }

  /* ---------- Apparitions au défilement ---------- */
  function initReveal(){
    var items = Array.prototype.slice.call(document.querySelectorAll(CONFIG.revealSelector))
      .filter(function(el){ return !el.closest('.nav, .footer, .cookie-banner'); });
    // position dans sa grille => léger décalage
    items.forEach(function(el){
      var sibs = Array.prototype.filter.call(el.parentNode.children, function(c){ return items.indexOf(c) !== -1; });
      var pos = sibs.indexOf(el);
      var d = CONFIG.revealStagger[Math.min(pos, CONFIG.revealStagger.length - 1)] || 0;
      el.style.setProperty('--m-delay', d + 'ms');
      el.classList.add('m-reveal');
    });
    if (reduce.matches){ items.forEach(done); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        show(e.target); io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function(el){ io.observe(el); });
    // filet de sécurité : rien ne reste jamais caché
    setTimeout(function(){ items.forEach(function(el){ if (!el.classList.contains('m-in')) show(el); }); }, CONFIG.revealFailsafe);
  }
  function show(el){
    el.classList.add('m-in');
    var total = 700 + (parseFloat(el.style.getPropertyValue('--m-delay')) || 0);
    setTimeout(function(){ done(el); }, total);
  }
  function done(el){ el.classList.add('m-in', 'm-done'); el.style.removeProperty('--m-delay'); }

  /* ---------- Parallaxe + souris (une seule boucle rAF, à la demande) ---------- */
  function initDepth(bg, heroes){
    var back = bg.querySelector('.motion-layer--back');
    var mid  = bg.querySelector('.motion-layer--mid');
    var nav  = document.querySelector('.nav');
    var state = { sy: 0, mx: 0, my: 0, tx: 0, ty: 0 };
    var ticking = false, maxScroll = 1;

    function factor(){
      var w = window.innerWidth;
      if (w < 768) return CONFIG.mobileParallax ? 0.3 : 0;
      if (w <= 1100) return CONFIG.tabletFactor;
      return 1;
    }
    function measure(){ maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }

    function frame(){
      ticking = false;
      var f = reduce.matches ? 0 : factor();
      var p = Math.min(1, window.scrollY / maxScroll);
      // inertie de la souris
      state.mx += (state.tx - state.mx) * CONFIG.lerp;
      state.my += (state.ty - state.my) * CONFIG.lerp;
      var useMouse = finePointer.matches && f === 1 && !reduce.matches;
      var mx = useMouse ? state.mx : 0, my = useMouse ? state.my : 0;

      back.style.transform = 'translate3d(' + (-mx * CONFIG.mouse.back).toFixed(2) + 'px,' + (-p * CONFIG.parallax.back * f - my * CONFIG.mouse.back).toFixed(2) + 'px,0)';
      mid.style.transform  = 'translate3d(' + (-mx * CONFIG.mouse.mid).toFixed(2) + 'px,' + (-p * CONFIG.parallax.mid * f - my * CONFIG.mouse.mid).toFixed(2) + 'px,0)';
      heroes.forEach(function(h){
        var y = Math.min(window.scrollY, 400) / 400 * CONFIG.parallax.hero * f;
        h.style.transform = 'translate3d(' + (-mx * CONFIG.mouse.hero).toFixed(2) + 'px,' + (y - my * CONFIG.mouse.hero).toFixed(2) + 'px,0)';
      });
      if (nav) nav.classList.toggle('m-scrolled', window.scrollY > 12);

      // on continue tant que la souris n'est pas stabilisée
      if (useMouse && (Math.abs(state.tx - state.mx) > 0.001 || Math.abs(state.ty - state.my) > 0.001)) request();
    }
    function request(){ if (!ticking){ ticking = true; requestAnimationFrame(frame); } }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', function(){ measure(); request(); }, { passive: true });
    window.addEventListener('mousemove', function(e){
      if (!finePointer.matches) return;
      state.tx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 → 1
      state.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      request();
    }, { passive: true });
    document.addEventListener('mouseleave', function(){ state.tx = 0; state.ty = 0; request(); });
    window.addEventListener('load', function(){ measure(); request(); });
    measure(); request();
  }

  /* ---------- Démarrage ---------- */
  function start(){
    try {
      var bg = buildBackground();
      var heroes = Array.prototype.map.call(document.querySelectorAll(CONFIG.heroSelector), buildHero);
      if (reduce.matches){
        // pas de points animés : on retire les animations SMIL
        Array.prototype.forEach.call(document.querySelectorAll('.motion-background animate, .motion-background animateMotion, .motion-hero animate, .motion-hero animateMotion'), function(a){ a.parentNode.removeChild(a); });
      }
      wrapArrows();
      initReveal();
      initDepth(bg, heroes);
      requestAnimationFrame(function(){ root.classList.add('m-ready'); });
    } catch (err) {
      // En cas d'imprévu, le site reste strictement identique à l'original.
      root.classList.remove('m-js');
      if (window.console) console.warn('[2AE motion] désactivé :', err);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
