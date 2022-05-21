import {
  createSVG,
  createCircle,
  createGroup,
  createPath,
  createText,
  createTextbox,
  createBackgroundRect,
  createScale,
  svgdownload,
  svgRectFitToText,
  createTics,
  createAxis,
  trunc,
} from "./svg-utils.js";

import {
  npbteams,
  nameToNickname,
  nameToLeague,
  daysFromOpeningDay,
  team_selector,
  games_tied,
  opponent,
  teams_by_wpct,
  createGameResult,
} from "./npb2022.js";

const moveTo = (series, params, n) => {
  const { league, xShift } = params;
  const { xScale, yScale, dx } = params.scales;
  const gSeries = document.querySelector(`[data-league="${league}"] .series`);
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
      .slice(xShift - 1, n)
      .map((w) => {
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
      .forEach((c) => g.append(c));

    const labelText = createText({
      text: `${team} (${s.win}-${s.loss})`,
      attr: Object.assign({}, params.label, {
        x: xScale(n) + dx * 1.0,
        y: yScale(s.above.final),
      }),
      dataset: { y: s.above.final },
      cls: ["label"],
    });
    g.append(labelText);
    gSeries.append(g);
  });
  const targetLabels = series.map((s) =>
    document.querySelector(`#${s.team} .label`)
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

const main_handler = (params) => {
  const { xRange, yRange, tics, axis, title, scales, league } = params;
  const canvas = document.querySelector(
    `.chart-frame[data-league="${league}"]`
  );
  const fragment = document.createDocumentFragment();

  const svg = createSVG(xRange, yRange);

  const bgRect = createBackgroundRect(xRange, yRange);
  const gTics = createTics(tics, scales);
  const gAxis = createAxis(axis, scales);
  const gSeries = createGroup({ cls: ["series"] });
  const gTitle = createTextbox(title);

  fragment.append(bgRect, gTics, gAxis, gSeries, gTitle);
  svg.append(fragment);
  canvas.replaceChildren(svg);

  [...document.querySelectorAll(".textbox")].forEach(svgRectFitToText);
};

const get_wlt = (team) => (g) => {
  if (g) return g.winner == team ? 1 : g.loser == team ? -1 : 0;
  return 0;
};

const chart_param_builder = (series, dates, duration) => {
  const yMax = Math.max(...series.map((s) => s.above.max));
  const yMin = Math.min(...series.map((s) => s.above.min));

  const xShift = dates.duration - duration;

  const xAxis = [xShift, dates.duration + 0.5];
  const yAxis = [yMin - 2, yMax + 2].map((n) =>
    n % 5 == 0 ? n + Math.sign(n) : n
  );
  const xDomain = xAxis;
  const yDomain = [...yAxis].reverse();
  const [xRange, yRange] = [
    [0, 1152],
    [0, 648],
  ];
  const [width, height] = [xRange[1] - xRange[0], yRange[1] - yRange[0]];
  const padding = {
    top: trunc(height * 0.08),
    right: trunc(width * 0.14),
    bottom: trunc(height * 0.05),
    left: trunc(width * 0.03),
  };

  const xScale = createScale(xDomain, xRange, padding.left, padding.right);
  const yScale = createScale(yDomain, yRange, padding.top, padding.bottom);
  const dx = trunc(xScale(1) - xScale(0));
  const dy = trunc(yScale(1) - yScale(0));
  const scales = { xScale, yScale, dx, dy };

  const axis = {
    pathStyle: { "stroke-width": 3 },
    lines: [
      [
        [xAxis[0], 0],
        [xAxis[1], 0],
      ],
      [
        [xShift, yAxis[0]],
        [xShift, yAxis[1]],
      ],
    ],
  };

  const xTics = [
    { pos: daysFromOpeningDay(`2022-04-01`, dates.start), text: "Apr 1" },
    { pos: daysFromOpeningDay(`2022-04-15`, dates.start), text: "Apr 15" },
    { pos: daysFromOpeningDay(`2022-05-01`, dates.start), text: "May 1" },
    { pos: daysFromOpeningDay(`2022-05-15`, dates.start), text: "May 15" },
    { pos: daysFromOpeningDay(`2022-06-01`, dates.start), text: "Jun 1" },
    { pos: daysFromOpeningDay(`2022-06-15`, dates.start), text: "Jun 15" },
    { pos: daysFromOpeningDay(`2022-07-01`, dates.start), text: "Jul 1" },
    { pos: daysFromOpeningDay(`2022-07-15`, dates.start), text: "Jul 15" },
    { pos: daysFromOpeningDay(`2022-08-01`, dates.start), text: "Aug 1" },
    { pos: daysFromOpeningDay(`2022-08-15`, dates.start), text: "Aug 15" },
    { pos: daysFromOpeningDay(`2022-09-01`, dates.start), text: "Sep 1" },
    { pos: daysFromOpeningDay(`2022-09-15`, dates.start), text: "Sep 15" },
    { pos: daysFromOpeningDay(`2022-10-01`, dates.start), text: "Oct 1" },
  ].filter((obj) => obj.pos < xAxis[1] && obj.pos > xAxis[0]);
  const yTics = [...new Array(30)]
    .map((n, i) => i * 5 - 60)
    .filter((n) => n < yAxis[1] && n > yAxis[0]);
  const tics = {
    xAxis,
    yAxis,
    xTics,
    yTics,
    xTicsPos: -0.25 + xShift,
    yTicsPos: yAxis[0] - 1,
    pathStyle: {
      "stroke-width": 2,
    },
    labelStyle: {
      "font-size": 12,
      "alignment-baseline": "middle",
    },
  };

  const league = nameToLeague(series[0].team);
  const title = {
    text: `Games above .500, 2022 ${league} League`,
    attr: {
      x: (xRange[1] - xRange[0]) * 0.5,
      y: (yRange[1] - yRange[0]) * 0.05,
      "font-size": 24,
      "text-anchor": "middle",
      "alignment-baseline": "middle",
    },
    cls: ["title"],
  };

  const path = {
    fill: "none",
    "stroke-width": 8,
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
  };
  const dot = {
    r: 8,
  };
  const label = {
    "font-size": 18,
    "alignment-baseline": "middle",
  };

  const params = {
    xRange,
    yRange,
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

document.addEventListener("DOMContentLoaded", async () => {
  const year = "2022";
  const jsonfile = `./games${year}.json`;

  const inputs = await (await fetch(jsonfile)).json();
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

  const duration = 40;

  [...document.querySelectorAll(`.chart-frame`)].forEach((el) => {
    el.dataset.days = dates.duration;
  });

  ["Central", "Pacific"].forEach((league) => {
    const s = series.filter((obj) => nameToLeague(obj.team) == league);
    const params = chart_param_builder(s, dates, duration);
    main_handler(params);
    moveTo(s, params, dates.duration);
  });
});
