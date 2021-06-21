const puppeteer = require("puppeteer");

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 1시간 30분짜리 영상
    await page.goto(`https://www.youtube.com/watch?v=o3ka5fYysBM&t=5s`, {
      waitUntil: "networkidle2",
    });

    // 34분짜리 영상
    //await page.goto(`https://www.youtube.com/watch?v=OrxmtDw4pVI&t=5s`, {
    //  waitUntil: "networkidle2",
    //});

    // 1분 미만 영상
    //await page.goto(`https://www.youtube.com/watch?v=lg2zZRLQU1A&t=${5}s`, {
    //  waitUntil: "networkidle2",
    //});

    // 즉석 테스트
    //await page.goto(`https://www.youtube.com/watch?v=I8M3GjGxRNA&t=5s`, {
    //  waitUntil: "networkidle2",
    //});

    // get video component
    await page.waitForSelector(".html5-main-video");
    const videoEle = await page.$(".html5-main-video");

    if ((await page.$(".paused-mode")) !== null) {
      await page.keyboard.press("k");
    }

    // get video length
    const timeEle = await page.$(".ytp-bound-time-right");
    const lenText = await timeEle.evaluate((ele) => {
      return ele.innerHTML;
    }, timeEle);
    const lenArray = lenText.split(":");
    let videoLength;
    if (lenArray[0] === "0") {
      console.log("too short!");
      console.log(lenArray);
    } else if (lenArray.length == 2) {
      console.log("under 1 hour video");
      videoLength = lenArray[0];
    } else if (lenArray.length == 3) {
      console.log("over 1 hour video");
      videoLength = parseInt(lenArray[0], 10) * 60 + parseInt(lenArray[1], 10);
    } else {
      console.log("exeptional case");
    }

    // caption on
    const captionBtn = await page.$(".ytp-subtitles-button");
    const captionOn = await page.evaluate(
      (el) => el.getAttribute("aria-pressed"),
      captionBtn
    );
    if (captionOn == "false") {
      await captionBtn.click();
    }

    // full screep 버튼이 안눌린다..왜지.
    //const fullscreenBtn = await page.$(".ytp-fullscreen-button");
    //
    //await fullscreenBtn.click();

    // start screenshot
    for (let i = 0; i < videoLength; i++) {
      await page.waitForSelector(".buffering-mode", { hidden: true });

      try {
        await page.waitForFunction(
          `document.querySelector('.ytp-spinner') && document.querySelector('.ytp-spinner').style.display=='none'`
        );
      } catch (e) {
        console.log("스피너 대기하는곳에서 에러발생");
      }

      // ad skip
      try {
        while ((await page.$(".ad-showing")) !== null) {
          await page.waitForSelector(".buffering-mode", { hidden: true });
          if ((await page.$(".paused-mode")) !== null) {
            await page.keyboard.press("k");
          }
          await page.waitForTimeout(6000);
          //await page.waitForSelector(".ytp-ad-skip-button");
          if ((await page.$(".ytp-ad-skip-button")) !== null) {
            const skipButton = await page.$(".ytp-ad-skip-button");
            await skipButton.click();
          }
        }
      } catch (e) {
        console.log("광고 스킵하는 부분에서 에러발생");
      }

      await page.waitForSelector(".buffering-mode", { hidden: true });

      // close overlay ad
      try {
        if ((await page.$(".ytp-ad-overlay-close-button")) !== null) {
          const adCloseBtns = await page.$$(".ytp-ad-overlay-close-button");
          await adCloseBtns[adCloseBtns.length - 1].click();
        }
      } catch (e) {
        console.log("오버레이 광고 끄는 부분에서 에러 발생");
      }

      try {
        if ((await page.$(".paused-mode")) !== null) {
          await page.keyboard.press("k");
        }
      } catch (e) {
        console.log("플레잉 모드인거 재생멈춤 하는데서 에러발생");
      }

      // take screenshot
      await videoEle.screenshot({
        path: `results/${i}_${Date.now()}.jpeg`,
        type: "jpeg",
      });

      // move to next time
      await page.keyboard.press("l");
      await page.keyboard.press("l");
      await page.keyboard.press("l");
      await page.keyboard.press("l");
      await page.keyboard.press("l");
      await page.keyboard.press("l");
      await page.waitForTimeout(200);
      await page.waitForSelector(".buffering-mode", { hidden: true });
      try {
        await page.waitForFunction(
          `document.querySelector('.ytp-spinner') && document.querySelector('.ytp-spinner').style.display=='none'`
        );
      } catch (e) {
        console.log("맨 마지막 스피너 기다리는데서 에러발생");
      }
    }

    // all done. close browser.
    await browser.close();
  } catch (e) {
    console.log(e);
  }

  // lenText 를 : 기준으로 자르고, 원소 갯수가 2,3이냐에 따라 분기처리.
  // 만약 원소갯수가 2개다-> 1시간 아래의 영상임. 이때 첫번째 원소를 숫자로 바꾼게 1보다 작으면 너무 짧다고 반려.
  // 그외의 경우엔 처리.
  /*
  for (let i = 0; i < 3; i++) {
    // 영상 맨 마지막 부분 -1초로 클릭해서 넘어간다.

    // 영상이 멈췄으면 다시 재생
    // ytp-bound-time-right 속성의 innerHTML 이 재생시간임.
    // 맨끝 다음자리, 즉 분에 해당하는것 정수값만 가져옴. 34:45 면 34만 가져옴.
    // i<34-1 . 마지막 1분 빼고 간격으로 스샷 찰칵찰칵.
    // 오른쪽 클릭하면 5초씩 넘어가네? 12번 클릭하면 1분이네?
    // j 와 l 누르면 10초씩 넘어간다.
    // space 대신 k 버튼으로 영상 재생.
    // 영상 시작 5초 부터 보기 시작해서
    // 오버레이 광고 뜨면 그거 클로즈해주고. .ytp-ad-overlay-close-button 임.
    // 자막 키는건 .ytp-subtitles-button 요거 클릭해주면 된다.

    
//영상 첫 5초 부분으로 이동. 
//영상 전체 길이 가져옴. 시간+분 가져와서 정수로 변환.
//영상이 재생중이면 재생 중지.
//자막을 킨다.
//
//for 문 돌아가기 시작함.
//오버레이 광고가 떠있다면 닫는다.
//스크린샷 캡쳐.
//l 버튼 6번 눌러서 넘어감.
//
//끝!


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
*/
  //
  //const videos = await page.$$("ytd-thumbnail.ytd-video-renderer");
  //await videos[2].click();
  //await page.waitForSelector(".html5-video-container");
  //await page.waitFor(5000);

  // await page.pdf({ path: "results/hn.pdf", format: "a4" });
})();
