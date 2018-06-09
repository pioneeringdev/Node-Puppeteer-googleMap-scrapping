const puppeteer = require("puppeteer");
(() => {
  const REVIEW_BUTTON_CLASS = "button.section-reviewchart-numreviews";
  const LEFT_SIDE_BAR = ".widget-pane-content scrollable-y";
  const REVIEW_TITLE = ".section-review-title";
  const REVIEW_SUBTITLE = ".section-review-subtitle";
  const SITE_LINK =
    "https://www.google.com/maps/place/T.C.R.+Rooter+and+Plumbing+Repair/@35.2032875,-111.6229485,17z/data=!3m1!4b1!4m5!3m4!1s0x872d86303b8fb69d:0x10a7f62740d8aa7e!8m2!3d35.2032875!4d-111.6207598";

  const extractTotalReviewCount = () => {
    const reviewButton = document.querySelector(
      "div.section-reviewchart-numreviews"
    );
    const countReviews = +reviewButton.firstChild.nodeValue.split(" ")[0];
    return countReviews;
  };

  const extractReviewCount = () => {
    return document.querySelectorAll(".section-review-content").length;
  };

  const getPrevioutHeight = () => {
    return document.querySelector(
      ".section-listbox.section-scrollbox.scrollable-y.scrollable-show"
    ).scrollHeight;
  };

  const scrapInfiniteScrollItems = async (page, scrollDelay = 100) => {
    let totalReviewCount = await page.evaluate(extractTotalReviewCount);
    let _reviewCount = await page.evaluate(extractReviewCount);

    while (totalReviewCount > _reviewCount) {
      const previoustHeight = await page.evaluate(getPrevioutHeight);
      await page.evaluate(() => {
        let leftSideBar = document.querySelector(
          ".section-listbox.section-scrollbox.scrollable-y.scrollable-show"
        );
        leftSideBar.scrollTo(0, leftSideBar.scrollHeight);
      });
      await page.waitForFunction(
        `document.querySelector('.section-listbox.section-scrollbox.scrollable-y.scrollable-show').scrollHeight>${previoustHeight}`
      );
      await page.waitFor(scrollDelay);
      _reviewCount = await page.evaluate(extractReviewCount);
    }
  };

  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(SITE_LINK);
    await page.waitForSelector(REVIEW_BUTTON_CLASS);
    await page.click(REVIEW_BUTTON_CLASS);
    await page.waitForSelector(REVIEW_TITLE);
    await scrapInfiniteScrollItems(page, 100);
    const titles = await page.evaluate(() => {
      const reviews = document.querySelectorAll(".section-review-content");
      let titles = [];
      reviews.forEach(review => {
        titles.push({
          title: review.querySelector(".section-review-title").textContent,
          subtitle: review.querySelector(".section-review-subtitle")
            .textContent,
          review: review.querySelector(".section-review-text").textContent
        });
      });
      return titles;
    });
    console.log(titles);
    await browser.close();
  })();
})();
