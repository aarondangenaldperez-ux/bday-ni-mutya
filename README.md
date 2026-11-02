# Bday ni Mutya

A mobile-first, static scrapbook website built with plain HTML, CSS, and JavaScript for GitHub Pages.

## Files

- `index.html` — six sections and site structure
- `style.css` — responsive scrapbook styling and original inline floral artwork
- `script.js` — navigation, envelope, audio, photo archive, album pages, CD player, candles, and optional hidden treasures
- `assets/` — add approved photographs and audio files here

## Add the media when it is ready

Only add photographs, music, names, and messages that the site owner has supplied or approved.

- Background music: `assets/music/background-music.mp3`
- Photographs: `assets/photos/`
- CD song audio: `assets/music/`
- CD cover images can also go in `assets/photos/`

The content lists are at the top of `script.js` in the `CONTENT` object. Example entries are commented out; replace them only with the real, approved content. The website does not upload or transmit any of these files.

## Important behavior

- The background music is requested only after the envelope is opened. A browser may still block playback; the music control appears as a retry when that happens.
- The birthday wish is not saved or transmitted. It is cleared from the input as soon as the visitor confirms it.
- Candle blowing uses microphone permission. When microphone access is unavailable, a tap-to-extinguish fallback appears.
- No database, analytics, cookies, local storage, or backend is used.

## Publish with GitHub Pages

Upload the contents of this folder to the root of the repository's `main` branch. In the repository settings, enable GitHub Pages using the `main` branch and `/ (root)` folder.