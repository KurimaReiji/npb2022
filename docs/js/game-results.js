import {
  npbteams,
  nameToLeague,
  nameToNickname_en as nameToNickname,
  team_selector,
  opponent,
  runsAllowed,
  runsScored,
  createElement,
} from "npb2022";

const byDate = (a, b) => {
  if (a.date > b.date) return 1;
  if (a.date < b.date) return -1;
  return 0;
};

const byRunsScored = (a, b) => {
  if (a.rs > b.rs) return -1;
  if (a.rs < b.rs) return 1;
  return 0;
};

const byRunsAllowed = (a, b) => {
  if (a.ra > b.ra) return 1;
  if (a.ra < b.ra) return -1;
  return 0;
};

const nicknames = npbteams.map((t) => nameToNickname(t.name));

const byRdiff = (a, b) => {
  if (Math.abs(a.rs - a.ra) > Math.abs(b.rs - b.ra)) return 1;
  if (Math.abs(a.rs - a.ra) < Math.abs(b.rs - b.ra)) return -1;
  if (a.rs - a.ra > b.rs - b.ra) return -1;
  if (a.rs - a.ra < b.rs - b.ra) return 1;
  return 0;
};

const sorters = {
  byDate: [byRdiff, byRunsScored, byRunsAllowed, byDate],
  byRunsScored: [byDate, byRdiff, byRunsAllowed, byRunsScored],
  byRunsAllowed: [byDate, byRdiff, byRunsScored, byRunsAllowed],
  byRdiff: [byDate, byRunsAllowed, byRunsScored, byRdiff],
};

class TeamSelector extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const style = `<style>
      @import url("../css/npb-colors-applied.css");

      .team-selector {
        display: flex;
        align-items: center;
        margin: 1rem auto 0;
        padding: 0;
        width: 1152px;
        width: auto;
        max-width: 98%;
        height: 2rem;
        font-family: Arial, Helvetica, sans-serif;
      }
      .team-selector li {
        list-style: none;
        text-align: center;
        padding: 0.25em 0.5em;
        flex: 1;
      }
      .team-selector li:hover {
        cursor: pointer;
        padding: 0.4em 0.5em;
      }
      .team-selector li {
        color: #fff;
        background: var(--team-color, darkgray);
      }
    </style>`;
    const html = `<ul class="team-selector"></ul>`;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${style}${html}`;
  }

  connectedCallback() {
    this.render();

    const lis = npbteams
      .map((t) => nameToNickname(t.name))
      .map((name) => {
        return createElement("li")({
          text: name,
          dataset: {
            team: name,
          },
          cls: [name, nameToLeague(name)],
        });
      });

    this.shadowRoot.querySelector(".team-selector").append(...lis);
    [...this.shadowRoot.querySelectorAll(".team-selector li")].forEach((li) => {
      li.addEventListener("click", this.click_handler);
    });
  }

  click_handler(e) {
    const event = new CustomEvent("team-selected", {
      bubbles: true,
      composed: true,
      detail: { team: e.target.dataset.team },
    });
    this.dispatchEvent(event);
  }
}

class SorterSelector extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const style = `<style>
    .sorter-selector {
      display: flex;
      align-items: center;
      margin: 1rem auto;
      padding: 0;
      width: 1152px;
      height: 2rem;
      font-family: Arial, Helvetica, sans-serif;
    }
    .sorter-selector li {
      list-style: none;
      text-align: center;
      padding: 0.25em 0.5em;
      flex: 1;
    }
    .sorter-selector li:hover {
      cursor: pointer;
      padding: 0.4em 0.5em;
    }
    
    .sorter-selector li {
      background: var(--team-color, lightgray);
    }
    </style>`;
    const html = `<ul class="sorter-selector"></ul>`;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${style}${html}`;
  }

  connectedCallback() {
    this.render();

    const lis = Object.keys(sorters).map((name) => {
      const li = document.createElement("li");
      li.textContent = name.replace(/[A-Z]/g, " $&");
      li.dataset.sorter = name;
      return li;
    });

    this.shadowRoot.querySelector(`.sorter-selector`).append(...lis);

    const click_handler = (e) => {
      const event = new CustomEvent("sorter-selected", {
        bubbles: true,
        composed: true,
        detail: { sorter: e.target.dataset.sorter },
      });
      this.dispatchEvent(event);
    };

    [...this.shadowRoot.querySelectorAll(".sorter-selector li")].forEach(
      (li) => {
        li.addEventListener("click", click_handler);
      }
    );
  }
}

class StatusBar extends HTMLElement {
  static get observedAttributes() {
    return ["updated", "desc", "title", "team"];
  }

  constructor() {
    super();
  }

  render() {
    const style = `<style>
    @import url("../css/npb-colors-applied.css");
    :host {
      display: block;
    }
    .statusbar {
      background: var(--team-color, blue);
      color: white;
      font-size: 1em;
      line-height: var(--statusbar-height);
      height: var(--statusbar-height);
      display: flex;
      justify-content: space-between;
    }
    .statusbar > div:nth-of-type(1) {
      text-align: left;
      padding-left: 1em;
    }
    .statusbar > div:nth-of-type(2) {
      text-align: center;
    }
    .statusbar > div:nth-of-type(3) {
      text-align: right;
      padding-right: 1em;
    }
    </style>`;
    const html = `<div class="statusbar"><div>G</div><div></div><div></div></div>`;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${style}${html}`;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const barElement = this.shadowRoot.querySelector(".statusbar");
    if (name == "updated") {
      barElement.querySelector(`div:nth-of-type(3)`).textContent = newValue;
    } else if (name == "desc") {
      barElement.querySelector(`div:nth-of-type(2)`).textContent = newValue;
    } else if (name == "title") {
      barElement.querySelector(`div:nth-of-type(1)`).textContent = newValue;
    } else if (name == "team") {
      barElement.classList.remove(...barElement.classList);
      barElement.classList.add("statusbar", newValue);
    }
  }

  connectedCallback() {
    this.render();
  }
}

class GameResults extends HTMLElement {
  static get observedAttributes() {
    return ["team", "sorter", "updated"];
  }

  constructor() {
    super();
  }

  render() {
    const style = `<style>
    @import url("../css/npb-colors-applied.css");
    :host {
      --selectors-height: 100px;
      --chart-height: calc(var(--container-height, 600px) - var(--selectors-height));
      --bar-width: 7px;
      --narrow-bar-width: 2px;
      --bg-color: cornsilk;
      --statusbar-height: 24px;
      --tic-height: calc(5 * 10px);

      display: block;
    }
    .wrapper {
      box-sizing: border-box;
      width: auto;
      max-width: 98%;
      margin: 0 auto;
      position: relative;
      font-family: Arial, Helvetica, sans-serif;
      background: var(--bg-color);
    }
    .chart-frame {
      box-sizing: border-box;
      width: 100%;
      height: calc(var(--chart-height) - var(--statusbar-height));
      margin: 0 auto;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    status-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: var(--statusbar-height);
    }
    .bar {
      flex: 1;
      height: 100%;
      margin-right: 0px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border-right: 1px solid transparent;
    }
    .bar:hover {
      cursor: pointer;
    }
    .upper,
    .lower {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .upper {
      justify-content: flex-end;
      background-image: repeating-linear-gradient(0deg, var(--team-bgcolor,pink), var(--team-bgcolor,pink) var(--tic-height), var(--team-color,green) var(--tic-height), var(--team-color,green) calc(1px + var(--tic-height)));
    }
    .lower {
      justify-content: flex-start;
      box-sizing: border-box;
      border-top: var(--narrow-bar-width) solid var(--team-color, crimson);
      background-image: repeating-linear-gradient(180deg, var(--team-bgcolor), var(--team-bgcolor) var(--tic-height), lightgray var(--tic-height), lightgray calc(1px + var(--tic-height)));
    }
    .upper .rdiff {
      background: var(--team-color, green);
      opacity: 1;
    }
    .lower .rdiff {
      background: var(--team-color, crimson);
    }
    .rdiff {
      width: 100%;
    }
    .rs, .ra {
      width: var(--narrow-bar-width);
    }
    .rs {
      background: var(--team-color, blue);
    }
    .ra {
      background: var(--team-color, crimson);
    }
    </style>`;
    const html = `<div class="wrapper">
      <div class="chart-frame"></div>
      <status-bar></status-bar>
    </div>
    <team-selector></team-selector>
    <sorter-selector></sorter-selector>`;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${style}${html}`;
    customElements.define("status-bar", StatusBar);
    customElements.define("team-selector", TeamSelector);
    customElements.define("sorter-selector", SorterSelector);
    this.addEventListener("team-selected", (e) => {
      this.setAttribute("team", e.detail.team);
    });
    this.addEventListener("sorter-selected", (e) => {
      this.setAttribute("sorter", e.detail.sorter);
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    //console.log(`attr-change: ${name} ${newValue}`);
    if (oldValue === newValue) return;
    if (name == "updated") {
      this.maxRuns = Math.max(...this.params.games.map((g) => g.home.score));
      this.statusbar.setAttribute("updated", this.params.updated);
    } else if (name == "team") {
      this.team = newValue;
      if (!nicknames.includes(newValue)) this.team = "Dragons";
    } else if (name == "sorter") {
      this.sorter = newValue;
      if (!Object.keys(sorters).includes(newValue)) {
        this.sorter = "byDate";
      }
      if (newValue == "TBD") this.sorter = undefined;
    }
    if (!this.sorter) return;
    this.update_title(this.team, this.sorter);
    this.draw_chart(this.params.games, this.team, this.sorter, this.maxRuns);
    this.update_pathname(`/${this.team}/${this.sorter}`);
  }

  connectedCallback() {
    this.render();
    this.statusbar = this.shadowRoot.querySelector("status-bar");
  }

  update_pathname(pathname) {
    const [oldValue, newValue] = [
      this.params.appFrame.getAttribute("pathname"),
      pathname,
    ];
    if (oldValue !== newValue)
      this.params.appFrame.setAttribute("pathname", newValue);
  }

  update_title(team, sorter) {
    const str = `Game Results of ${team} Order ${sorter.replace(
      /[A-Z]/g,
      " $&"
    )}`;
    this.params.appFrame.setAttribute("title", str);
    this.statusbar.setAttribute("title", str);
  }

  draw_chart(games, team, sorter, maxRuns) {
    const myGames = games
      .filter(team_selector(team))
      .map((g) =>
        Object.assign(g, { rs: runsScored(team)(g), ra: runsAllowed(team)(g) })
      );
    const sorted = sorters[sorter].reduce((acc, cur) => {
      return myGames.sort(cur);
    }, myGames);
    const wrapper = this.shadowRoot.querySelector(".wrapper");
    wrapper.classList.remove(...wrapper.classList);
    wrapper.classList.add("wrapper", team);
    const frame = this.shadowRoot.querySelector(".chart-frame");
    frame.replaceChildren();
    this.statusbar.setAttribute("team", team);
    const divs = sorted.map((g) => {
      const opp = g.opponent || opponent(team)(g);

      const [bar, upper, lower, rdiff, rs, ra] = [
        "bar",
        "upper",
        "lower",
        "rdiff",
        "rs",
        "ra",
      ].map((name) => {
        const div = document.createElement("div");
        div.classList.add(name);
        return div;
      });
      upper.classList.add(team);
      lower.classList.add(opp);
      bar.append(upper, lower);

      upper.append(rs);
      lower.append(ra);
      rs.dataset.value = g.url ? runsScored(team)(g) : 0;
      ra.dataset.value = g.url ? runsAllowed(team)(g) : 0;
      rdiff.dataset.value = Number(rs.dataset.value) - Number(ra.dataset.value);
      rdiff.dataset.diff = 0;
      const d = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(`${g.date}T12:00`));
      const str = `${team} ${rs.dataset.value}-${ra.dataset.value} ${opp}, ${d}`;
      bar.dataset.desc = str;
      if (Number(rdiff.dataset.value) > 0) {
        upper.append(rdiff);
        rs.dataset.diff = rdiff.dataset.value;
        ra.dataset.diff = 0;
      } else {
        lower.prepend(rdiff);
        rs.dataset.diff = 0;
        ra.dataset.diff = rdiff.dataset.value.replace("-", "");
      }
      return bar;
    });
    frame.append(...divs);

    const barHeight = Number(
      window
        .getComputedStyle(this.shadowRoot.querySelector(`.bar`))
        .height.replace("px", "")
    );
    console.log(`barHeight: ${barHeight}`);
    const unit = barHeight / (2 * maxRuns + 2);
    this.style.setProperty("--tic-height", `${unit * 5}px`);

    [...this.shadowRoot.querySelectorAll(".rs, .ra, .rdiff")].forEach((el) => {
      const diff = Number(el.dataset.diff);
      const height = Math.abs(Number(el.dataset.value) - diff);
      el.style.height = `${height * unit}px`;
    });

    let disappearTimeout;
    [...this.shadowRoot.querySelectorAll(".bar")].forEach((el) => {
      el.addEventListener("click", ({ currentTarget }) => {
        const bar = currentTarget;
        this.statusbar.setAttribute("desc", bar.dataset.desc);
        clearTimeout(disappearTimeout);
        disappearTimeout = setTimeout(() => {
          this.statusbar.setAttribute("desc", "");
        }, 2000);
      });
    });
  }
}

export { GameResults };
