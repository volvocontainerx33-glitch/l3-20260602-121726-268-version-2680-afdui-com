const mobileButton = document.querySelector('[data-mobile-menu-button]');
const mobileMenu = document.querySelector('[data-mobile-menu]');

if (mobileButton && mobileMenu) {
  mobileButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
let heroIndex = 0;
let heroTimer = null;

function activateHero(index) {
  if (!slides.length) {
    return;
  }

  heroIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle('active', slideIndex === heroIndex);
  });
  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle('active', dotIndex === heroIndex);
  });
}

if (slides.length) {
  activateHero(0);
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      activateHero(index);
      window.clearInterval(heroTimer);
      heroTimer = window.setInterval(() => activateHero(heroIndex + 1), 5200);
    });
  });
  heroTimer = window.setInterval(() => activateHero(heroIndex + 1), 5200);
}

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

const librarySearch = document.querySelector('[data-library-search]');
const librarySelect = document.querySelector('[data-library-select]');
const cards = Array.from(document.querySelectorAll('[data-title]'));

function filterCards() {
  const query = normalizeText(librarySearch ? librarySearch.value : '');
  const selected = normalizeText(librarySelect ? librarySelect.value : '');

  cards.forEach((card) => {
    const haystack = normalizeText([
      card.dataset.title,
      card.dataset.genre,
      card.dataset.region,
      card.dataset.year,
    ].join(' '));
    const categoryValue = normalizeText(card.dataset.genre + ' ' + card.dataset.region + ' ' + card.dataset.year);
    const matchQuery = !query || haystack.includes(query);
    const matchSelect = !selected || categoryValue.includes(selected);
    card.style.display = matchQuery && matchSelect ? '' : 'none';
  });
}

if (librarySearch) {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    librarySearch.value = q;
  }
  librarySearch.addEventListener('input', filterCards);
}

if (librarySelect) {
  librarySelect.addEventListener('change', filterCards);
}

if (librarySearch || librarySelect) {
  filterCards();
}

async function attachHls(video, source) {
  if (!source) {
    return;
  }

  const fallbackMp4 = video.dataset.mp4Src;

  if (window.location.protocol === 'file:' && fallbackMp4) {
    video.src = fallbackMp4;
    return;
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = source;
    return;
  }

  try {
    const module = await import('./hls.js');
    const Hls = module.H;
    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      return;
    }
  } catch (error) {
    console.warn('HLS module unavailable', error);
  }

  if (fallbackMp4) {
    video.src = fallbackMp4;
  }
}

const player = document.querySelector('[data-hls-src]');
if (player) {
  attachHls(player, player.dataset.hlsSrc);
}

document.querySelectorAll('[data-play-target]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.playTarget);
    if (!target) {
      return;
    }
    button.classList.add('hidden');
    try {
      await target.play();
    } catch (error) {
      button.classList.remove('hidden');
      target.setAttribute('controls', 'controls');
    }
  });
});
