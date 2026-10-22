// The Little Herb Garden
//
// One page, several views, chosen by the URL hash:
//   index.html            -> home (all herbs)
//   index.html#herbs      -> home, scrolled to the herbs (also #visit, #about)
//   index.html#basil      -> the page of one herb, loaded from data/basil.json
//
// Data comes from data/herbs.json (the list of ids) and data/<id>.json (one herb each).

const SITE_TITLE = "The Little Herb Garden"
const SECTIONS = ["herbs", "visit", "about"] // hashes that are page sections, not herbs
const FIELDS = ["name", "latin", "use", "life"]
const LIFE_CYCLES = ["annual", "perennial"]

const main = document.querySelector("#main")
const home = document.querySelector("#home")
const detail = document.querySelector("#detail")
const list = document.querySelector("#herbs-list")
const count = document.querySelector(".count")
const homeMessage = document.querySelector("#home-message")
const search = document.querySelector("#search")
const lifeFilter = document.querySelector("#life")
const skipLink = document.querySelector(".skip-link")

// ---------------------------------------------------------------- state

// Everything the home view needs to know lives here.
const state = {
  herbs: [],      // herbs that loaded: { id, name, latin, use, life }
  failed: [],     // ids that are listed but could not be loaded
  loaded: false,  // has the list loaded successfully?
  query: "",      // text in the search box
  life: "all",    // "all", "annual" or "perennial"
}

let previousView = null // null, "home" or "detail": used to manage focus
let loading = null      // the list request in flight, if any

// ---------------------------------------------------------------- network

// Our own error type: "kind" says what went wrong, so the page can say it well.
class GardenError extends Error {
  constructor(kind, message) {
    super(message)
    this.kind = kind
  }
}

async function fetchJSON(url) {
  let response
  try {
    response = await fetch(url)
  } catch {
    throw new GardenError("network", `Could not reach the server while loading ${url}.`)
  }
  if (!response.ok) {
    const kind = response.status === 404 ? "missing" : "http"
    throw new GardenError(kind, `Could not load ${url}: ${response.status} ${response.statusText}`.trim())
  }
  try {
    return await response.json()
  } catch {
    throw new GardenError("invalid", `${url} is not valid JSON.`)
  }
}

function checkHerb(data, url) {
  const valid = data !== null && typeof data === "object" &&
    FIELDS.every(field => typeof data[field] === "string" && data[field] !== "") &&
    LIFE_CYCLES.includes(data.life)
  if (!valid) {
    throw new GardenError("invalid", `${url} does not have the expected herb format.`)
  }
  return data
}

async function loadIds() {
  const ids = await fetchJSON("data/herbs.json")
  if (!Array.isArray(ids) || !ids.every(id => typeof id === "string")) {
    throw new GardenError("invalid", "data/herbs.json should be a list of herb ids.")
  }
  return ids
}

async function fetchHerb(id) {
  const url = `data/${id}.json`
  return { id, ...checkHerb(await fetchJSON(url), url) }
}

// One herb for its own page. A 404 can mean "no such herb" or "a listed file is gone".
async function loadHerb(id) {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new GardenError("unknown", `There is no herb called “${id}”.`)
  }
  try {
    return await fetchHerb(id)
  } catch (error) {
    if (error.kind === "missing") {
      const ids = await loadIds().catch(() => null)
      if (ids && !ids.includes(id)) {
        throw new GardenError("unknown", `There is no herb called “${id}”.`)
      }
    }
    throw error
  }
}

// Every herb for the home view. One broken file must not break the whole list.
async function loadAll() {
  const ids = await loadIds()
  const results = await Promise.allSettled(ids.map(fetchHerb))
  const herbs = []
  const failed = []
  results.forEach((result, index) => {
    if (result.status === "fulfilled") herbs.push(result.value)
    else failed.push(ids[index])
  })
  return { herbs, failed }
}

// ---------------------------------------------------------------- building the DOM

function element(tag, className, text = "") {
  const node = document.createElement(tag)
  if (className) node.className = className
  node.textContent = text
  return node
}

function link(href, text, className) {
  const node = element("a", className, text)
  node.href = href
  return node
}

function describe(error, id) {
  switch (error.kind) {
    case "unknown":
      return { title: "We don't grow that herb", text: `There is no herb called “${id}” in this garden.` }
    case "missing":
      return { title: "This herb's file is missing", text: error.message }
    case "network":
      return {
        title: "The garden could not be reached",
        text: `${error.message} Is the server running? Opening index.html directly (file://) does not work.`,
      }
    case "invalid":
      return { title: "This herb's data is broken", text: error.message }
    case "http":
      return { title: "The server had a problem", text: error.message }
    default:
      return { title: "Something went wrong", text: error.message }
  }
}

function focusHeading(root) {
  const heading = root.querySelector("h1, h2")
  if (!heading) return
  heading.tabIndex = -1
  heading.focus({ preventScroll: true })
}


// ---------------------------------------------------------------- Ambient Audio Feature
// Ambient Audio Feature
const ambientAudio = new Audio('audio/rain.mp3');
ambientAudio.loop = true;
ambientAudio.volume = 0.2; // Keep it subtle

const audioBtn = document.getElementById('ambient-toggle');
let isPlaying = false;

// Attempt to autoplay immediately on load
ambientAudio.play().then(() => {
  // Autoplay succeeded
  isPlaying = true;
  audioBtn.textContent = '⏸️';
  audioBtn.title = 'Pause ambient rain';
}).catch(error => {
  // Autoplay was blocked by the browser
  console.log("Autoplay prevented by browser:", error);
  isPlaying = false;
  audioBtn.textContent = '🌧️';
  audioBtn.title = 'Play ambient rain';
});

// Click event for the toggle button
audioBtn.addEventListener('click', () => {
  if (isPlaying) {
    ambientAudio.pause();
    audioBtn.textContent = '🌧️';
    audioBtn.title = 'Play ambient rain';
  } else {
    ambientAudio.play().catch(error => console.log("Audio playback prevented:", error));
    audioBtn.textContent = '⏸️';
    audioBtn.title = 'Pause ambient rain';
  }
  isPlaying = !isPlaying;
});
// ----------------------------------------------------------------

// ---------------------------------------------------------------- home view

function card(herb) {
  const item = element("li", "card")
  const title = element("h3", "name")
  title.append(link(`#${herb.id}`, herb.name))
  item.append(
    title,
    element("p", "latin", herb.latin),
    element("p", "use", herb.use),
    element("p", "life", herb.life))
  return item
}

function visibleHerbs() {
  const query = state.query.trim().toLowerCase()
  return state.herbs.filter(herb => {
    const lifeMatches = state.life === "all" || herb.life === state.life
    const textMatches = query === "" ||
      [herb.name, herb.latin, herb.use].some(text => text.toLowerCase().includes(query))
    return lifeMatches && textMatches
  })
}

// state -> view
function renderList() {
  const shown = visibleHerbs()
  list.replaceChildren(...shown.map(card))
  if (state.herbs.length === 0) {
    count.textContent = "No herbs could be loaded."
  } else if (shown.length === 0) {
    count.textContent = "No herb matches your search."
  } else if (shown.length === state.herbs.length) {
    count.textContent = `${shown.length} herbs grow here.`
  } else {
    count.textContent = `${shown.length} of ${state.herbs.length} herbs match.`
  }
}

async function ensureList() {
  if (state.loaded) return
  if (loading) return loading
  count.textContent = "Loading the herbs…"
  loading = (async () => {
    try {
      const { herbs, failed } = await loadAll()
      state.herbs = herbs
      state.failed = failed
      state.loaded = true
      homeMessage.hidden = failed.length === 0
      homeMessage.textContent = failed.length
        ? `Could not load: ${failed.join(", ")}. Check the Network panel.`
        : ""
      renderList()
    } catch (error) {
      list.replaceChildren()
      count.textContent = ""
      homeMessage.hidden = false
      homeMessage.textContent = `${describe(error).title}. ${describe(error).text}`
    } finally {
      loading = null
    }
  })()
  return loading
}

function showHome(section) {
  const firstView = previousView === null
  previousView = "home"
  home.hidden = false
  detail.hidden = true
  document.title = SITE_TITLE
  ensureList()
  if (firstView && !section) return
  const target = (section && document.getElementById(section)) || document.querySelector(".intro")
  target.scrollIntoView()
  focusHeading(target)
}

// ---------------------------------------------------------------- herb view

function backLink() {
  return link("#herbs", "← All herbs", "back")
}

function renderHerb(herb) {
  const article = element("article", "herb")
  const title = element("h2", "name", herb.name)
  title.tabIndex = -1
  article.append(
    title,
    element("p", "latin", herb.latin),
    element("p", "use", herb.use),
    element("p", "life", herb.life),
    backLink())
  detail.replaceChildren(article)
  document.title = `${herb.name} – ${SITE_TITLE}`
  window.scrollTo(0, 0)
  title.focus({ preventScroll: true })
}

function renderError(error, id) {
  const { title, text } = describe(error, id)
  const box = element("div", "notice")
  box.setAttribute("role", "alert")
  const heading = element("h2", "", title)
  heading.tabIndex = -1
  box.append(heading, element("p", "", text), backLink())
  detail.replaceChildren(box)
  document.title = `${title} – ${SITE_TITLE}`
  window.scrollTo(0, 0)
  heading.focus({ preventScroll: true })
}

async function showDetail(id) {
  previousView = "detail"
  home.hidden = true
  detail.hidden = false
  detail.replaceChildren(element("p", "status", "Loading…"))
  try {
    const herb = await loadHerb(id)
    if (currentRoute() === id) renderHerb(herb) // ignore answers to an old route
  } catch (error) {
    if (currentRoute() === id) renderError(error, id)
  }
}

// ---------------------------------------------------------------- routing

function currentRoute() {
  let route = location.hash.slice(1)
  try {
    route = decodeURIComponent(route)
  } catch {
    // keep the raw text; it will simply not match any herb
  }
  return route.toLowerCase()
}

function route() {
  const id = currentRoute()
  if (id === "" || SECTIONS.includes(id)) showHome(id)
  else showDetail(id)
}

// ---------------------------------------------------------------- events

window.addEventListener("hashchange", route)

search.addEventListener("input", () => {
  state.query = search.value
  renderList()
})

lifeFilter.addEventListener("change", () => {
  state.life = lifeFilter.value
  renderList()
})

// Pressing Enter in the search box must not submit (and reload) the form.
document.querySelector(".filters").addEventListener("submit", event => event.preventDefault())

// "#main" is not a route, so the skip link moves focus by hand.
skipLink.addEventListener("click", event => {
  event.preventDefault()
  main.focus()
})

route()