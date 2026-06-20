(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-main-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    if (slides.length <= 1) {
      return;
    }
    var prev = document.querySelector('[data-hero-prev]');
    var next = document.querySelector('[data-hero-next]');
    var index = 0;

    function show(nextIndex) {
      slides[index].classList.remove('is-active');
      index = (nextIndex + slides.length) % slides.length;
      slides[index].classList.add('is-active');
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
      });
    }
    window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function matchYear(year, filter) {
    if (!filter) {
      return true;
    }
    var value = Number(year || 0);
    if (filter === '2026') return value === 2026;
    if (filter === '2025') return value === 2025;
    if (filter === '2024') return value === 2024;
    if (filter === '2020-2023') return value >= 2020 && value <= 2023;
    if (filter === '2010-2019') return value >= 2010 && value <= 2019;
    if (filter === '2000-2009') return value >= 2000 && value <= 2009;
    if (filter === 'before-2000') return value > 0 && value < 2000;
    return true;
  }

  function initFilters() {
    var input = document.querySelector('[data-filter-input]');
    var year = document.querySelector('[data-year-filter]');
    var type = document.querySelector('[data-type-filter]');
    var count = document.querySelector('[data-result-count]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card, .ranking-row'));
    var empty = document.querySelector('[data-empty-state]');
    if (!cards.length || (!input && !year && !type)) {
      return;
    }

    function apply() {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var yearValue = year ? year.value : '';
      var typeValue = type ? type.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var searchText = (card.getAttribute('data-search') || '').toLowerCase();
        var cardYear = card.getAttribute('data-year') || '';
        var cardType = card.getAttribute('data-type') || '';
        var ok = true;
        if (keyword && searchText.indexOf(keyword) === -1) ok = false;
        if (!matchYear(cardYear, yearValue)) ok = false;
        if (typeValue && cardType.indexOf(typeValue) === -1) ok = false;
        card.style.display = ok ? '' : 'none';
        if (ok) visible += 1;
      });

      if (count) {
        count.textContent = '显示 ' + visible + ' 部';
      }
      if (empty) {
        empty.style.display = visible ? 'none' : 'block';
      }
    }

    if (input) input.addEventListener('input', apply);
    if (year) year.addEventListener('change', apply);
    if (type) type.addEventListener('change', apply);
    apply();
  }

  function initPlayer() {
    var frame = document.querySelector('[data-player]');
    if (!frame) {
      return;
    }

    var video = frame.querySelector('video');
    var overlay = frame.querySelector('[data-play-overlay]');
    var status = document.querySelector('[data-player-status]');
    var primarySource = frame.getAttribute('data-src');
    var fallbackSource = frame.getAttribute('data-fallback');
    var activeHls = null;

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function destroyHls() {
      if (activeHls) {
        activeHls.destroy();
        activeHls = null;
      }
    }

    function attachSource(source, allowFallback) {
      if (!video || !source) {
        setStatus('播放源暂不可用');
        return;
      }

      destroyHls();
      setStatus('正在加载视频');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.play().then(function () {
          setStatus('正在播放');
        }).catch(function () {
          setStatus('点击播放器继续播放');
        });
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        activeHls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60
        });
        activeHls.loadSource(source);
        activeHls.attachMedia(video);
        activeHls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().then(function () {
            setStatus('正在播放');
          }).catch(function () {
            setStatus('点击播放器继续播放');
          });
        });
        activeHls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            if (allowFallback && fallbackSource && source !== fallbackSource) {
              setStatus('正在切换播放线路');
              attachSource(fallbackSource, false);
            } else {
              setStatus('当前浏览器无法播放该视频');
            }
          }
        });
      } else {
        setStatus('当前浏览器不支持 HLS 播放');
      }
    }

    function start() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      attachSource(primarySource || fallbackSource, true);
    }

    if (overlay) {
      overlay.addEventListener('click', start);
    }
    frame.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        start();
      }
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayer();
  });
})();
