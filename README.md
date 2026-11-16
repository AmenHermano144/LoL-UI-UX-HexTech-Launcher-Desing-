# LoL-UI · Hextech Component Kit

A dependency-free UI kit that recreates the look and feel of the **League of Legends** client (Hextech theme) as reusable HTML, CSS and JavaScript components.

Everything is powered by two files — `lol-ui.css` and `lol-ui.js`. Drop them into any static page and you get the full component library.

## Live preview

https://amenhermano144.github.io/LoL-UI-UX-HexTech-Launcher-Desing-/

Open `index.html` locally or visit the link above. Inside the showcase:
- Press **`</>`** on any block to reveal and copy its HTML.
- Click any **color swatch** to copy its CSS variable name.

## What's inside

| Category | Components |
|---|---|
| Foundations | Color palette, typography scale, gold links |
| Actions | Buttons (secondary, primary, danger), keybind rows |
| Forms | Checkboxes, radios, toggles, sliders, text inputs, labels, dropdowns |
| Navigation | Tabs, sidebar links |
| Layout | Panels, cards, section headers |
| Feedback | Progress bars, loading states, badges, avatars, tooltips, modals, toasts |
| Data | Lists and tables |

All components expose CSS variables (`--lol-gold-1` … `--lol-black`) so you can retheme without touching the stylesheet.

## Usage

Three files, no build step, no package manager:

```html
<link rel="stylesheet" href="lol-ui.css">
<script defer src="lol-ui.js"></script>
```

Then copy any component markup straight from the showcase. Example:

```html
<button class="lol-btn lol-btn--primary">Accept</button>
<button class="lol-btn lol-btn--danger">Decline</button>
```

## Fonts

The kit uses **Beaufort** for headings and **Spiegel** for body text — the same families Riot ships with the client. If they aren't installed on the system it falls back automatically to **Cinzel** and **Inter** from Google Fonts.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses CSS custom properties, `grid`, `clamp()` and `color-mix()` — no IE11.

## Project structure

```
.
├── index.html     # component showcase and documentation
├── lol-ui.css     # all styles, tokens and components
└── lol-ui.js      # swatch copy, code reveal, tab logic
```

## License

Unofficial fan project. Not affiliated with or endorsed by Riot Games. League of Legends and all related assets are trademarks of Riot Games, Inc.
