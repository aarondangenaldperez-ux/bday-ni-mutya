'use strict';

/*
 * CONTENT TO ADD LATER
 * Add only photographs, names, messages, songs, and treasure reveals supplied
 * or explicitly approved by the site owner. Nothing here is transmitted.
 */
const CONTENT = {
  homepage: {
    mainPhoto: { image: '', message: '' },
    smallPhotos: [
      { image: '', message: '' },
      { image: '', message: '' },
      { image: '', message: '' },
      { image: '', message: '' }
    ]
  },
  archive: [
    // { image: 'assets/photos/photo-01.jpg', message: 'Owner-approved message' }
  ],
  people: [
    // { name: 'Owner-provided name', photos: ['assets/photos/name-01.jpg'], message: 'Owner-approved message' }
  ],
  songs: [
    // { title: 'Owner-provided song title', cover: 'assets/photos/song-cover-01.jpg', audio: 'assets/music/song-01.mp3' }
  ],
  treasures: [
    // { kind: 'flower', x: '12%', y: '34%', image: 'assets/photos/treasure-01.jpg', message: 'Owner-approved message' }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const sections = ['envelope', 'home', 'archive', 'friends', 'mixtape', 'candles'];
let currentSection = 'envelope';
let currentFriend = 0;
let currentCDPage = 0;
let selectedSong = null;
let wishConfirmed = false;
let audioContext = null;
let micStream = null;
let micFrame = null;
let envelopeTimer = null;
let backgroundPausedForCD = false;

const menuToggle = $('#menuToggle');
const sideNav = $('#sideNav');
const navScrim = $('#navScrim');
const backgroundMusic = $('#backgroundMusic');
const audioRetry = $('#audioRetry');

function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  sideNav.classList.toggle('is-open', open);
  sideNav.setAttribute('aria-hidden', String(!open));
  sideNav.inert = !open;
  navScrim.classList.toggle('is-open', open);
  navScrim.tabIndex = open ? 0 : -1;
}

function showSection(id) {
  if (!sections.includes(id)) return;
  if (id !== 'envelope' && envelopeTimer) { window.clearTimeout(envelopeTimer); envelopeTimer = null; }
  if (id !== 'candles') stopMic();
  if (id !== 'mixtape') {
    $('#trackAudio').pause();
    $('#trackPlay').textContent = 'Play';
    if (currentSection === 'mixtape' && backgroundPausedForCD) { backgroundPausedForCD = false; startBackgroundMusic(); }
  }
  currentSection = id;
  const growth = [1, 1.025, 1.05, 1.075, 1.10, 1.13][sections.indexOf(id)];
  document.body.style.setProperty('--flora-scale', String(growth));
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    const active = sectionId === id;
    section.hidden = !active;
    section.classList.toggle('is-active', active);
  });
  $$('.nav-link').forEach(link => link.classList.toggle('is-current', link.dataset.target === id));
  setMenu(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'friends') renderFriend();
  if (id === 'mixtape') renderCDPage();
  renderTreasures();
}

menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
navScrim.addEventListener('click', () => setMenu(false));
Array.from(document.querySelectorAll('.nav-link')).forEach(link => link.addEventListener('click', () => showSection(link.dataset.target)));
$('.wordmark').addEventListener('click', event => { event.preventDefault(); showSection('envelope'); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    setMenu(false);
    closeLightbox();
  }
});

function startBackgroundMusic() {
  backgroundMusic.volume = 0.45;
  const playAttempt = backgroundMusic.play();
  if (playAttempt && typeof playAttempt.then === 'function') {
    playAttempt.then(() => { audioRetry.hidden = true; }).catch(() => { audioRetry.hidden = false; });
  }
}

audioRetry.addEventListener('click', () => {
  backgroundMusic.play().then(() => { audioRetry.hidden = true; }).catch(() => { audioRetry.hidden = false; });
});

$('#openEnvelope').addEventListener('click', () => {
  const envelope = $('#envelopeCard');
  const openButton = $('#openEnvelope');
  if (envelope.classList.contains('is-open')) { showSection('home'); return; }
  envelope.classList.add('is-open');
  $('#letterSheet').setAttribute('aria-hidden', 'false');
  startBackgroundMusic();
  openButton.textContent = 'Continue';
  envelopeTimer = window.setTimeout(() => {
    envelopeTimer = null;
    if (currentSection === 'envelope') showSection('home');
  }, 1150);
});

function normalizePhoto(photo) {
  if (typeof photo === 'string') return { image: photo, message: '' };
  return photo && typeof photo === 'object' ? photo : { image: '', message: '' };
}

function setPhotoWell(element, photoValue, frame) {
  const photo = normalizePhoto(photoValue);
  if (!photo.image) { frame.classList.add('is-empty'); frame.setAttribute('aria-hidden', 'true'); return; }
  frame.classList.remove('is-empty');
  frame.removeAttribute('aria-hidden');
  const img = document.createElement('img');
  img.src = photo.image;
  img.alt = '';
  img.loading = 'lazy';
  img.onerror = () => { img.remove(); frame.classList.add('is-empty'); frame.removeAttribute('role'); frame.removeAttribute('tabindex'); };
  element.replaceChildren(img);
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
  frame.tabIndex = 0;
  frame.setAttribute('role', 'button');
  frame.setAttribute('aria-label', 'Open photograph');
  const open = () => openLightbox(photo);
  frame.addEventListener('click', open);
  frame.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
  });
}

function setupHomepagePhotos() {
  const mainFrame = $('.polaroid--main');
  setPhotoWell($('.photo-well', mainFrame), CONTENT.homepage.mainPhoto, mainFrame);
  $$('.polaroid--small').forEach((frame, index) => {
    setPhotoWell($('.photo-well', frame), CONTENT.homepage.smallPhotos[index] || {}, frame);
  });
}

const lightbox = $('#photoLightbox');
function openLightbox(photo) {
  $('#lightboxImage').hidden = false;
  lightbox.classList.remove('lightbox--message');
  $('#lightboxImage').src = photo.image;
  $('#lightboxImage').alt = 'Photograph';
  $('#lightboxImage').onerror = () => { $('#lightboxImage').hidden = true; };
  $('#lightboxMessage').textContent = photo.message || '';
  $('#lightboxMessage').hidden = !photo.message;
  lightbox.hidden = false;
  $('#closeLightbox').focus();
}
function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  lightbox.classList.remove('lightbox--message');
  $('#lightboxImage').hidden = false;
  $('#lightboxImage').removeAttribute('src');
  $('#lightboxImage').onerror = null;
  $('#lightboxMessage').hidden = false;
}

function openTreasureMessage(message) {
  $('#lightboxImage').hidden = true;
  $('#lightboxMessage').textContent = message;
  lightbox.classList.add('lightbox--message');
  lightbox.hidden = false;
  $('#closeLightbox').focus();
}
$('#closeLightbox').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });

function renderArchive() {
  const grid = $('#archiveGrid');
  grid.replaceChildren();
  const availablePhotos = CONTENT.archive.filter(photo => photo && photo.image);
  if (!availablePhotos.length) {
    for (let index = 0; index < 6; index++) {
      const frame = document.createElement('div');
      frame.className = `archive-placeholder archive-placeholder--${index + 1}`;
      frame.setAttribute('aria-hidden', 'true');
      grid.append(frame);
    }
    return;
  }
  availablePhotos.forEach((photo, index) => {
    if (!photo.image) return;
    const button = document.createElement('button');
    button.className = 'archive-photo';
    button.type = 'button';
    button.style.setProperty('--tilt', `${[-2, 1.5, -1, 2, .5][index % 5]}deg`);
    const img = document.createElement('img');
    img.src = photo.image;
    img.alt = '';
    img.loading = 'lazy';
    img.onerror = () => button.remove();
    button.append(img);
    button.addEventListener('click', () => openLightbox(photo));
    grid.append(button);
  });
}

function renderFriend() {
  const people = CONTENT.people;
  const book = $('.album-book');
  book.classList.remove('is-turning');
  void book.offsetWidth;
  if (people.length > 1) {
    book.classList.add('is-turning');
    window.setTimeout(() => book.classList.remove('is-turning'), 650);
  }
  const photoPage = $('#friendPhotos');
  const letterPage = $('#friendLetter');
  photoPage.replaceChildren();
  letterPage.replaceChildren();
  if (!people.length) {
    for (let index = 0; index < 3; index++) {
      const frame = document.createElement('div');
      frame.className = `album-placeholder album-placeholder--${index + 1}`;
      frame.setAttribute('aria-hidden', 'true');
      photoPage.append(frame);
    }
    const letterMark = document.createElement('div');
    letterMark.className = 'album-letter-mark';
    letterMark.setAttribute('aria-hidden', 'true');
    letterPage.append(letterMark);
    $('#friendPrev').disabled = true;
    $('#friendNext').disabled = true;
    $('#friendPageDots').replaceChildren();
    return;
  }
  currentFriend = Math.max(0, Math.min(currentFriend, people.length - 1));
  const person = people[currentFriend];
  const name = document.createElement('div');
  name.className = 'person-name';
  name.textContent = person.name || '';
  name.style.cssText = 'font:600 21px var(--serif);margin:0 0 16px;color:#76565b';
  photoPage.append(name);
  const collage = document.createElement('div');
  collage.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px';
  (person.photos || []).forEach((photoValue, index) => {
    const photo = normalizePhoto(photoValue);
    if (!photo.image) return;
    const frame = document.createElement('button');
    frame.type = 'button';
    frame.className = 'friend-photo-frame';
    frame.style.setProperty('--photo-tilt', `${index % 2 ? 2 : -2}deg`);
    frame.setAttribute('aria-label', `Open photograph ${index + 1}`);
    const img = document.createElement('img');
    img.src = photo.image; img.alt = 'Photograph'; img.loading = 'lazy';
    img.onerror = () => frame.remove();
    frame.append(img);
    frame.addEventListener('click', () => openLightbox(photo));
    collage.append(frame);
  });
  photoPage.append(collage);
  letterPage.textContent = person.message || '';
  letterPage.style.cssText += ';white-space:pre-wrap;font:16px/2 var(--serif);color:#76565b';
  $('#friendPrev').disabled = currentFriend === 0;
  $('#friendNext').disabled = currentFriend === people.length - 1;
  $('#friendPageDots').replaceChildren();
  for (let index = 0; index < people.length; index++) {
    const dot = document.createElement('span');
    dot.className = `page-dot${index === currentFriend ? ' is-current' : ''}`;
    dot.setAttribute('aria-hidden', 'true');
    $('#friendPageDots').append(dot);
  }
}
$('#friendPrev').addEventListener('click', () => { currentFriend--; renderFriend(); });
$('#friendNext').addEventListener('click', () => { currentFriend++; renderFriend(); });

function renderCDPage(animate = false) {
  $('#trackAudio').pause();
  $('#trackPlay').textContent = 'Play';
  const wallet = $('.cd-wallet');
  wallet.classList.remove('is-turning');
  if (animate) {
    void wallet.offsetWidth;
    wallet.classList.add('is-turning');
    window.setTimeout(() => wallet.classList.remove('is-turning'), 650);
  }
  const pages = $('#cdPages');
  const songs = CONTENT.songs;
  pages.replaceChildren();
  const perPage = window.matchMedia('(max-width: 700px)').matches ? 4 : 6;
  const pageCount = Math.ceil(songs.length / perPage);
  currentCDPage = Math.max(0, Math.min(currentCDPage, Math.max(0, pageCount - 1)));
  if (!songs.length) {
    for (let index = 0; index < 4; index++) {
      const sleeve = document.createElement('div');
      sleeve.className = `cd-case cd-case--empty cd-case--${index + 1}`;
      sleeve.setAttribute('aria-hidden', 'true');
      const cover = document.createElement('div');
      cover.className = 'cd-cover';
      sleeve.append(cover);
      pages.append(sleeve);
    }
  }
  songs.slice(currentCDPage * perPage, (currentCDPage + 1) * perPage).forEach((song, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'cd-case';
    button.style.setProperty('--tilt', `${[-2, 1, 2, -1][index % 4]}deg`);
    const cover = document.createElement('div'); cover.className = 'cd-cover';
    if (song.cover) {
      const image = document.createElement('img'); image.src = song.cover; image.alt = ''; image.style.cssText = 'width:100%;height:100%;object-fit:cover'; cover.replaceChildren(image);
    }
    button.append(cover);
    button.addEventListener('click', () => openCDPlayer(song));
    pages.append(button);
  });
  $('#cdPrev').disabled = currentCDPage <= 0;
  $('#cdNext').disabled = currentCDPage >= pageCount - 1;
  $('#cdPageDots').replaceChildren();
  for (let index = 0; index < pageCount; index++) {
    const dot = document.createElement('span');
    dot.className = `page-dot${index === currentCDPage ? ' is-current' : ''}`;
    dot.setAttribute('aria-hidden', 'true');
    $('#cdPageDots').append(dot);
  }
  $('.cd-wallet').hidden = false;
  $('#cdPlayer').hidden = true;
}
function openCDPlayer(song) {
  selectedSong = song;
  $('#playerTrack').textContent = song.title || '';
  const trackAudio = $('#trackAudio');
  trackAudio.pause();
  if (song.audio) { trackAudio.src = song.audio; trackAudio.load(); }
  else { trackAudio.removeAttribute('src'); trackAudio.load(); }
  $('#trackPlay').disabled = !song.audio;
  $('#trackPlay').textContent = 'Play';
  $('.cd-wallet').hidden = true;
  $('#cdPlayer').hidden = false;
}
$('#cdPrev').addEventListener('click', () => { currentCDPage--; renderCDPage(true); });
$('#cdNext').addEventListener('click', () => { currentCDPage++; renderCDPage(true); });
$('#backToCDs').addEventListener('click', () => {
  $('#trackAudio').pause();
  selectedSong = null;
  renderCDPage();
  if (!backgroundMusic.paused) return;
  backgroundMusic.play().catch(() => { audioRetry.hidden = false; });
});
$('#trackPlay').addEventListener('click', () => {
  if (!selectedSong || !selectedSong.audio) return;
  const audio = $('#trackAudio');
  if (audio.paused) {
    backgroundPausedForCD = true;
    backgroundMusic.pause();
    audio.play().then(() => { $('#trackPlay').textContent = 'Pause'; }).catch(() => {
      $('#trackPlay').textContent = 'Play';
      if (backgroundPausedForCD) { backgroundPausedForCD = false; startBackgroundMusic(); }
    });
  } else {
    audio.pause();
    $('#trackPlay').textContent = 'Play';
    if (backgroundPausedForCD) { backgroundPausedForCD = false; startBackgroundMusic(); }
  }
});
$('#trackAudio').addEventListener('ended', () => {
  $('#trackPlay').textContent = 'Play';
  if (backgroundPausedForCD) { backgroundPausedForCD = false; startBackgroundMusic(); }
});
$('#trackAudio').addEventListener('error', () => { $('#trackPlay').textContent = 'Play'; });

function createCandles() {
  const set = $('#candleSet');
  for (let index = 0; index < 18; index++) {
    const candle = document.createElement('span');
    candle.className = 'candle';
    candle.dataset.index = String(index);
    const flame = document.createElement('span');
    flame.className = 'flame';
    candle.append(flame);
    set.append(candle);
  }
}
function extinguishCandles() {
  $$('.candle').forEach((candle, index) => window.setTimeout(() => candle.classList.add('is-out'), index * 70));
  window.setTimeout(() => {
    stopMic();
    $('#blowCandles').disabled = true;
    startPetalFinale();
  }, 18 * 70 + 350);
}
$('#confirmWish').addEventListener('click', () => {
  const wish = $('#wishInput').value;
  if (!wish.trim()) { $('#wishInput').focus(); return; }
  // The wish is intentionally held only in this short-lived local interaction.
  // It is neither stored nor transmitted, and is cleared immediately on confirmation.
  $('#wishInput').value = '';
  wishConfirmed = true;
  $('#wishPanel').hidden = true;
  $('#blowPanel').hidden = false;
  $('#blowCandles').focus();
});
$('#blowCandles').addEventListener('click', beginMicBlow);
$('#tapBlowFallback').addEventListener('click', extinguishCandles);

async function beginMicBlow() {
  const note = $('#micNote');
  if (!wishConfirmed) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    $('#tapBlowFallback').hidden = false;
    note.textContent = 'Microphone unavailable on this browser.';
    return;
  }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('Audio analysis is unavailable.');
    audioContext = new AudioCtx();
    const source = audioContext.createMediaStreamSource(micStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let loudFrames = 0;
    note.textContent = 'Listening';
    const listen = () => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) { const value = (sample - 128) / 128; sum += value * value; }
      const rms = Math.sqrt(sum / samples.length);
      loudFrames = rms > 0.13 ? loudFrames + 1 : Math.max(0, loudFrames - 1);
      if (loudFrames >= 8) { note.textContent = ''; extinguishCandles(); return; }
      micFrame = requestAnimationFrame(listen);
    };
    listen();
  } catch (error) {
    stopMic();
    $('#tapBlowFallback').hidden = false;
    note.textContent = 'Microphone permission is unavailable.';
  }
}
function stopMic() {
  if (micFrame) cancelAnimationFrame(micFrame);
  micFrame = null;
  if (micStream) micStream.getTracks().forEach(track => track.stop());
  micStream = null;
  if (audioContext) { audioContext.close().catch(() => {}); audioContext = null; }
}
function startPetalFinale() {
  const finale = $('#petalFinale');
  finale.replaceChildren();
  for (let index = 0; index < 70; index++) {
    const petal = document.createElement('i');
    petal.className = 'petal';
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.setProperty('--duration', `${5 + Math.random() * 6}s`);
    petal.style.setProperty('--delay', `${Math.random() * 2}s`);
    petal.style.setProperty('--drift', `${-100 + Math.random() * 200}px`);
    finale.append(petal);
  }
  finale.classList.add('is-active');
}

function createPetalBackground() {
  const layer = $('#petalLayer');
  for (let index = 0; index < 17; index++) {
    const petal = document.createElement('i');
    petal.className = 'petal';
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.setProperty('--duration', `${11 + Math.random() * 12}s`);
    petal.style.setProperty('--delay', `${-Math.random() * 18}s`);
    petal.style.setProperty('--drift', `${-80 + Math.random() * 160}px`);
    layer.append(petal);
  }
}

function renderTreasures() {
  const layer = $('#treasureLayer');
  layer.replaceChildren();
  CONTENT.treasures.forEach((treasure, index) => {
    const revealAt = sections.includes(treasure.visibleAfter) ? treasure.visibleAfter : 'envelope';
    if (sections.indexOf(currentSection) < sections.indexOf(revealAt)) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'treasure-object';
    button.style.left = treasure.x || `${10 + index * 15}%`;
    button.style.top = treasure.y || `${20 + (index % 3) * 23}%`;
    button.setAttribute('aria-label', 'Hidden illustration');
    button.innerHTML = '<svg viewBox="0 0 54 54" aria-hidden="true"><path d="M27 49 C25 37 28 27 27 18" fill="none" stroke="#8da986" stroke-width="2.5"/><path d="M26 36 C11 27 6 34 10 42 C18 45 23 41 26 36Z" fill="#b8cdaa" stroke="#8da986"/><path d="M27 20 C10 4 7 17 18 24 C8 30 19 42 27 28 C35 42 46 30 36 24 C47 17 44 4 27 20Z" fill="#efb6c5" stroke="#d18da4" stroke-width="1.4"/></svg>';
    button.addEventListener('click', () => {
      button.classList.remove('is-revealing');
      void button.offsetWidth;
      button.classList.add('is-revealing');
      window.setTimeout(() => {
        if (treasure.image) openLightbox({ image: treasure.image, message: treasure.message || '' });
        else if (treasure.message) openTreasureMessage(treasure.message);
      }, 420);
    });
    layer.append(button);
  });
}

function init() {
  setMenu(false);
  setupHomepagePhotos();
  renderArchive();
  renderFriend();
  renderCDPage();
  createCandles();
  createPetalBackground();
  renderTreasures();
}
window.addEventListener('beforeunload', stopMic);
window.addEventListener('pagehide', stopMic);
window.addEventListener('resize', () => { if (currentSection === 'mixtape' && !$('#cdPlayer').hidden) return; if (currentSection === 'mixtape') renderCDPage(); });
init();