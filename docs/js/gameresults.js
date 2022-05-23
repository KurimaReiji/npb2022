import { find_team, nameToLeague, nameToNickname } from "./npb2022-teams.js";
import {
  npbteams,
  createGameResult,
  daysFromOpeningDay,
  team_selector,
  opponent,
  runsAllowed,
  runsScored,
} from "./npb2022.js";

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

const byRdiff = (a, b) => {
  if (a.rs - a.ra > b.rs - b.ra) return -1;
  if (a.rs - a.ra < b.rs - b.ra) return 1;
  return 0;
};

const draw_chart = (games, unit) => (team) => {
  const headToHead25Games = npbteams
    .filter(
      (t) =>
        t.league == find_team(team).league && team != nameToNickname(t.name)
    )
    .map((t) => [...new Array(25)].map((a) => nameToNickname(t.name)));
  const interLeague3Games = npbteams
    .filter((t) => t.league != find_team(team).league)
    .map((t) => [...new Array(3)].map((a) => nameToNickname(t.name)));
  const seasonGames = headToHead25Games
    .concat(interLeague3Games)
    .flat()
    .map((t) => {
      return {
        team,
        date: "2022-12-01",
        opponent: t,
        rs: -1,
        ra: -1,
      };
    });
  const myGames = games
    .filter(team_selector(team))
    .map((g) =>
      Object.assign(g, { rs: runsScored(team)(g), ra: runsAllowed(team)(g) })
    );
  myGames.forEach((g) => {
    const idx = seasonGames.findIndex((g0) => g0.opponent == opponent(team)(g));
    seasonGames[idx] = Object.assign({}, g);
  });
  //const sorted = seasonGames.sort(byDate);
  //const sorted = seasonGames.sort(byDate).sort(byRdiff).sort(byRunsScored);
  const sorted = myGames.sort(byDate).sort(byRdiff).sort(byRunsScored);
  const frame = document.querySelector(".frame");
  frame.replaceChildren();
  frame.classList.remove(...frame.classList);
  frame.classList.add("frame", team);
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
    const str = `${g.date} ${team} ${rs.dataset.value}-${ra.dataset.value} ${opp}`;
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

  [...document.querySelectorAll(".rs, .ra, .rdiff")].forEach((el) => {
    const diff = Number(el.dataset.diff);
    const height = Math.abs(Number(el.dataset.value) - diff);
    el.style.height = `${height * unit}px`;
  });
  let disappearTimeout;
  [...document.querySelectorAll(".bar")].forEach((el) => {
    el.addEventListener("click", ({ currentTarget }) => {
      const bar = currentTarget;
      frame.dataset.desc = bar.dataset.desc.replace(/ /, "\n");
      clearTimeout(disappearTimeout);
      disappearTimeout = setTimeout(() => {
        frame.dataset.desc = "";
      }, 2000);
    });
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  const year = "2022";
  const jsonfile = `./games${year}.json`;
  const inputs = await (await fetch(jsonfile, { cache: "no-cache" })).json();
  const games = inputs.map(createGameResult);
  const maxRuns = Math.max(...games.map((g) => g.home.score)); //17
  const unit = 648 / (2 * maxRuns + 1);

  draw_chart(games, unit)("Dragons");

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
      draw_chart(games, unit)(target.dataset.team);
    });
  });
});
