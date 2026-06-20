(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupHeader() {
    var header = document.querySelector("[data-header]");
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");

    function syncHeader() {
      if (!header) {
        return;
      }
      if (window.scrollY > 32) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });

    if (toggle && menu && header) {
      toggle.addEventListener("click", function () {
        menu.classList.toggle("is-open");
        header.classList.toggle("menu-open", menu.classList.contains("is-open"));
      });
    }
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }

    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function restart() {
      window.clearInterval(timer);
      start();
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        restart();
      });
    });

    start();
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));

    panels.forEach(function (panel) {
      var section = panel.closest("section") || document;
      var input = panel.querySelector("[data-filter-input]");
      var yearSelect = panel.querySelector("[data-filter-year]");
      var typeSelect = panel.querySelector("[data-filter-type]");
      var categorySelect = panel.querySelector("[data-filter-category]");
      var list = section.querySelector("[data-filter-list]");
      var empty = section.querySelector("[data-empty-state]");

      if (!list) {
        return;
      }

      var cards = Array.prototype.slice.call(list.children);
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q");
      if (query && input) {
        input.value = query;
      }

      function apply() {
        var keyword = normalize(input ? input.value : "");
        var year = normalize(yearSelect ? yearSelect.value : "");
        var type = normalize(typeSelect ? typeSelect.value : "");
        var category = normalize(categorySelect ? categorySelect.value : "");
        var visibleCount = 0;

        cards.forEach(function (card) {
          var text = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.year,
            card.dataset.type,
            card.dataset.category,
            card.dataset.tags,
            card.textContent
          ].join(" "));
          var matched = true;

          if (keyword && text.indexOf(keyword) === -1) {
            matched = false;
          }
          if (year && normalize(card.dataset.year) !== year) {
            matched = false;
          }
          if (type && normalize(card.dataset.type).indexOf(type) === -1) {
            matched = false;
          }
          if (category && normalize(card.dataset.category) !== category) {
            matched = false;
          }

          card.style.display = matched ? "" : "none";
          if (matched) {
            visibleCount += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", visibleCount === 0);
        }
      }

      [input, yearSelect, typeSelect, categorySelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  window.initMoviePlayer = function (streamUrl) {
    var video = document.getElementById("movieVideo");
    var overlay = document.getElementById("playerOverlay");
    var playToggle = document.getElementById("playToggle");
    var muteToggle = document.getElementById("muteToggle");
    var fullToggle = document.getElementById("fullToggle");
    var hlsInstance = null;

    if (!video || !streamUrl) {
      return;
    }

    function attachStream() {
      if (video.dataset.ready === "true") {
        return;
      }
      video.dataset.ready = "true";

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            hlsInstance.destroy();
          }
        });
      } else {
        video.src = streamUrl;
      }
    }

    function updatePlayState() {
      var playing = !video.paused && !video.ended;
      if (overlay) {
        overlay.classList.toggle("is-hidden", playing);
      }
      if (playToggle) {
        playToggle.textContent = playing ? "暂停" : "▶";
      }
    }

    function playVideo() {
      attachStream();
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    }

    function togglePlay() {
      if (video.paused || video.ended) {
        playVideo();
      } else {
        video.pause();
      }
    }

    if (overlay) {
      overlay.addEventListener("click", playVideo);
    }
    if (playToggle) {
      playToggle.addEventListener("click", togglePlay);
    }
    video.addEventListener("click", togglePlay);
    video.addEventListener("play", updatePlayState);
    video.addEventListener("pause", updatePlayState);
    video.addEventListener("ended", updatePlayState);

    if (muteToggle) {
      muteToggle.addEventListener("click", function () {
        video.muted = !video.muted;
        muteToggle.textContent = video.muted ? "静音" : "音量";
      });
    }

    if (fullToggle) {
      fullToggle.addEventListener("click", function () {
        var target = video.parentElement || video;
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (target.requestFullscreen) {
          target.requestFullscreen();
        }
      });
    }

    attachStream();
    updatePlayState();

    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  ready(function () {
    setupHeader();
    setupHero();
    setupFilters();
  });
})();
