import { writeFileSync } from "fs";
import puppeteer from "puppeteer";

const scraper = () => {
  const games = [...document.querySelectorAll(".live, .pregame")]
    .map((g) => {
      const url = g.querySelector(`a[href^="/score"]`).href;
      const score = g.querySelector(".score")
        ? g.querySelector(".score").textContent
        : "";
      const [home, road] = [
        ...g.querySelectorAll(
          ".team_left2 img, .team_right2 img, .team_left img, .team_right img"
        ),
      ].map((el) => el.getAttribute("title"));
      const [place, status] = g
        .querySelector(".info")
        .textContent.trim()
        .match(/（(.*)）([\s\S]*)/)
        .slice(1, 3)
        .map((s) => s.trim().replace("　", ""));
      return {
        url,
        home,
        road,
        score,
        place,
        status,
      };
    })
    .filter((obj) => obj.status !== "中止");

  const date = document.querySelector(`#games_wrapper h4 a[href^="/games/"]`)?.textContent.match(/\d+月\d+日（.）/)[0];
  return {
    date,
    games,
  };
};

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1200,
      height: 1100,
    },
    headless: true,
  });

  const page = await browser.newPage();

  const targetURL = `https://npb.jp/`;
  await page.goto(targetURL);
  await page.waitForSelector(".info");
  const data = await page.evaluate(scraper);

  await browser.close();

  const output = JSON.stringify(data, null, 2);
  console.log(output);

  const scheduled = data.games.length;
  const finished = data.games.filter((obj) => obj.status == "試合終了").length;
  if (scheduled == finished) {
    const date = data.date
      .match(/(\d+)月(\d+)日/)
      .slice(1, 4)
      .map((i) => `0${i}`.slice(-2))
      .reduce((a, c) => `${a}-${c}`, "2022");
    const outfile = `./npb-${date}.json`;
    writeFileSync(outfile, output, "utf8");
  }
})();
