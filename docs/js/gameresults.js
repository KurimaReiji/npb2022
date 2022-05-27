import {
  npbteams,
  nameToLeague,
  nameToNickname_en as nameToNickname,
  daysFromOpeningDay,
  createGameResult,
  team_selector,
  opponent,
  runsAllowed,
  runsScored,
} from "./npb2022.js";

const params = new URLSearchParams(location.search);

const store = new Proxy(
  {},
  {
    get: function (target, prop) {
      return Reflect.get(...arguments);
    },
    set: function (target, prop, val) {
      if (prop === "team") {
        target[prop] = nameToNickname(val) ? nameToNickname(val) : "Dragons";
      } else if (prop === "sorter") {
        target[prop] = "byDate";
        if (val in sorters) target[prop] = val;
      }
      // init を用意して、updateをわければなんとかなるかも。
      if (["team", "sorter"].indexOf(prop) >= 0) {
        if (target.team && target.sorter)
          update_page(target.team, target.sorter);
        return true;
      }
      return Reflect.set(...arguments);
    },
  }
);

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

const nicknames = npbteams.map((t) => nameToNickname(t));

const update_page = (team, sorter) => {
  update_title(team, sorter);
  draw_chart(team, sorter);

  window.history.pushState(null, "", `?team=${team}&sort=${sorter}`);
};

const draw_chart = (team, sorter) => {
  const { maxRuns } = store;

  const myGames = store.games
    .filter(team_selector(team))
    .map((g) =>
      Object.assign(g, { rs: runsScored(team)(g), ra: runsAllowed(team)(g) })
    );
  const sorted = sorters[sorter].reduce((acc, cur) => {
    return myGames.sort(cur);
  }, myGames);

  const wrapper = document.querySelector(".wrapper");
  const frame = document.querySelector(".frame");
  frame.replaceChildren();
  wrapper.classList.remove(...wrapper.classList);
  wrapper.classList.add("wrapper", team);
  frame.dataset.team = team;
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
      .getComputedStyle(document.querySelector(`.bar`))
      .height.replace("px", "")
  );
  const unit = barHeight / (2 * maxRuns + 2);

  [...document.querySelectorAll(".rs, .ra, .rdiff")].forEach((el) => {
    const diff = Number(el.dataset.diff);
    const height = Math.abs(Number(el.dataset.value) - diff);
    el.style.height = `${height * unit}px`;
  });

  let disappearTimeout;
  [...document.querySelectorAll(".bar")].forEach((el) => {
    el.addEventListener("click", ({ currentTarget }) => {
      const bar = currentTarget;
      const statusbar = document.querySelector(`.statusbar`);
      statusbar.dataset.desc = bar.dataset.desc;
      clearTimeout(disappearTimeout);
      disappearTimeout = setTimeout(() => {
        statusbar.dataset.desc = "";
      }, 2000);
    });
  });
};

const update_title = (team, sorter) => {
  const str = `Game Results of ${team} Order ${sorter.replace(
    /[A-Z]/g,
    " $&"
  )}`;
  const title = document.querySelector("title");
  title.textContent = `${str} | NPB 2022`;
  document.querySelector(`.statusbar`).dataset.title = str;
};

const create_team_selector = () => {
  const lis = npbteams
    .map((t) => nameToNickname(t.name))
    .map((name) => {
      const li = document.createElement("li");
      li.dataset.team = name;
      li.textContent = name;
      li.classList.add(name, nameToLeague(name));
      return li;
    });

  document.querySelector(".team-selector").append(...lis);
  [...document.querySelectorAll(".team-selector li")].forEach((li) => {
    li.addEventListener("click", ({ target }) => {
      store.team = target.dataset.team;
    });
  });
};

const create_sorter_selector = () => {
  const lis = Object.keys(sorters).map((name) => {
    const li = document.createElement("li");
    li.textContent = name.replace(/[A-Z]/g, " $&");
    li.dataset.sorter = name;
    return li;
  });

  document.querySelector(`.sorter-selector`).append(...lis);

  [...document.querySelectorAll(".sorter-selector li")].forEach((li) => {
    li.addEventListener("click", ({ target }) => {
      store.sorter = target.dataset.sorter;
    });
  });
};

create_team_selector();
create_sorter_selector();

const status_observer = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "attributes") {
      if (mutation.attributeName === "data-updated") {
        document.querySelector(`.statusbar>div:nth-of-type(3)`).textContent =
          mutation.target.dataset.updated;
      } else if (mutation.attributeName === "data-desc") {
        document.querySelector(`.statusbar>div:nth-of-type(2)`).textContent =
          mutation.target.dataset.desc;
      } else if (mutation.attributeName === "data-title") {
        document.querySelector(`.statusbar>div:nth-of-type(1)`).textContent =
          mutation.target.dataset.title;
      }
    }
  }
});
status_observer.observe(document.querySelector(`.statusbar`), {
  attributes: true,
});

document.addEventListener("DOMContentLoaded", async () => {
  const year = "2022";
  const jsonfile = `./games${year}.json`;
  const inputs = await (await fetch(jsonfile, { cache: "no-cache" })).json();
  store.games = inputs.map(createGameResult);
  store.maxRuns = Math.max(...store.games.map((g) => g.home.score)); //17

  const team = params.get("team") in nicknames ? params.get("team") : "Dragons";
  const sorter = params.get("sort") in sorters ? params.get("sort") : "byDate";
  update_page(team, sorter);
  store.team = team;
  store.sorter = sorter;
  window.addEventListener("popstate", () => {
    ["team", "sorter"].forEach((key) => {
      store[key] = params.get(key);
    });
  });

  const dates = ((g) => {
    const gamedays = g.map((game) => game.date).sort();
    const d = {
      start: gamedays[0],
      end: gamedays.slice(-1)[0],
    };
    d.duration = daysFromOpeningDay(d.end, d.start);
    return d;
  })(store.games);
  const updated = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dates.end}T12:00`));
  document.querySelector(`.statusbar`).dataset.updated = updated;
});
