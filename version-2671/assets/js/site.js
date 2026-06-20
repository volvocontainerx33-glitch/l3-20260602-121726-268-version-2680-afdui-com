(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMobileMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function setupHeroCarousel() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var previous = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    if (previous) {
      previous.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupSearchForms() {
    var forms = document.querySelectorAll(".hero-search");

    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (!input || !input.value.trim()) {
          event.preventDefault();
          window.location.href = form.getAttribute("action") || "search.html";
        }
      });
    });
  }

  function setupFilters() {
    var panel = document.querySelector("[data-filter-scope]");
    var list = document.querySelector("[data-card-list]");

    if (!panel || !list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.querySelectorAll("[data-movie-card]"));
    var input = panel.querySelector("[data-filter-input]");
    var year = panel.querySelector("[data-year-filter]");
    var region = panel.querySelector("[data-region-filter]");
    var type = panel.querySelector("[data-type-filter]");
    var counter = panel.querySelector("[data-filter-count]");
    var empty = document.querySelector("[data-empty-result]");
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";

    if (input && query) {
      input.value = query;
    }

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function apply() {
      var keyword = normalize(input && input.value);
      var selectedYear = normalize(year && year.value);
      var selectedRegion = normalize(region && region.value);
      var selectedType = normalize(type && type.value);
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.dataset.title,
          card.dataset.tags,
          card.dataset.region,
          card.dataset.type,
          card.dataset.category,
          card.textContent
        ].join(" "));
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchYear = !selectedYear || normalize(card.dataset.year) === selectedYear;
        var matchRegion = !selectedRegion || normalize(card.dataset.region).indexOf(selectedRegion) !== -1;
        var matchType = !selectedType || normalize(card.dataset.type).indexOf(selectedType) !== -1;
        var shouldShow = matchKeyword && matchYear && matchRegion && matchType;

        card.hidden = !shouldShow;
        if (shouldShow) {
          visible += 1;
        }
      });

      if (counter) {
        counter.textContent = "显示 " + visible + " 部";
      }

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    [input, year, region, type].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });

    apply();
  }

  function setupImageFallbacks() {
    var images = document.querySelectorAll("img");

    images.forEach(function (image) {
      image.addEventListener("error", function () {
        var frame = image.closest(".poster-frame, .category-tile, .category-cover, .hero-slide, .category-hero, .detail-hero");
        image.style.opacity = "0";
        if (frame) {
          frame.classList.add("image-missing");
        }
      });
    });
  }

  function setupPlayers() {
    var players = document.querySelectorAll("[data-video-player]");

    players.forEach(function (player) {
      var button = player.querySelector("[data-player-play]");
      var overlay = player.querySelector("[data-player-overlay]");
      var video = player.querySelector("video");
      var message = player.querySelector("[data-player-message]");
      var source = player.dataset.videoUrl;
      var hlsInstance = null;
      var initialized = false;

      function showMessage(text) {
        if (!message) {
          return;
        }

        message.hidden = !text;
        message.textContent = text || "";
      }

      function playVideo() {
        if (!video) {
          return;
        }

        video.controls = true;
        var promise = video.play();

        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            showMessage("浏览器阻止了自动播放，请再次点击播放按钮。");
            if (overlay) {
              overlay.classList.remove("is-hidden");
            }
          });
        }
      }

      function initialize() {
        if (!source || !video) {
          showMessage("未找到播放源。 ");
          return;
        }

        if (initialized) {
          playVideo();
          return;
        }

        initialized = true;
        showMessage("正在加载高清播放源...");

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            showMessage("");
            playVideo();
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (!data || !data.fatal) {
              return;
            }

            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              showMessage("网络加载异常，正在重新连接播放源...");
              hlsInstance.startLoad();
              return;
            }

            if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              showMessage("媒体解码异常，正在尝试恢复播放...");
              hlsInstance.recoverMediaError();
              return;
            }

            showMessage("视频加载失败，请稍后重试。");
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          video.addEventListener("loadedmetadata", function () {
            showMessage("");
            playVideo();
          }, { once: true });
        } else {
          showMessage("当前浏览器不支持 HLS 播放，请使用新版浏览器访问。 ");
        }
      }

      if (button) {
        button.addEventListener("click", function () {
          if (overlay) {
            overlay.classList.add("is-hidden");
          }
          initialize();
        });
      }

      if (video) {
        video.addEventListener("click", function () {
          if (initialized) {
            if (video.paused) {
              playVideo();
            } else {
              video.pause();
            }
          }
        });
      }

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    setupMobileMenu();
    setupHeroCarousel();
    setupSearchForms();
    setupFilters();
    setupImageFallbacks();
    setupPlayers();
  });
})();
