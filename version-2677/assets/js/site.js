(function () {
    'use strict';

    function ready(callback) {
        if (document.readyState !== 'loading') {
            callback();
            return;
        }
        document.addEventListener('DOMContentLoaded', callback);
    }

    function setupMobileNav() {
        var button = document.querySelector('[data-mobile-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function setupSearchForms() {
        var forms = document.querySelectorAll('[data-search-form]');
        forms.forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input[name="q"]');
                var query = input ? input.value.trim() : '';
                var target = 'search.html';
                if (query) {
                    target += '?q=' + encodeURIComponent(query);
                }
                window.location.href = target;
            });
        });
    }

    function setupHeroCarousel() {
        var carousel = document.querySelector('[data-hero-carousel]');
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var previous = carousel.querySelector('[data-hero-prev]');
        var next = carousel.querySelector('[data-hero-next]');
        var activeIndex = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            activeIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, current) {
                slide.classList.toggle('is-active', current === activeIndex);
            });
            dots.forEach(function (dot, current) {
                dot.classList.toggle('is-active', current === activeIndex);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(activeIndex + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (previous) {
            previous.addEventListener('click', function () {
                show(activeIndex - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(activeIndex + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var index = Number(dot.getAttribute('data-hero-dot')) || 0;
                show(index);
                start();
            });
        });
        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function normalize(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function setupCardFilters() {
        var filterLists = document.querySelectorAll('[data-filter-list], .category-overview-grid, .rank-list');
        var keywordInput = document.querySelector('[data-card-filter]');
        var selects = Array.prototype.slice.call(document.querySelectorAll('[data-filter-select]'));
        var resetButton = document.querySelector('[data-filter-reset]');
        var countLabel = document.querySelector('[data-filter-count]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

        if (!cards.length || (!keywordInput && !selects.length)) {
            return;
        }

        function applyFilters() {
            var keyword = normalize(keywordInput ? keywordInput.value : '');
            var activeFilters = {};
            selects.forEach(function (select) {
                var field = select.getAttribute('data-filter-select');
                var value = normalize(select.value);
                if (field && value) {
                    activeFilters[field] = value;
                }
            });

            var visibleCount = 0;
            cards.forEach(function (card) {
                var text = normalize(card.getAttribute('data-text'));
                var matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
                var matchesSelects = Object.keys(activeFilters).every(function (field) {
                    var cardValue = normalize(card.getAttribute('data-' + field));
                    return cardValue === activeFilters[field];
                });
                var visible = matchesKeyword && matchesSelects;
                card.hidden = !visible;
                if (visible) {
                    visibleCount += 1;
                }
            });

            if (countLabel) {
                countLabel.textContent = '共 ' + visibleCount + ' 部';
            }
            filterLists.forEach(function (list) {
                list.classList.toggle('is-filtering', keyword.length > 0 || Object.keys(activeFilters).length > 0);
            });
        }

        if (keywordInput) {
            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');
            if (query) {
                keywordInput.value = query;
            }
            keywordInput.addEventListener('input', applyFilters);
        }
        selects.forEach(function (select) {
            select.addEventListener('change', applyFilters);
        });
        if (resetButton) {
            resetButton.addEventListener('click', function () {
                if (keywordInput) {
                    keywordInput.value = '';
                }
                selects.forEach(function (select) {
                    select.value = '';
                });
                applyFilters();
            });
        }
        applyFilters();
    }

    function setupPlayers() {
        var players = document.querySelectorAll('[data-player]');
        players.forEach(function (shell) {
            var video = shell.querySelector('video');
            var overlay = shell.querySelector('[data-play-overlay]');
            var status = shell.querySelector('[data-player-status]');
            var hlsInstance = null;
            var isLoaded = false;

            if (!video) {
                return;
            }

            function setStatus(message) {
                if (status) {
                    status.textContent = message;
                }
            }

            function loadVideo() {
                if (isLoaded) {
                    return Promise.resolve();
                }
                var source = video.getAttribute('data-src');
                if (!source) {
                    setStatus('未找到播放源');
                    return Promise.resolve();
                }

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false,
                        backBufferLength: 90
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setStatus('播放源加载完成');
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            setStatus('网络异常，正在重试');
                            hlsInstance.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            setStatus('媒体异常，正在恢复');
                            hlsInstance.recoverMediaError();
                        } else {
                            setStatus('播放源加载失败');
                            hlsInstance.destroy();
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    setStatus('使用浏览器原生 HLS 播放');
                } else {
                    video.src = source;
                    setStatus('当前浏览器需要 HLS 播放支持');
                }
                isLoaded = true;
                return Promise.resolve();
            }

            function playVideo() {
                loadVideo().then(function () {
                    var playPromise = video.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(function () {
                            setStatus('请再次点击播放器开始播放');
                        });
                    }
                });
            }

            if (overlay) {
                overlay.addEventListener('click', function () {
                    overlay.classList.add('is-hidden');
                    playVideo();
                });
            }
            video.addEventListener('play', function () {
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
            });
            video.addEventListener('pause', function () {
                setStatus('已暂停，可继续播放');
            });
            video.addEventListener('ended', function () {
                setStatus('播放结束');
            });
            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    ready(function () {
        setupMobileNav();
        setupSearchForms();
        setupHeroCarousel();
        setupCardFilters();
        setupPlayers();
    });
})();
