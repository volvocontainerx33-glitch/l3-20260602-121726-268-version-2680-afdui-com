(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function startTimer() {
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5000);
    }

    function restartTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
      startTimer();
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        restartTimer();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(index - 1);
        restartTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(index + 1);
        restartTimer();
      });
    }

    showSlide(0);
    startTimer();
  }

  var localInput = document.querySelector('[data-local-search]');

  if (localInput) {
    localInput.addEventListener('input', function () {
      var value = localInput.value.trim().toLowerCase();
      var cards = document.querySelectorAll('[data-search-card]');
      cards.forEach(function (card) {
        var text = ((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-meta') || '') + ' ' + card.textContent).toLowerCase();
        card.classList.toggle('hidden', value && text.indexOf(value) === -1);
      });
    });
  }

  var dataScript = document.getElementById('movieSearchData');
  var resultBox = document.getElementById('searchResults');
  var resultInfo = document.getElementById('searchResultInfo');
  var searchInput = document.getElementById('globalSearchInput');

  if (dataScript && resultBox && searchInput) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    var movies = [];

    try {
      movies = JSON.parse(dataScript.textContent || '[]');
    } catch (error) {
      movies = [];
    }

    searchInput.value = query;

    function makeCard(movie) {
      return [
        '<article class="poster-card">',
        '  <a class="poster-cover" href="' + movie.url + '">',
        '    <img src="' + movie.image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '    <span class="poster-year">' + (movie.year || '') + '</span>',
        '    <span class="poster-play">播放</span>',
        '  </a>',
        '  <div class="poster-body">',
        '    <h3><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>',
        '    <p>' + escapeHtml(movie.oneLine || '') + '</p>',
        '    <div class="poster-meta"><span>' + escapeHtml(movie.region || '') + '</span><span>' + escapeHtml(movie.type || '') + '</span></div>',
        '  </div>',
        '</article>'
      ].join('');
    }

    function renderSearch(value) {
      var keyword = value.trim().toLowerCase();
      var list = keyword ? movies.filter(function (movie) {
        return String(movie.meta || '').toLowerCase().indexOf(keyword) !== -1;
      }) : movies.slice(0, 60);
      var limited = list.slice(0, 120);
      resultInfo.textContent = keyword ? '找到 ' + list.length + ' 条相关影片' : '推荐展示 60 条影片，可输入关键词继续搜索';
      resultBox.innerHTML = limited.map(makeCard).join('');
    }

    searchInput.addEventListener('input', function () {
      renderSearch(searchInput.value);
    });

    renderSearch(query);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  var players = document.querySelectorAll('[data-player]');

  players.forEach(function (player) {
    var video = player.querySelector('video[data-src]');
    var button = player.querySelector('[data-player-start]');

    if (!video || !button) {
      return;
    }

    function attachSource() {
      var source = video.getAttribute('data-src');

      if (!source) {
        return Promise.resolve();
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        if (video.src !== source) {
          video.src = source;
        }
        return Promise.resolve();
      }

      if (window.Hls && window.Hls.isSupported()) {
        if (!video.__hlsInstance) {
          var hls = new window.Hls();
          hls.loadSource(source);
          hls.attachMedia(video);
          video.__hlsInstance = hls;
        }
        return Promise.resolve();
      }

      if (video.src !== source) {
        video.src = source;
      }
      return Promise.resolve();
    }

    function playVideo() {
      attachSource().then(function () {
        player.classList.add('playing');
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            player.classList.remove('playing');
          });
        }
      });
    }

    button.addEventListener('click', playVideo);
    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      }
    });
    video.addEventListener('play', function () {
      player.classList.add('playing');
    });
    video.addEventListener('pause', function () {
      if (!video.ended) {
        player.classList.remove('playing');
      }
    });
  });
})();
