import {
  npbteams,
  nameToNickname,
  nameToInitial,
  nameToLeague,
  daysFromOpeningDay,
  createGameResult,
  games_behind,
  team_selector,
  games_at_home,
  games_on_road,
  get_records,
  teams_by_wpct,
} from "./npb2022.js";

const stat_tables = (stats) => {
  const league = nameToLeague(stats[0].team);

  const table = document.createElement("table");

  const thead = document.createElement("thead");
  thead.classList.add(league);

  const tbody = document.createElement("tbody");
  const h2hOrdered = stats.map((obj) => obj.team);

  stats.forEach((obj) => {
    const team = obj.team;
    [obj.total, obj.home, obj.road].map((o, i) => {
      const tr = document.createElement("tr");
      tr.classList.add(team);
      const data = [
        [team, "home", "road"][i],
        o.win,
        o.loss,
        o.tied,
        o.winpct.toFixed(3).replace(/^0/, ""),
        "", // GB
        o.rs,
        o.ra,
        o.rdiff,
        `${o.oneRun.win}-${o.oneRun.loss}`,
        `${o.shutout.pitching},${o.shutout.batting}`,
        `${o.tenPlusRun.scored},${o.tenPlusRun.allowed}`,
        "", // blank
        ...h2hOrdered
          .map((t) => o.headToHead.find((obj) => obj.opponent == t))
          .map((h) => {
            if (!h) return "";
            return `${h.win}-${h.loss}`;
          }),
        [o.headToHead.find((obj) => obj.opponent == "Int")].map((h) => {
          if (!h) return "";
          return `${h.win}-${h.loss}`;
        })[0], // interleague
      ];
      const tds = data.map((d) => {
        const td = document.createElement("td");
        td.textContent = d;
        return td;
      });
      tr.append(...tds);
      tbody.append(tr);
    });
  });

  const headerTr = document.createElement("tr");
  headerTr.append(
    ...[
      "Teams",
      "W",
      "L",
      "T",
      "PCT",
      "GB",
      "RS",
      "RA",
      "Rdiff",
      "1Run",
      "SHO",
      "10+R",
      "",
    ]
      .concat(h2hOrdered.map((t) => `vs. ${nameToInitial(t)}`))
      .concat(["Int"])
      .map((s) => {
        const th = document.createElement("th");
        th.textContent = s;
        if (s.includes("vs.")) th.classList.add(s.replace("vs. ", ""));
        return th;
      })
  );
  thead.append(headerTr);
  thead
    .querySelector(`th:nth-last-of-type(1)`)
    .classList.add(league == "Central" ? "Pacific" : "Central");

  table.append(thead, tbody);
  const frame = document.createElement("div");
  frame.classList.add("standings");
  frame.append(table);
  document.querySelector(`[data-league="${league}"]`).append(frame);

  // Games Behind needs to know leader's record
  const leaderTr = tbody.querySelector(`tr:nth-of-type(1)`);
  const leader = {
    win: leaderTr.querySelector(`td:nth-of-type(2)`),
    loss: leaderTr.querySelector(`td:nth-of-type(3)`),
  };
  [...tbody.querySelectorAll(`tr:nth-of-type(3n+1) td:nth-of-type(6)`)].forEach(
    (target) => {
      const tr = target.closest("tr");
      const win = tr.querySelector(`td:nth-of-type(2)`);
      const loss = win.nextElementSibling;

      target.textContent = games_behind(
        ...[win, loss, leader.win, leader.loss].map((el) =>
          Number(el.textContent)
        )
      );
    }
  );
};

document.addEventListener("DOMContentLoaded", async () => {
  const year = "2022";
  const jsonfile = `https://kurimareiji.github.io/npb${year}/games${year}.json`;
  const inputs = await (await fetch(jsonfile, { cache: "no-cache" })).json();
  const games = inputs.map(createGameResult);
  const dates = ((g) => {
    const gamedays = g.map((game) => game.date).sort();
    const d = {
      start: gamedays[0],
      end: gamedays.slice(-1)[0],
    };
    d.duration = daysFromOpeningDay(d.end, d.start);
    return d;
  })(games);

  const stats = npbteams
    .map((t) => nameToNickname(t.name))
    .map((team) => {
      const myGames = games.filter(team_selector(team));
      const total = get_records(team)(myGames);
      const home = get_records(team)(myGames.filter(games_at_home(team)));
      const road = get_records(team)(myGames.filter(games_on_road(team)));

      return { team, total, home, road, win: total.win, loss: total.loss };
    })
    .sort(teams_by_wpct)
    .map((obj) => {
      delete obj.win;
      delete obj.loss;
      return obj;
    });

  ["Central", "Pacific"].forEach((league) => {
    stat_tables(stats.filter((obj) => nameToLeague(obj.team) == league));
  });

  const updated = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dates.end}T12:00`));

  document.querySelectorAll(".standings table").forEach((table) => {
    table.dataset.updated = `After games of ${updated}`;
    table.dataset.days = dates.duration;
  });
});
