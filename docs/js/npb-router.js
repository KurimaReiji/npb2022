import {
  npbteams,
  nameToNickname,
  daysFromOpeningDay,
  createGameResult,
  createElement,
} from "npb2022";

import { GameResults } from "game-results";
import { NpbStandings } from "npb-standings";
import { NpbAbove500 } from "npb-above500";

const nicknames = npbteams.map((t) => nameToNickname(t.name));
const sorters = ["byDate", "byRunsScored", "byRunsAllowed", "byRdiff"];

const appframe_observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "attributes") {
      if (mutation.attributeName === "title") {
        update_title(mutation.target.getAttribute("title"));
      } else if (mutation.attributeName === "pathname") {
        const pathname = mutation.target.getAttribute("pathname");
        if (pathname !== location.pathname) {
          history.pushState(null, null, pathname);
          console.log(`pushed: ${pathname}`);
        }
      }
    }
  }
});

const update_title = (text) => {
  document.querySelector("title").textContent = text;
};

class NpbRouter extends HTMLElement {
  static get observedAttributes() {
    return ["pathname"];
  }

  constructor() {
    super();
    this.apps = {};
  }

  render() {
    const style = `<style>
    h1[data-code="404"] {
      margin: 1rem;
    }
    </style>`;

    const html = `<div class="npb-container"><div id="npb2022"></div></div>`;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${style}${html}`;
    ["width", "height"]
      .map((prop) => {
        return { prop, value: window.getComputedStyle(this)[prop] };
      })
      .forEach((obj) => {
        this.style.setProperty(`--container-${obj.prop}`, obj.value);
      });
  }

  async load_json(year = "2022") {
    if (this.params && this.params.games) return this.params;
    const params = {};
    const jsonfile = `../games${year}.json`;
    const inputs = await (await fetch(jsonfile, { cache: "no-cache" })).json();
    params.games = inputs.map(createGameResult);

    params.dates = ((g) => {
      const gamedays = g.map((game) => game.date).sort();
      const d = {
        start: gamedays[0],
        end: gamedays.slice(-1)[0],
      };
      d.duration = daysFromOpeningDay(d.end, d.start);
      return d;
    })(params.games);
    params.updated = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${params.dates.end}T12:00`));
    this.params = Object.assign({}, this.params, params);
    return this.params;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`attr-change: ${name} ${newValue}`);
    if (oldValue === newValue) return;
    if (name == "pathname") {
      this.route(newValue);
    }
  }

  connectedCallback() {
    this.params = {};
    this.render();
    this.container = this.shadowRoot.querySelector(".npb-container");
    this.params.appFrame = this.shadowRoot.getElementById("npb2022");

    this.standings = {
      tag: "npb-standings",
      customElment: NpbStandings,
      routes: ["/Central/standings", "/Pacific/standings"],
    };

    this.above500 = {
      tag: "npb-above500",
      customElment: NpbAbove500,
      routes: ["/Central/above500", "/Pacific/above500"],
    };

    this.gameresults = {
      tag: "game-results",
      customElment: GameResults,
      routes: nicknames
        .map((team) => sorters.map((sorter) => `/${team}/${sorter}`))
        .flat(),
    };

    appframe_observer.observe(this.params.appFrame, { attributes: true });

    this.load_json().then(() => {
      this.route(location.pathname);
    });

    window.addEventListener("popstate", (e) => {
      console.log(e);
      this.route(location.pathname);
    });
  }

  route(path) {
    const params = this.params;
    let appEl;
    const path2 = `/${path.split("/").slice(-2).join("/")}`;
    if (this.standings.routes.includes(path2)) {
      appEl = this.init(this.standings);
      appEl.setAttribute("updated", params.updated);
      appEl.setAttribute("league", path2.split("/").slice(-2, 2)[0]);
    } else if (this.above500.routes.includes(path)) {
      appEl = this.init(this.above500);
      appEl.setAttribute("updated", params.updated);
      appEl.setAttribute("league", path2.split("/").slice(-2, 2)[0]);
    } else if (this.gameresults.routes.includes(path2)) {
      const [team, sorter] = path2.split("/").slice(-2);
      appEl = this.init(this.gameresults);
      appEl.setAttribute("updated", params.updated);
      appEl.setAttribute("sorter", "TBD");
      appEl.setAttribute("team", team);
      appEl.setAttribute("sorter", sorter);
    } else {
      console.log(`path: ${path}`);
      this.not_found();
    }
  }

  init(app) {
    const params = this.params;
    let appEl = this.shadowRoot.querySelector(app.tag);
    if (appEl) return appEl;

    params.appFrame.replaceChildren();
    appEl = this.apps[app.tag];
    if (appEl) {
      params.appFrame.append(appEl);
      return appEl;
    }

    appEl = document.createElement(app.tag);
    params.appFrame.append(appEl);
    customElements.define(app.tag, app.customElment);
    appEl.params = params;
    this.apps[app.tag] = appEl;
    return appEl;
  }

  not_found() {
    const h1 = createElement("h1")({
      text: "404 Not Found",
      dataset: { code: "404" },
    });
    const anchor = createElement("a")({
      text: "Go to Home",
      attr: {
        href: "/",
      },
    });
    this.container.replaceChildren();
    this.container.append(h1, anchor);
  }
}

export { NpbRouter };
