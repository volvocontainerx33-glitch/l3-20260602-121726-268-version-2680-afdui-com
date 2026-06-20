async function loadHlsLibrary() {
  try {
    const module = await import('./hls-dru42stk.js');
    return module.H || module.default || null;
  } catch (error) {
    return null;
  }
}

function setStatus(statusElement, message, hidden) {
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message || '';
  statusElement.classList.toggle('is-hidden', Boolean(hidden));
}

function attachFallback(video, fallbackUrl, statusElement) {
  if (!fallbackUrl) {
    setStatus(statusElement, '当前浏览器无法载入播放源', false);
    return;
  }
  video.src = fallbackUrl;
  video.load();
  setStatus(statusElement, '播放源已准备好', true);
}

async function setupPlayer(shell) {
  const video = shell.querySelector('.movie-player');
  const playButton = shell.querySelector('[data-player-play]');
  const statusElement = shell.querySelector('[data-player-status]');

  if (!video) {
    return;
  }

  const sourceUrl = video.dataset.src;
  const fallbackUrl = video.dataset.fallback;
  const Hls = await loadHlsLibrary();

  setStatus(statusElement, '正在准备播放源...', false);

  if (Hls && Hls.isSupported() && sourceUrl) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });

    hls.loadSource(sourceUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      setStatus(statusElement, '播放源已准备好', true);
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
      if (!data || !data.fatal) {
        return;
      }

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
        attachFallback(video, fallbackUrl, statusElement);
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
        return;
      }

      hls.destroy();
      attachFallback(video, fallbackUrl, statusElement);
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl') && sourceUrl) {
    video.src = sourceUrl;
    video.addEventListener('loadedmetadata', function () {
      setStatus(statusElement, '播放源已准备好', true);
    });
    video.addEventListener('error', function () {
      attachFallback(video, fallbackUrl, statusElement);
    });
  } else {
    attachFallback(video, fallbackUrl, statusElement);
  }

  if (playButton) {
    playButton.addEventListener('click', async function () {
      try {
        await video.play();
        shell.classList.add('is-playing');
        setStatus(statusElement, '', true);
      } catch (error) {
        setStatus(statusElement, '点击视频控件即可继续播放', false);
      }
    });
  }

  video.addEventListener('play', function () {
    shell.classList.add('is-playing');
    setStatus(statusElement, '', true);
  });

  video.addEventListener('pause', function () {
    shell.classList.remove('is-playing');
  });

  video.addEventListener('error', function () {
    attachFallback(video, fallbackUrl, statusElement);
  });
}

const players = Array.from(document.querySelectorAll('[data-player]'));
players.forEach(setupPlayer);
