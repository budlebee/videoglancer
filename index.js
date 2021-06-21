const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  //https://www.youtube.com/watch?v=Lq3dvfw9nnk
  for (let i = 0; i < 3; i++) {
    await page.goto(
      `https://www.youtube.com/watch?v=o3ka5fYysBM&t=${5 + 60 * i}s`,
      {
        waitUntil: "networkidle2",
      }
    );
    await page.waitForSelector(".html5-main-video");
    const videoEle = await page.$(".html5-main-video");
    await page.evaluate((video) => {
      console.log(video.duration);
    }, videoEle);
    //console.log(video.duration);

    if (await page.$(".paused-mode")) {
      await page.keyboard.press("Space");
    }

    try {
      await page.waitForSelector(".ad-showing", { timeout: 500 });
      if (await page.$(".ad-showing")) {
        if (await page.$(".paused-mode")) {
          await page.keyboard.press("Space");
        }
        await page.waitForSelector(".ytp-ad-skip-button");
        const skipButton = await page.$(".ytp-ad-skip-button");
        await skipButton.click();
      }
    } catch (e) {}

    if (await page.$(".paused-mode")) {
      await page.keyboard.press("Space");
    }
    await page.waitForSelector(".playing-mode");
    await page.screenshot({ path: `results/${i}_${Date.now()}.png` });
    if (await page.$(".playing-mode")) {
      await page.keyboard.press("Space");
    }

    // 만약 이 요소가 있다면 분기처리 await page.waitForSelector(".ytp-ad-preview-container");
    // 이 요소가 있다면, ytp-ad-skip-button 요소가 나타날때까지 대기. 요소가 나타나면 요소 클릭.
    // 이 요소가 없다면, if 문을 빠져나감.

    // let image = await video.screenshot({ encoding: "base64" });
    // 매번 캡쳐해서 저장하지 말고, image 문에 넣어둔다음 한꺼번에 pdf 로 만들자.

    // video 가 재생될때까지 기다렸다가 캡쳐해야함.
    // video 가 .ad-showing 상태이면 재생 시작하고, 기다렸다가,
    // video 가 .paused-mode 이면 재생 시작.
  }

  //
  //const videos = await page.$$("ytd-thumbnail.ytd-video-renderer");
  //await videos[2].click();
  //await page.waitForSelector(".html5-video-container");
  //await page.waitFor(5000);

  // await page.pdf({ path: "results/hn.pdf", format: "a4" });

  await browser.close();
})();
