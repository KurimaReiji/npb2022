import { nameToNickname, nameToLeague } from "npb2022-teams";

/**
 * return nth day of the season. i.e. the opening day is Day 1.
 * @param {string} date
 * @param {string} openingDay
 * @returns {number}
 */
const daysFromOpeningDay = (date, openingDay = "2022-03-25") => {
  const onedaylong = 24 * 60 * 60 * 1000;
  return 1 + (new Date(date) - new Date(openingDay)) / onedaylong;
};

/*
  2005-2015  "https://npb.jp/bis/2015/games/s2015032700147.html"
  2016-2022  "https://npb.jp/scores/2018/0330/g-t-01/"
*/
const dateFromUrl = (url) => {
  return url
    .match(/(20\d\d)\/?(\d\d)(\d\d)/)
    .slice(1)
    .join("-");
};

/**
 * returns truncated winning percentage. e.g. 0.333, 0.5, 0.667
 * @param {number} win
 * @param {number} loss
 * @returns {number}
 */
const winpct = (win, loss) => {
  const val = (1000 * win) / (win + loss);
  return Math.trunc(Math.round(val)) / 1000;
};

/**
 * compare function to sort by winning percentage
 * @param {object} a
 * @param {object} b
 * @returns
 */
const teams_by_wpct = (a, b) => {
  const [aWpct, bWpct] = [a, b].map((obj) => obj.win / (obj.win + obj.loss));
  if (aWpct > bWpct) return -1;
  if (aWpct < bWpct) return 1;
  if (a.win > b.win) return -1;
  if (a.win < b.win) return 1;
  return 0;
};

/**
 * add winner, loser, and date
 * @param {Object} obj
 * @returns {Object}
 */
const createGameResult = (obj) => {
  const date = dateFromUrl(obj.url);
  const score = obj.score.split("-").map((s) => Number(s));
  const home = { team: nameToNickname(obj.home), score: score[0] };
  const road = { team: nameToNickname(obj.road), score: score[1] };
  const sign = Math.sign(score[0] - score[1]);
  const winner = [road.team, "Tied", home.team][sign + 1];
  const loser = [home.team, "Tied", road.team][sign + 1];
  return Object.assign({}, obj, {
    date,
    home,
    road,
    winner,
    loser,
  });
};

/**
 * calculate games behind from the leader
 * @param {number} win
 * @param {number} loss
 * @param {number} leaderWin
 * @param {number} leaderLoss
 * @returns {number}
 */
const games_behind = (win, loss, leaderWin, leaderLoss) => {
  //ゲーム差 = {(上位チームの勝数 - 下位チームの勝数) + (下位チームの敗数 - 上位チームの敗数)} ÷ 2
  if (win == leaderWin && loss == leaderLoss) return "";
  return ((leaderWin - win + (loss - leaderLoss)) * 0.5).toFixed(1);
};

/**
 * reducer to uniq
 * @param {*} acc
 * @param {*} cur
 * @param {*} idx
 * @param {*} ary
 * @returns
 */
const to_uniq = (acc, cur, idx, ary) => {
  if (idx == ary.length - 1) acc = [...new Set(ary)];
  return acc;
};

/**
 * reducer to calc total numbers
 * @param {*} acc
 * @param {*} cur
 * @returns
 */
const sum = (acc, cur) => acc + cur;

/**
 * head to head records of the team.
 * @param {string} team
 * @returns {object}
 */
const headToHead = (team) => (games) => {
  const opponents = games.map((game) => opponent(team)(game)).reduce(to_uniq);
  const interleagueGames = games.filter((game) => isInterLeague(team)(game));
  const data = opponents
    .map((opp) => {
      const vsGames = games.filter((g) => opponent(team)(g) == opp);
      return {
        opponent: opp,
        win: vsGames.filter((g) => g.winner == team).length,
        loss: vsGames.filter((g) => g.loser == team).length,
        tied: vsGames.filter(games_tied).length,
      };
    })
    .concat([
      {
        opponent: "Int",
        win: interleagueGames.filter((g) => g.winner == team).length,
        loss: interleagueGames.filter((g) => g.loser == team).length,
        tied: interleagueGames.filter(games_tied).length,
      },
    ]);

  return data;
};

/**
 * filter function to select the interleague games.
 * @param {string} team
 * @returns {boolean}
 */
const isInterLeague = (team) => (game) => {
  return nameToLeague(team) !== nameToLeague(opponent(team)(game));
};

/**
 * returns the opponent team of the team in the game.
 * @param {string} team
 * @returns {string} team
 */
const opponent = (team) => (g) => {
  if (g) return team == g.home.team ? g.road.team : g.home.team;
  return "off";
};

/**
 * filter games which team played.
 * @param {string} team
 * @returns {boolean}
 */
const team_selector = (team) => (game) =>
  [game.home, game.road].map((t) => t.team).includes(team);

/**
 * filter function to select tie games.
 * @param {object} game
 * @returns {boolean}
 */
const games_tied = (game) => game.home.score == game.road.score;

/**
 * filter function to select games decided by one run.
 * @param {object} game
 * @returns {boolean}
 */
const games_decided_by_one_run = (game) =>
  Math.abs(game.home.score - game.road.score) == 1;

/**
 * filter function to select games at home.
 * @param {string} team
 * @returns {boolean}
 */
const games_at_home = (team) => (game) => game.home.team == team;

/**
 * filter function to select games on road.
 * @param {string} team
 * @returns {boolean}
 */
const games_on_road = (team) => (game) => game.road.team == team;

/**
 * RS (runs scored) of the game by the team
 * @param {string} team
 * @returns {number}
 */
const runsScored = (team) => (game) => {
  return team == game.home.team ? game.home.score : game.road.score;
};

/**
 * RA (runs Allowed) of the game by the team
 * @param {string} team
 * @returns {number}
 */
const runsAllowed = (team) => (game) => {
  return team == game.home.team ? game.road.score : game.home.score;
};

/**
 * win-loss record plus RS, RA, RS-RA, and more.
 * @param {string} team
 * @returns {object}
 */
const get_records = (team) => (games) => {
  const oneRunGames = games.filter(games_decided_by_one_run);
  const rs = games.map((g) => runsScored(team)(g)).reduce(sum, 0);
  const ra = games.map((g) => runsAllowed(team)(g)).reduce(sum, 0);
  const res = {
    win: games.filter((g) => g.winner == team).length,
    loss: games.filter((g) => g.loser == team).length,
    tied: games.filter(games_tied).length,
    rs,
    ra,
    rdiff: rs - ra,
    oneRun: {
      win: oneRunGames.filter((g) => g.winner == team).length,
      loss: oneRunGames.filter((g) => g.loser == team).length,
    },
    shutout: {
      pitching: games.filter((g) => runsAllowed(team)(g) == 0).length,
      batting: games.filter((g) => runsScored(team)(g) == 0).length,
    },
    tenPlusRun: {
      scored: games.filter((g) => runsScored(team)(g) > 9).length,
      allowed: games.filter((g) => runsAllowed(team)(g) > 9).length,
    },
    headToHead: headToHead(team)(games),
  };
  res.winpct = winpct(res.win, res.loss);
  return res;
};

const createElement = (tagName) => {
  return ({ text = "", attr = {}, dataset = {}, cls = [] }) => {
    const elm = document.createElement(tagName);
    elm.textContent = text;
    Object.keys(dataset).forEach((key) => {
      elm.dataset[key] = dataset[key];
    });
    Object.keys(attr).forEach((name) => {
      elm.setAttribute(name, attr[name]);
    });
    cls.forEach((name) => {
      elm.classList.add(name);
    });
    return elm;
  };
};

export {
  daysFromOpeningDay,
  dateFromUrl,
  winpct,
  teams_by_wpct,
  createGameResult,
  games_behind,
  isInterLeague,
  opponent,
  sum,
  to_uniq,
  team_selector,
  games_tied,
  games_decided_by_one_run,
  games_at_home,
  games_on_road,
  runsScored,
  runsAllowed,
  headToHead,
  get_records,
  createElement,
};
