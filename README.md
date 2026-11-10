# Bday ni Mutya

A mobile-first birthday scrapbook built with plain HTML, CSS, and JavaScript for GitHub Pages. The visual direction uses original watercolor botanical artwork, tactile paper details, and an intimate analog-folk scrapbook atmosphere.

## Files

- `index.html` — the envelope intro and six section views
- `style.css` — base layout and responsive component styling
- `art-direction.css` — the refined typography, color system, navigation buttons, paper treatments, and mobile visual adjustments
- `script.js` — navigation, envelope audio, photo archive, friends-and-family album, CD player, birthday candles, and hidden treasures
- `assets/art/lily-tulip-study.svg` — original watercolor-inspired lily and tulip illustration
- `assets/photos/` and `assets/music/` — reserved for approved photographs, cover art, and audio

## Add the media when it is ready

Only add photographs, music, names, and messages that the site owner has supplied or approved.

- Background music: `assets/music/background-music.mp3`
- Photographs: `assets/photos/`
- CD song audio: `assets/music/`
- CD cover images can also go in `assets/photos/`

The content lists are at the top of `script.js` in the `CONTENT` object. Example entries are commented out; replace them only with real, approved content. The website does not upload or transmit these files.

## Important behavior

- The background music is requested only after the envelope is opened. A browser may still block playback.
- The birthday wish is not saved or transmitted. The input is cleared immediately when the visitor confirms it.
- Candle blowing uses microphone permission. When microphone access is unavailable, a tap-to-extinguish fallback is available.
- No database, analytics, cookies, local storage, or backend is used.

## Publish with GitHub Pages

The existing GitHub Actions workflow deploys the root of the `main` branch to GitHub Pages after a push. The workflow can also be started manually from the Actions tab.
