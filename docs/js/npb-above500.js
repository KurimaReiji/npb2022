import {
  createSVG,
  createCircle,
  createGroup,
  createPath,
  createText,
  createTextbox,
  createBackgroundRect,
  createScale,
  createTics,
  createAxis,
  trunc,
} from "svg-utils";

import {
  npbteams,
  nameToNickname,
  nameToLeague,
  daysFromOpeningDay,
  team_selector,
  games_tied,
  opponent,
  teams_by_wpct,
} from "npb2022";

const moveTo = (series, params, n) => {
  const { xShift, gSeries } = params;
  const { xScale, yScale, dx } = params.scales;
  gSeries.replaceChildren();
  [...series].reverse().forEach((s) => {
    const team = s.team;
    const g = createGroup({
      attr: {
        id: team,
      },
      cls: [team, "series"],
    });

    const path = createPath({
      attr: Object.assign({}, params.path, {
        d:
          `M ${xScale(0)} ${yScale(0)}` +
          s.values
            .map(
              (w, i) =>
                ` ${i < xShift ? "M" : "L"} ${xScale(w.x)} ${yScale(w.y)}`
            )
            .join(""),
      }),
    });
    g.append(path);

    s.values
      .map((w, i) => {
        if (i < xShift - 1) return false;
        const c = createCircle({
          attr: Object.assign({}, params.dot, {
            cx: xScale(w.x),
            cy: yScale(w.y),
          }),
          dataset: { x: w.x, y: w.y },
          cls: ["dot", w.opp],
        });
        return c;
      })
      .filter((c) => c)
      .forEach((c) => g.append(c));

    const labelText = createText({
      text: `${team} (${s.win}-${s.loss})`,
      attr: Object.assign({}, params.label, {
        x: xScale(n) + params.padding.right * 0.1,
        y: yScale(s.above.final),
      }),
      dataset: { y: s.above.final },
      cls: ["label"],
    });
    g.append(labelText);
    gSeries.append(g);
  });
  const targetLabels = series.map((s) =>
    gSeries.querySelector(`#${s.team} .label`)
  );
  fix_overlapping(targetLabels);
};

const fix_overlapping = (targets) => {
  const isOverlapped = (y, i, ary) => {
    if (!ary[i + 1]) return false;
    return y + h > ary[i + 1];
  };
  const h = Number(targets[0].getAttribute("font-size"));
  const step = h * 0.125;
  let bboxes = targets.map((el) => el.getBBox().y);

  while (bboxes.some(isOverlapped)) {
    const idx0 = bboxes.findIndex(isOverlapped);
    const label0 = targets[idx0];
    const y0 = Number(label0.getAttribute("y"));
    label0.setAttribute("y", trunc(y0 - step));

    const label1 = targets[idx0 + 1];
    const y1 = Number(label1.getAttribute("y"));
    label1.setAttribute("y", trunc(y1 + step));
    bboxes = targets.map((el) => el.getBBox().y);
  }
};

const draw_chart = (params) => {
  const { xRange, yRange, tics, axis, title, canvas } = params;

  const fragment = document.createDocumentFragment();

  const svg = createSVG(xRange, yRange);

  const bgRect = createBackgroundRect(svg);
  const gTics = createTics(tics);
  const gAxis = createAxis(axis);
  const gSeries = createGroup({ cls: ["series"] });
  const gTitle = createTextbox(title);

  fragment.append(bgRect, gTics, gAxis, gSeries, gTitle);
  svg.append(fragment);
  canvas.replaceChildren(svg);
};

const get_wlt = (team) => (g) => {
  if (g) return g.winner == team ? 1 : g.loser == team ? -1 : 0;
  return 0;
};

const chart_param_builder = (
  series,
  dates,
  duration,
  wwidth = 1152,
  height = 648
) => {
  height = Math.floor(Math.min((height / wwidth) * 1152 - 60, 1152));
  const year = dates.start.split("-")[0];
  const yMax = Math.max(...series.map((s) => s.above.max));
  const yMin = Math.min(...series.map((s) => s.above.min));

  const xShift = dates.duration - duration;

  const xAxis = [xShift, dates.duration + 0];
  const yAxis = [yMin - 2, yMax + 2].map((n) =>
    n % 5 == 0 ? n + Math.sign(n) : n
  );
  const xDomain = xAxis;
  const yDomain = [...yAxis].reverse();
  //const [width, height] = [1152, 648];
  const width = 1152;
  const vw = trunc(width * 0.01);
  const [xRange, yRange] = [
    [0, width],
    [0, height],
  ];
  const padding = {
    top: trunc(Math.min(height * 0.08, 5 * vw)),
    right: trunc(width * 0.17),
    bottom: trunc(Math.min(height * 0.05, 4 * vw)),
    left: trunc(width * 0.04),
  };

  const xScale = createScale(xDomain, xRange, padding.left, padding.right);
  const yScale = createScale(yDomain, yRange, padding.top, padding.bottom);
  const dx = trunc(xScale(1) - xScale(0));
  const dy = trunc(yScale(0) - yScale(1));
  const u = Math.min(dx, dy);
  const scales = { xScale, yScale, dx, dy };

  const axis = {
    pathStyle: { "stroke-width": 0.2 * vw },
    lines: [
      [
        [xScale(xAxis[0]), yScale(0)],
        [xScale(xAxis[1]), yScale(0)],
      ],
      [
        [xScale(xShift), yScale(yAxis[0])],
        [xScale(xShift), yScale(yAxis[1])],
      ],
    ],
  };

  const xTics = "04,05,06,07,08,09,10"
    .split(",")
    .map((mm) => {
      return "01,15".split(",").map((dd) => `${year}-${mm}-${dd}`);
    })
    .flat()
    .concat([dates.end])
    .map((d) => {
      return {
        pos: daysFromOpeningDay(d, dates.start),
        text: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(`${d}T12:00`)),
      };
    })
    .filter((obj) => obj.pos <= xAxis[1] && obj.pos > xAxis[0])
    .filter((obj, i, ary) =>
      ary.length > 5 ? obj.text.endsWith("1") || i == ary.length - 1 : true
    )
    .filter(
      (obj, i, a) => i == a.length - 1 || obj.pos < a[a.length - 1].pos - 2
    );

  const yTics = [...new Array(30)]
    .map((n, i) => i * 5 - 60)
    .filter((n) => n < yAxis[1] && n > yAxis[0])
    .map((n) => {
      return { pos: n, text: n };
    });

  const tics = {
    xAxis: xAxis.map((v) => trunc(xScale(v))),
    yAxis: yAxis.map((v) => trunc(yScale(v))),
    xTics: xTics.map((o) => Object.assign(o, { pos: trunc(xScale(o.pos)) })),
    yTics: yTics.map((o) => Object.assign(o, { pos: trunc(yScale(o.pos)) })),
    xTicsPos: trunc(xScale(xShift) - width * 0.01),
    yTicsPos: trunc(yScale(yAxis[0]) + padding.bottom * 0.4),
    pathStyle: {
      "stroke-width": 0.1 * vw,
    },
    labelStyle: {
      "font-size": 1.5 * vw,
      "alignment-baseline": "middle",
    },
  };

  const league = nameToLeague(series[0].team);
  const title = {
    text: `Games above .500, 2022 ${league} League`,
    attr: {
      x: width * 0.5,
      y: trunc(Math.min(height * 0.05, (padding.top + 24) * 0.5)),
      "font-size": 24,
      "text-anchor": "middle",
      "alignment-baseline": "middle",
    },
    cls: ["title"],
  };

  const path = {
    fill: "none",
    "stroke-width": Math.min(dx, 0.6 * vw),
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
  };
  const dot = {
    r: Math.min(u * 0.5, 0.6 * vw),
  };
  const label = {
    "font-size": 1.75 * vw,
    "alignment-baseline": "middle",
  };
  const params = {
    xRange,
    yRange,
    padding,
    xShift,
    scales,
    axis,
    tics,
    title,
    league,
    path,
    dot,
    label,
  };
  return params;
};

const make_series = (games, dates) => {
  const alldays = [...new Array(dates.duration)].map((n, i) => i + 1);
  const series = npbteams
    .map((t) => nameToNickname(t.name))
    .map((team) => {
      const myGames = games.filter(team_selector(team));
      const win = myGames.filter((g) => g.winner == team).length;
      const loss = myGames.filter((g) => g.loser == team).length;
      const tied = myGames.filter(games_tied).length;

      const log = alldays.map((i) =>
        myGames.find((o) => daysFromOpeningDay(o.date, dates.start) == i)
      );
      const wlt = log.map(get_wlt(team));
      const values = log.map((g, i) => {
        return {
          x: i + 1,
          y: wlt.slice(0, i + 1).reduce((acc, cur) => acc + cur, 0),
          opp: opponent(team)(g),
        };
      });
      const above = {
        min: Math.min(...values.map((pt) => pt.y)),
        max: Math.max(...values.map((pt) => pt.y)),
        final: values.slice(-1)[0].y,
      };
      return {
        team,
        win,
        loss,
        tied,
        values,
        above,
      };
    })
    .sort(teams_by_wpct);
  return series;
};

class NpbAbove500 extends HTMLElement {
  static get observedAttributes() {
    return ["league", "updated", "duration"];
  }

  constructor() {
    super();
  }

  render() {
    const style = `<style>
    @import url("../css/npb-colors-applied.css");
    :host {
      display: block;
      --bg-color: var(--bg-color, crimson);
    }
    .chart-frame {
      width: calc(var(--container-width) - 2rem);
      margin: 0 auto;
    }
    .hide {
      display: none;
    }
    svg {
      width: 100%;
    }
    
    text {
      font-family: Arial, Verdana, "IBM Plex Sans", sans-serif;
    }
    
    .bgRect {
      stroke: none;
      fill: var(--bg-color, cornsilk);
    }
    
    .tics,
    .axis {
      stroke: var(--text-color, midnightblue);
      fill: none;
    }
    
    .tics path {
      stroke-opacity: 0.5;
    }
    
    .tics text {
      stroke: none;
      fill: var(--text-color, midnightblue);
    }
    
    .ytics {
      text-anchor: end;
    }

    .xtics {
      text-anchor: middle;
    }
    
    .off {
      display: none;
    }

    .series path {
      stroke: var(--team-color);
      stroke-opacity: 0.7;
      filter: drop-shadow(0px 1px 0px rgba(0, 0, 0, 0.9));
    }
    .series circle {
      fill: var(--team-color);
      fill-opacity: 0.7;
      filter: drop-shadow(0px 1px 0px rgba(0, 0, 0, 0.9));
    }
    .series text {
      fill: var(--team-color);
      font-weight: bold;
      //filter: drop-shadow(0px 1px 0px rgba(0, 0, 0, 0.9));
    }

    .textbox rect {
      fill: var(--bg-color);
    }

    ul {
      list-style: none;
      margin: 1rem 0 0 1rem; padding: 0;
      display: flex;
      align-items: center;
      height: 2rem;
    }

    li {
      margin: 0; padding: 0 1.5em;
      background: lightgray;
    }

    li:hover {
      cursor: pointer;
      padding: 0.25em 1.5em;
    }
    </style>`;
    const html = `<div class="chart-frame" data-league="Central"></div>
    <div class="chart-frame" data-league="Pacific"></div>
    <ul>
      <li id="from" data-prev="40" data-days="50">From the Opening day</li>
    </ul>
    `;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${style}${html}`;

    this.changer = this.shadowRoot.getElementById("from");
    this.changer.addEventListener("click", this.date_handler);

    this.addEventListener("set-duration", (e) => {
      const d = e.detail.duration;
      this.setAttribute("duration", d);
      const prev = this.changer.dataset.prev;
      const days = this.changer.dataset.days;
      this.changer.dataset.duration = d == prev ? days : prev;
      //console.log(`d: ${d},${days}`);
    });
  }

  date_handler({ target }) {
    const prev = this.dataset.prev;
    const texts = ["From the Opening day", `Previous ${prev} days`];
    const text = target.textContent == texts[0] ? texts[1] : texts[0];
    target.textContent = text;
    const event = new CustomEvent("set-duration", {
      bubbles: true,
      composed: true,
      detail: { duration: target.dataset.duration },
    });
    this.dispatchEvent(event);
    //console.log(`date_handler: ${event.detail.duration}`);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    //console.log(`attr-change: ${name} ${newValue}`);
    if (oldValue === newValue) return;

    if (name == "updated") {
      const { games, dates } = this.params;
      this.updated = `After games of ${newValue}`;
      this.changer.dataset.days = dates.duration;

      const series = make_series(games, dates);
      this.series = series;

      const duration = this.changer.dataset.prev;
      this.changer.dataset.duration = dates.duration;

      [...this.shadowRoot.querySelectorAll(`.chart-frame`)].forEach((el) => {
        el.dataset.days = dates.duration;
      });

      ["Central", "Pacific"].forEach((league) => {
        const s = series.filter((obj) => nameToLeague(obj.team) == league);
        const chart_params = chart_param_builder(
          s,
          dates,
          duration,
          this.routeWidth,
          this.routeHeight
        );
        chart_params.canvas = this.shadowRoot.querySelector(
          `.chart-frame[data-league="${league}"]`
        );
        draw_chart(chart_params);
        chart_params.gSeries = this.shadowRoot.querySelector(
          `[data-league="${league}"] .series`
        );

        moveTo(s, chart_params, dates.duration);
        //this.shadowRoot.querySelector(`[data-league="${league}"]`).classList.add("hide");
      });

      this.frames = {};
      ["Central", "Pacific"].forEach((league) => {
        const frame = this.shadowRoot.querySelector(
          `[data-league="${league}"]`
        );
        this.frames[league] = frame;
      });
    } else if (name == "duration") {
      //console.log(`attr-change: ${name} ${newValue}`);
      const series = this.series;
      const { dates } = this.params;
      const duration = Number(newValue);

      ["Central", "Pacific"].forEach((league) => {
        const s = series.filter((obj) => nameToLeague(obj.team) == league);
        const chart_params = chart_param_builder(
          s,
          dates,
          duration,
          this.routeWidth,
          this.routeHeight
        );
        chart_params.canvas = this.shadowRoot.querySelector(
          `.chart-frame[data-league="${league}"]`
        );
        draw_chart(chart_params);
        chart_params.gSeries = this.shadowRoot.querySelector(
          `[data-league="${league}"] .series`
        );

        moveTo(s, chart_params, dates.duration);
        //this.shadowRoot.querySelector(`[data-league="${league}"]`).classList.add("hide");
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

  update_pathname(league, base = "/npb2022") {
    const newValue = `${base}/${league}/above500`;
    this.params.appFrame.setAttribute("pathname", newValue);
  }

  update_title(league) {
    const str = `${league} League Games above .500`;
    this.params.appFrame.setAttribute("title", str);
  }

  connectedCallback() {
    [this.routeHeight, this.routeWidth] = ["height", "width"].map((prop) => {
      const value = getComputedStyle(this).getPropertyValue(
        `--container-${prop}`
      );
      return Number(value.replace("px", ""));
    });
    this.render();
  }
}

export { NpbAbove500 };
