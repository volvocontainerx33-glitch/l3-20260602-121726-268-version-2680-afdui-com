(function () {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const nextButton = hero.querySelector('[data-hero-next]');
    const prevButton = hero.querySelector('[data-hero-prev]');
    let activeIndex = 0;
    let timer = null;

    function renderHero(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        if (dotIndex === activeIndex) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }

    function startHero() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        renderHero(activeIndex + 1);
      }, 5000);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        renderHero(dotIndex);
        startHero();
      });
    });

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        renderHero(activeIndex + 1);
        startHero();
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        renderHero(activeIndex - 1);
        startHero();
      });
    }

    renderHero(0);
    startHero();
  }

  const filterPanel = document.querySelector('[data-filter-panel]');

  if (filterPanel) {
    const cards = Array.from(document.querySelectorAll('[data-movie-card]'));
    const searchInput = filterPanel.querySelector('[data-filter-search]');
    const categorySelect = filterPanel.querySelector('[data-filter-category]');
    const genreSelect = filterPanel.querySelector('[data-filter-genre]');
    const yearSelect = filterPanel.querySelector('[data-filter-year]');
    const resetButton = filterPanel.querySelector('[data-filter-reset]');
    const emptyMessage = document.querySelector('[data-filter-empty]');
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';

    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
    }

    function matches(card, query, category, genre, year) {
      const searchText = card.dataset.search || '';
      const cardCategory = card.dataset.category || '';
      const cardGenre = card.dataset.genre || '';
      const cardYear = card.dataset.year || '';
      const queryMatch = !query || searchText.indexOf(query) !== -1;
      const categoryMatch = !category || cardCategory === category;
      const genreMatch = !genre || cardGenre.indexOf(genre) !== -1 || searchText.indexOf(genre.toLowerCase()) !== -1;
      const yearMatch = !year || cardYear === year;
      return queryMatch && categoryMatch && genreMatch && yearMatch;
    }

    function applyFilters() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const category = categorySelect ? categorySelect.value : '';
      const genre = genreSelect ? genreSelect.value : '';
      const year = yearSelect ? yearSelect.value : '';
      let visibleCount = 0;

      cards.forEach(function (card) {
        const visible = matches(card, query, category, genre, year);
        card.classList.toggle('is-filter-hidden', !visible);
        if (visible) {
          visibleCount += 1;
        }
      });

      if (emptyMessage) {
        emptyMessage.hidden = visibleCount !== 0;
      }
    }

    [searchInput, categorySelect, genreSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilters);
        control.addEventListener('change', applyFilters);
      }
    });

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        if (searchInput) {
          searchInput.value = '';
        }
        if (categorySelect) {
          categorySelect.value = '';
        }
        if (genreSelect) {
          genreSelect.value = '';
        }
        if (yearSelect) {
          yearSelect.value = '';
        }
        applyFilters();
      });
    }

    applyFilters();
  }
})();
