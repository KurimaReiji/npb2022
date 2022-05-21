/**
 * NPB 12 Teams Database for 2022 season.
 * @type {object[]} 
 * 
 * name Official Team Name in Japanese
 * name_en Official Team Name in English
 * league: Central or Pacific
 * since: date of foundation
 * alt[]: alternative names
 * alternatives index
 0: 2020-2022 S T G C D DB B M E H F L
 1: 2012-2022 ヤ 神 巨 広 中 デ オ ロ 楽 ソ 日 西
 2: Yakult Hanshin Yomiuri Hiroshima Chunichi DeNA ORIX Lotte Rakuten SoftBank Nippon-Ham Seibu
 3: ヤクルト 阪神 巨人 広島 中日 DeNA オリックス ロッテ 楽天 ソフトバンク 日本ハム 西武
 4: 東京ヤクルト 阪神 読売 広島東洋 中日 横浜DeNA オリックス 千葉ロッテ 東北楽天 福岡ソフトバンク 北海道日本ハム 埼玉西武
 5: スワローズ タイガース ジャイアンツ カープ ドラゴンズ ベイスターズ バファローズ マリーンズ イーグルス ホークス ファイターズ ライオンズ
 6: Swallows Tigers Giants Carp Dragons Baystars Buffaloes Marines Eagles Hawks Fighters Lions
 7: なんJ 燕 虎 兎 鯉 竜 星 檻 鴎 鷲 鷹 公 猫
 8: 2005-2011 ヤ 神 巨 広 中 横 オ ロ 楽 ソ 日 西
 9: 2005-2011 S T G C D YB Bs M E H F L
10: 2011-2019 S T G C D DB Bs M E H F L
11: 1974-2005 ヤクルトスワローズ
12: 1979-2007 西武ライオンズ
13: 1993-2011 横浜ベイスターズ
14: 1974-2005 Yakult Swallows
15: 1979-2007 Seibu Lions
16: 1993-2011 Yokohama BayStars
 */
const npbteams = [
  /** @type {object} Swallows */
  {
    /** @type {string} Official Team Name in Japanese */
    name: "東京ヤクルトスワローズ",
    name_en: "Tokyo Yakult Swallows",
    league: "Central",
    since: "1950-01-12",
    alt: [
      "S",
      "ヤ",
      "Yakult",
      "ヤクルト",
      "東京ヤクルト",
      "スワローズ",
      "Swallows",
      "燕",
      "ヤ",
      "S",
      "S",
      "ヤクルトスワローズ",
      "東京ヤクルトスワローズ",
      "東京ヤクルトスワローズ",
      "Yakult Swallows",
      "Tokyo Yakult Swallows",
      "Tokyo Yakult Swallows",
    ],
  },
  {
    name: "阪神タイガース",
    name_en: "Hanshin Tigers",
    league: "Central",
    since: "1935-12-10",
    alt: [
      "T",
      "神",
      "Hanshin",
      "阪神",
      "阪神",
      "タイガース",
      "Tigers",
      "虎",
      "神",
      "T",
      "T",
      "阪神タイガース",
      "阪神タイガース",
      "阪神タイガース",
      "Hanshin Tigers",
      "Hanshin Tigers",
      "Hanshin Tigers",
    ],
  },
  {
    name: "読売ジャイアンツ",
    name_en: "Yomiuri Giants",
    league: "Central",
    since: "1934-12-26",
    alt: [
      "G",
      "巨",
      "Yomiuri",
      "巨人",
      "読売",
      "ジャイアンツ",
      "Giants",
      "兎",
      "巨",
      "G",
      "G",
      "読売ジャイアンツ",
      "読売ジャイアンツ",
      "読売ジャイアンツ",
      "Yomiuri Giants",
      "Yomiuri Giants",
      "Yomiuri Giants",
    ],
  },
  {
    name: "広島東洋カープ",
    name_en: "Hiroshima Toyo Carp",
    league: "Central",
    since: "1949-12-05",
    alt: [
      "C",
      "広",
      "Hiroshima",
      "広島",
      "広島東洋",
      "カープ",
      "Carp",
      "鯉",
      "広",
      "C",
      "C",
      "広島東洋カープ",
      "広島東洋カープ",
      "広島東洋カープ",
      "Hiroshima Toyo Carp",
      "Hiroshima Toyo Carp",
      "Hiroshima Toyo Carp",
    ],
  },
  {
    name: "中日ドラゴンズ",
    name_en: "Chunichi Dragons",
    league: "Central",
    since: "1936-01-15",
    alt: [
      "D",
      "中",
      "Chunichi",
      "中日",
      "中日",
      "ドラゴンズ",
      "Dragons",
      "竜",
      "中",
      "D",
      "D",
      "中日ドラゴンズ",
      "中日ドラゴンズ",
      "中日ドラゴンズ",
      "Chunichi Dragons",
      "Chunichi Dragons",
      "Chunichi Dragons",
    ],
  },
  {
    name: "横浜DeNAベイスターズ",
    name_en: "YOKOHAMA DeNA BAYSTARS",
    league: "Central",
    since: "1949-12-15",
    alt: [
      "DB",
      "デ",
      "DeNA",
      "DeNA",
      "横浜DeNA",
      "ベイスターズ",
      "Baystars",
      "星",
      "横",
      "YB",
      "DB",
      "横浜ベイスターズ",
      "横浜ベイスターズ",
      "横浜ベイスターズ",
      "Yokohama BayStars",
      "Yokohama BayStars",
      "Yokohama BayStars",
    ],
  },
  {
    name: "オリックス・バファローズ",
    name_en: "ORIX Buffaloes",
    league: "Pacific",
    since: "1936-01-23",
    alt: [
      "B",
      "オ",
      "ORIX",
      "オリックス",
      "オリックス",
      "バファローズ",
      "Buffaloes",
      "檻",
      "オ",
      "Bs",
      "Bs",
      "オリックス・バファローズ",
      "オリックス・バファローズ",
      "オリックス・バファローズ",
      "ORIX Buffaloes",
      "ORIX Buffaloes",
      "ORIX Buffaloes",
    ],
  },
  {
    name: "千葉ロッテマリーンズ",
    name_en: "Chiba Lotte Marines",
    league: "Pacific",
    since: "1949-11-26",
    alt: [
      "M",
      "ロ",
      "Lotte",
      "ロッテ",
      "千葉ロッテ",
      "マリーンズ",
      "Marines",
      "鴎",
      "ロ",
      "M",
      "M",
      "千葉ロッテマリーンズ",
      "千葉ロッテマリーンズ",
      "千葉ロッテマリーンズ",
      "Chiba Lotte Marines",
      "Chiba Lotte Marines",
      "Chiba Lotte Marines",
    ],
  },
  {
    name: "東北楽天ゴールデンイーグルス",
    name_en: "Tohoku Rakuten Golden Eagles",
    league: "Pacific",
    since: "2004-11-02",
    alt: [
      "E",
      "楽",
      "Rakuten",
      "楽天",
      "東北楽天",
      "イーグルス",
      "Eagles",
      "鷲",
      "楽",
      "E",
      "E",
      "東北楽天ゴールデンイーグルス",
      "東北楽天ゴールデンイーグルス",
      "東北楽天ゴールデンイーグルス",
      "Tohoku Rakuten Golden Eagles",
      "Tohoku Rakuten Golden Eagles",
      "Tohoku Rakuten Golden Eagles",
    ],
  },
  {
    name: "福岡ソフトバンクホークス",
    name_en: "Fukuoka SoftBank Hawks",
    league: "Pacific",
    since: "1938-02-22",
    alt: [
      "H",
      "ソ",
      "SoftBank",
      "ソフトバンク",
      "福岡ソフトバンク",
      "ホークス",
      "Hawks",
      "鷹",
      "ソ",
      "H",
      "H",
      "福岡ソフトバンクホークス",
      "福岡ソフトバンクホークス",
      "福岡ソフトバンクホークス",
      "Fukuoka SoftBank Hawks",
      "Fukuoka SoftBank Hawks",
      "Fukuoka SoftBank Hawks",
    ],
  },
  {
    name: "北海道日本ハムファイターズ",
    name_en: "Hokkaido Nippon-Ham Fighters",
    league: "Pacific",
    since: "1945-11-06",
    alt: [
      "F",
      "日",
      "Nippon-Ham",
      "日本ハム",
      "北海道日本ハム",
      "ファイターズ",
      "Fighters",
      "公",
      "日",
      "F",
      "F",
      "北海道日本ハムファイターズ",
      "北海道日本ハムファイターズ",
      "北海道日本ハムファイターズ",
      "Hokkaido Nippon-Ham Fighters",
      "Hokkaido Nippon-Ham Fighters",
      "Hokkaido Nippon-Ham Fighters",
    ],
  },
  {
    name: "埼玉西武ライオンズ",
    name_en: "Saitama Seibu Lions",
    league: "Pacific",
    since: "1949-11-26",
    alt: [
      "L",
      "西",
      "Seibu",
      "西武",
      "埼玉西武",
      "ライオンズ",
      "Lions",
      "猫",
      "西",
      "L",
      "L",
      "西武ライオンズ",
      "西武ライオンズ",
      "埼玉西武ライオンズ",
      "Seibu Lions",
      "Seibu Lions",
      "Saitama Seibu Lions",
    ],
  },
];

const find_team_fromdb = (teamsdb = npbteams) => {
  return (name) =>
    teamsdb.find((obj) => [obj.name, obj.name_en, ...obj.alt].includes(name));
};

const find_team = find_team_fromdb(npbteams);

/**
 * returns team initials. e.g. D, DB, S, B, L, ...
 * "Bs" for years before 2020.
 * "YB" for years before 2012.
 * @param {string} name
 * @param {string} [year="2022"]
 * @returns {string}
 */
const nameToInitial = (name, year = "2022") => {
  const y = Number(year);
  let idx = 0;
  if (y <= 2019) idx = 10;
  if (y <= 2011 && y > 2004) idx = 9;
  return find_team(name).alt[idx];
};

/**
 * @param {string} name
 * @returns {string} nickname of the team in Japanese. e.g. ドラゴンズ、ライオンズ
 */
const nameToNickname_ja = (name) => {
  return find_team(name).alt[5];
};

/**
 * @param {string} name
 * @returns {string} nickname of the team. e.g. Dragons, Lions
 */
const nameToNickname_en = (name) => {
  return find_team(name).alt[6];
};

/**
 * returns nickname of the team. e.g. Dragons, Lions
 */
const nameToNickname = nameToNickname_en;

/**
 * returns the name of the league which the team belongs.
 * @param {string} name
 * @returns {string} "Central" or "Pacific",
 */
const nameToLeague = (name) => {
  return find_team(name).league;
};

export {
  npbteams,
  find_team,
  nameToInitial,
  nameToNickname,
  nameToNickname_ja,
  nameToNickname_en,
  nameToLeague,
};
