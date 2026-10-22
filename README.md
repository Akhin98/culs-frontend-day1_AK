# Team ओस की बूँदें
- Anchal
- Akhin
- Abhinav
- Satyam

# The Little Herb Garden

A small website about herbs you can smell, taste and grow. Every herb has its own page, built in the browser from a JSON file.

**Live site:** https://abhinavparbat.github.io/culs-frontend-day1/
**Repository:** https://github.com/AbhinavParbat/culs-frontend-day1

Made for the Frontend Development course (CULS, 2026). It started as the repaired website from day 1 and grew over days 2-4.

## What it does

- The home page lists all herbs as cards.
- `index.html#basil` shows a single herb: its name, Latin name, use and life cycle.
- Each herb is loaded with `fetch()` from `data/<herb>.json`. The page is built by JavaScript, not written by hand.
- **Extra feature: search and filter.** Type in the search box (matches name, Latin name and use) and/or pick annual or perennial. The list updates as you type.
- If something goes wrong, the page says what happened instead of staying blank (see [When things go wrong](#when-things-go-wrong)).
- The whole site works with the keyboard alone.

## Run it locally

You need Git, a browser and [Node.js](https://nodejs.org/) (LTS).

```
git clone https://github.com/AbhinavParbat/culs-frontend-day1.git
cd culs-frontend-day1
npx serve
```

Open the address `serve` prints (usually http://localhost:3000). Do not open `index.html` by double-clicking: `fetch()` needs HTTP, and a `file://` page is not the Web.

## Project structure

```
index.html    the single page: header, home view, herb view, footer
style.css     how it looks (CSS variables, grid, responsive, focus styles)
app.js        what it does: routing, fetching, state, rendering
data/         herbs.json (list of ids) + one JSON file per herb
images/       logo.svg, garden.svg
```

## How it works

```
URL hash (#basil)
   ↓  hashchange
route() in app.js
   ↓
fetch("data/basil.json")  →  JSON  →  checked  →  JavaScript object
   ↓
DOM built with createElement / textContent, replacing the old content
   ↓
user sees the herb (and focus moves to its heading)
```

- **Routing:** the part of the URL after `#` is the view. An empty hash, `#herbs`, `#visit` and `#about` show the home view; anything else is treated as a herb id. A `hashchange` listener re-renders, so the back button works.
- **State:** the home view keeps one `state` object in `app.js`: the loaded herbs, the ids that failed to load, the search text and the selected life cycle. Typing or changing the select updates `state` and calls `renderList()`, which rebuilds the cards (state → view). The herb page is rendered directly from the fetched object.
- **Rendering:** the DOM is built with `createElement` and `textContent`, never `innerHTML` with data, so data can never inject markup.
- **Network:** plain `fetch()` over HTTP. The data does not change while you look at it, so request/response is enough. SSE or WebSocket would add complexity without any benefit here.
- **Errors:** `fetchJSON()` throws a `GardenError` with a `kind` (`network`, `missing`, `http`, `invalid`, `unknown`), and `describe()` turns each kind into a message.

## Data format

`data/herbs.json` is the list of herb ids:

```json
["basil", "spearmint", "rosemary", "thyme", "lavender", "sage", "chamomile", "chives"]
```

Every herb lives in `data/<id>.json`, where `<id>` is the lowercase id used in the URL (`basil` → `data/basil.json`):

```json
{
  "name": "Basil",
  "latin": "Ocimum basilicum",
  "use": "Tomatoes, pesto and anything summery.",
  "life": "annual"
}
```

| Field   | Type   | Required | Meaning                                |
|---------|--------|----------|----------------------------------------|
| `name`  | string | yes      | Common name, shown as the heading      |
| `latin` | string | yes      | Latin name, shown in italics           |
| `use`   | string | yes      | Short description of how it is used    |
| `life`  | string | yes      | Either `"annual"` or `"perennial"`     |

All four fields must be non-empty strings. A file that breaks this is reported as broken data.

**To add a herb:** create `data/<id>.json` in the format above and add `"<id>"` to `data/herbs.json`.

## When things go wrong

| Situation                              | What happens                                                          |
|----------------------------------------|-----------------------------------------------------------------------|
| Unknown herb (`#unicorn`)              | "We don't grow that herb" with a link back to the list                |
| Herb is listed but its file is missing | Error naming the file and status, e.g. `data/sage.json: 404`          |
| One herb file broken on the home page  | The other herbs still show; a message lists the ones that failed      |
| File is not valid JSON / wrong format  | "This herb's data is broken" naming the file                          |
| No server (or `file://`)               | "The garden could not be reached", with a hint to start the server    |
| Empty hash                             | The home view with all herbs                                          |

To test each case: use `#unicorn`; rename a data file; break a JSON file; or stop `npx serve` and reload. In DevTools, Network panel → Offline also works.

## Accessibility

- Semantic HTML: `header`, `nav`, `main`, `section`, `article`, `footer`, real links, a proper heading hierarchy, a labelled search form.
- Everything works with Tab, Shift+Tab and Enter. Focus is always visible, and there is a "Skip to content" link.
- On every view change, focus moves to the new heading, so keyboard and screen-reader users do not get lost.
- The herb count and errors are announced to screen readers (`aria-live`, `role="alert"`).
- Decorative images have an empty `alt`; the hero image describes what it shows.
- The layout is responsive and works when zoomed.

## Git history

Work was done in small commits, one change each. See the [commit history](https://github.com/AbhinavParbat/culs-frontend-day1/commits/main).

## Decisions and lessons

- **Hash routing instead of separate HTML files:** one `index.html`, as the assignment asks. The hash is never sent to the server, so it also works on GitHub Pages without any server setup.
- **`herbs.json` is only a list of ids:** each herb's data lives in exactly one place, so nothing can get out of sync.
- **One broken file must not break the list:** the home view uses `Promise.allSettled`.
- <What went wrong during the project and how you found it, in your own words.>
- <What you would do next.>

## Credits

Course by Josef Pospíšil ([@pepe](https://github.com/pepe)): [culs-frontend-2026](https://github.com/pepe/culs-frontend-2026). Documentation from [MDN](https://developer.mozilla.org/). <Say which AI help you used and for what.>
