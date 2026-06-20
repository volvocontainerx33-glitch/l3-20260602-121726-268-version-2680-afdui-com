(function () {
  'use strict';

  var hlsScriptPromise = null;

  function loadHlsLibrary() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsScriptPromise) {
      return hlsScriptPromise;
    }

    hlsScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = function () {
        reject(new Error('HLS 播放库加载失败'));
      };
      document.head.appendChild(script);
    });

    return hlsScriptPromise;
  }

  function initMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHero() {
    var root = document.querySelector('[data-hero]');

    if (!root) {
      return;
    }

    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initPlayer() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    players.forEach(function (player) {
      var video = player.querySelector('video[data-video-src]');
      var button = player.querySelector('[data-play-button]');

      if (!video || !button) {
        return;
      }

      button.addEventListener('click', function () {
        var source = video.getAttribute('data-video-src');

        if (!source) {
          return;
        }

        button.classList.add('is-hidden');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.play().catch(function () {});
          return;
        }

        loadHlsLibrary()
          .then(function (Hls) {
            if (Hls && Hls.isSupported()) {
              var hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
              });
              hls.loadSource(source);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play().catch(function () {});
              });
            } else {
              video.src = source;
              video.play().catch(function () {});
            }
          })
          .catch(function () {
            video.src = source;
            video.play().catch(function () {});
          });
      });
    });
  }

  function initCatalogFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));

    panels.forEach(function (panel) {
      var grid = panel.parentElement.querySelector('[data-catalog-grid]');
      var keyword = panel.querySelector('[data-filter-keyword]');
      var year = panel.querySelector('[data-filter-year]');
      var region = panel.querySelector('[data-filter-region]');
      var count = panel.querySelector('[data-filter-count]');

      if (!grid) {
        return;
      }

      var cards = Array.prototype.slice.call(grid.querySelectorAll('.catalog-card'));

      if (year && year.options.length <= 1) {
        var years = Array.from(new Set(cards.map(function (card) {
          return card.getAttribute('data-year') || '';
        }).filter(Boolean))).sort().reverse();
        years.slice(0, 40).forEach(function (item) {
          var option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          year.appendChild(option);
        });
      }

      if (region && region.options.length <= 1) {
        var regions = Array.from(new Set(cards.map(function (card) {
          return card.getAttribute('data-region') || '';
        }).filter(Boolean))).sort();
        regions.slice(0, 60).forEach(function (item) {
          var option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          region.appendChild(option);
        });
      }

      function applyFilter() {
        var word = keyword ? keyword.value.trim().toLowerCase() : '';
        var selectedYear = year ? year.value : '';
        var selectedRegion = region ? region.value : '';
        var visible = 0;

        cards.forEach(function (card) {
          var text = [
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-tags')
          ].join(' ').toLowerCase();
          var matchesWord = !word || text.indexOf(word) !== -1;
          var matchesYear = !selectedYear || card.getAttribute('data-year') === selectedYear;
          var matchesRegion = !selectedRegion || card.getAttribute('data-region') === selectedRegion;
          var show = matchesWord && matchesYear && matchesRegion;

          card.classList.toggle('is-hidden-card', !show);
          if (show) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = '显示 ' + visible + ' 部 / 共 ' + cards.length + ' 部';
        }
      }

      [keyword, year, region].forEach(function (control) {
        if (control) {
          control.addEventListener('input', applyFilter);
          control.addEventListener('change', applyFilter);
        }
      });
    });
  }

  function movieCardHtml(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card catalog-card">',
      '  <a class="movie-poster" href="' + escapeHtml(movie.url) + '" aria-label="观看' + escapeHtml(movie.title) + '">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="poster-shade"></span>',
      '    <span class="poster-play">▶</span>',
      '    <span class="poster-duration">45分钟</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <div class="movie-meta-line">',
      '      <a href="' + escapeHtml(movie.categoryUrl) + '">' + escapeHtml(movie.categoryName) + '</a>',
      '      <span>' + escapeHtml(movie.year) + '</span>',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '    </div>',
      '    <h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var results = document.querySelector('[data-search-results]');

    if (!results || !window.MOVIE_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();
    var input = document.querySelector('[data-search-input]');
    var title = document.querySelector('[data-search-title]');
    var empty = document.querySelector('[data-search-empty]');

    if (input) {
      input.value = query;
    }

    if (!query) {
      results.innerHTML = '';
      if (empty) {
        empty.style.display = 'block';
      }
      return;
    }

    var keyword = query.toLowerCase();
    var matched = window.MOVIE_INDEX.filter(function (movie) {
      var text = [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        (movie.tags || []).join(' '),
        movie.oneLine
      ].join(' ').toLowerCase();
      return text.indexOf(keyword) !== -1;
    });

    if (title) {
      title.textContent = '“' + query + '” 的搜索结果：' + matched.length + ' 部';
    }

    if (empty) {
      empty.style.display = matched.length ? 'none' : 'block';
      empty.textContent = matched.length ? '' : '没有找到匹配影片，请尝试更换关键词。';
    }

    results.innerHTML = matched.slice(0, 240).map(movieCardHtml).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initPlayer();
    initCatalogFilters();
    initSearchPage();
  });
}());
