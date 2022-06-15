import {
  npbteams,
  nameToNickname,
  nameToInitial,
  nameToLeague,
  games_behind,
  team_selector,
  games_at_home,
  games_on_road,
  get_records,
  teams_by_wpct,
  createElement,
} from "npb2022";

class NpbStandings extends HTMLElement {
  static get observedAttributes() {
    return ["league", "updated"];
  }

  calc_stats(games) {
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
    return stats;
  }

  stat_tables(stats) {
    const league = nameToLeague(stats[0].team);

    const table = createElement("table")({
      dataset: {
        updated: this.updated,
      },
    });
    const thead = createElement("thead")({
      cls: [league],
    });

    const tbody = document.createElement("tbody");
    const h2hOrdered = stats.map((obj) => obj.team);

    stats.forEach((obj) => {
      const team = obj.team;
      [obj.total, obj.home, obj.road].map((o, i) => {
        const tr = createElement("tr")({
          cls: [team],
        });
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
        const tds = data.map((d) => createElement("td")({ text: d }));
        tr.append(...tds);
        tbody.append(tr);
      });
    });

    const headerTr = createElement("tr")({});
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
    const frame = createElement("div")({
      cls: ["standings"],
    });
    frame.append(table);
    this.shadowRoot.querySelector(`[data-league="${league}"]`).append(frame);

    // "Games Behind" needs to know leader's record
    const leaderTr = tbody.querySelector(`tr:nth-of-type(1)`);
    const leader = {
      win: leaderTr.querySelector(`td:nth-of-type(2)`),
      loss: leaderTr.querySelector(`td:nth-of-type(3)`),
    };
    [
      ...tbody.querySelectorAll(`tr:nth-of-type(3n+1) td:nth-of-type(6)`),
    ].forEach((target) => {
      const tr = target.closest("tr");
      const win = tr.querySelector(`td:nth-of-type(2)`);
      const loss = win.nextElementSibling;

      target.textContent = games_behind(
        ...[win, loss, leader.win, leader.loss].map((el) =>
          Number(el.textContent)
        )
      );
    });
  }

  constructor() {
    super();
  }

  render() {
    const style = `<style>
    @import url("../css/npb-colors-applied.css");
    @import url("../css/standings-table.css");
    :host {
      display: block;
    }
    .table-frame {
      width: 1152px;
      margin: 0 auto;
    }
    .hide {
      display: none;
    }
    p {
      margin: 1rem auto 0 24px;
    }
    .notes {
      margin: 1rem auto 0 auto;
      padding: 0;
      max-width: 1154px;
      display: flex;
      flex-wrap: wrap;
      list-style: none;
    }
    .notes li {
      margin-right: 1rem;
      break-word: none;
    }
    </style>`;
    const html = `<div class="table-frame hide" data-league="Central"></div>
    <div class="table-frame hide" data-league="Pacific"></div>
    <ul class="notes"><li>1Run: One Run Games (W-L)</li><li>SHO: Shutout Games (Pitching, Batting)</li><li>10+R: 10 Runs and more (Scored, Allowed)</li></ul>`;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${style}${html}`;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    //console.log(`attr-change: ${name} ${newValue}`);
    if (oldValue === newValue) return;

    if (name == "updated") {
      this.stats = this.calc_stats(this.params.games);
      this.updated = `After games of ${newValue}`;
      this.frames = {};
      ["Central", "Pacific"].forEach((league) => {
        this.stat_tables(
          this.stats.filter((obj) => nameToLeague(obj.team) == league)
        );
        const frame = this.shadowRoot.querySelector(
          `[data-league="${league}"]`
        );
        this.frames[league] = frame;
      });
    } else if (name == "league") {
      ["Central", "Pacific"].forEach((league) => {
        const frame = this.frames[league];
        newValue == league
          ? frame.classList.remove("hide")
          : frame.classList.add("hide");
      });
      this.update_pathname(newValue);
      this.update_title(newValue);
    }
  }

  update_pathname(league) {
    const [oldValue, newValue] = [
      this.params.appFrame.getAttribute("pathname"),
      `/${league}/standings`,
    ];
    console.log(oldValue, newValue);
    if (oldValue !== newValue)
      this.params.appFrame.setAttribute("pathname", newValue);
  }

  update_title(league) {
    const str = `${league} League Standings`;
    this.params.appFrame.setAttribute("title", str);
  }

  connectedCallback() {
    this.render();
  }
}

export { NpbStandings };
