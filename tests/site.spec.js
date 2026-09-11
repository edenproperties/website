const { test, expect } = require("@playwright/test");

test("background motion can be paused and respects accessibility preferences", async ({
  page,
}) => {
  await page.goto("/");
  const video = page.locator("#hero-video");
  const toggle = page.locator("#motion-toggle");
  await expect(toggle).toBeVisible();
  await expect.poll(() => video.evaluate((v) => !v.paused)).toBe(true);
  await toggle.click();
  await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect.poll(() => video.evaluate((v) => !v.paused)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
  await expect(toggle).toBeHidden();
  await page.reload();
  await expect(video).not.toHaveAttribute("src", /mp4/);
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  await expect(page.locator("#header")).toHaveClass(/is-scrolled/);
  await expect(page.locator(".about .display")).toHaveCSS("opacity", "1");
});

test("hero brand and copy stay inside the viewport", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const selector of [
      ".hero-eden",
      ".hero-properties",
      ".hero-copy",
      ".header-contact",
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box.x, `${width}: ${selector}`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${width}: ${selector}`).toBeLessThanOrEqual(
        width,
      );
    }
  }
});

test("page remains usable without JavaScript", async ({ browser, viewport }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport });
  const page = await context.newPage();
  expect(page.viewportSize()).toEqual(viewport);
  await page.goto(process.env.SITE_URL || "http://127.0.0.1:4173/");
  await expect(page.locator('[data-slide="1"]')).toBeVisible();
  await expect(page.locator('[data-slide="2"]')).toBeVisible();
  await expect(page.locator('[data-slide="2"]')).not.toHaveAttribute(
    "inert",
    "",
  );
  await expect(page.locator(".story-controls")).toBeHidden();
  await page.locator("details").first().locator("summary").click();
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
  await context.close();
});

test("assets load cleanly and contact navigation works", async ({ page }) => {
  const errors = [];
  const remoteRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()}: ${response.url()}`);
  });
  page.on("request", (request) => {
    if (
      new URL(request.url()).origin !==
      new URL(process.env.SITE_URL || "http://127.0.0.1:4173").origin
    )
      remoteRequests.push(request.url());
  });
  await page.goto("/");
  await page.locator("img").evaluateAll((images) =>
    images.forEach((image) => {
      image.loading = "eager";
    }),
  );
  await page.evaluate(() =>
    Promise.all([...document.images].map((image) => image.decode())),
  );
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".header-contact").click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator(".contact .button")).toHaveAttribute(
    "href",
    /^mailto:edenproperties\.tn@gmail\.com\?subject=/,
  );
  const summary = page.locator("details").first().locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
  expect(errors).toEqual([]);
  expect(remoteRequests).toEqual([]);
});

test("transition photographs blend without overlapping captions", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const story = document.getElementById("scroll-story");
    window.scrollTo({
      top:
        story.getBoundingClientRect().top +
        scrollY +
        (story.offsetHeight - story.querySelector(".story-stage").offsetHeight) * 0.45,
      behavior: "instant",
    });
  });
  await expect(page.locator('[data-slide="1"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-slide="0"] .story-content')).toBeHidden();
  await expect(page.locator('[data-slide="1"] .story-content')).toBeVisible();
  const opacity = await page
    .locator('[data-slide="1"]')
    .evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
});

test("landscape collection CTAs and navigation fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  for (const index of [1, 2, 0]) {
    await page.evaluate(() => {
      const story = document.getElementById("scroll-story");
      const stage = story.querySelector(".story-stage");
      window.scrollTo({
        top: story.offsetTop + (story.offsetHeight - stage.offsetHeight) / 2,
        behavior: "instant",
      });
    });
    await expect(page.locator('[data-slide="1"]')).toHaveClass(/is-active/);
    for (const control of await page.locator("[data-story]").all()) {
      const box = await control.boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(390);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(844);
      await control.click({ trial: true });
    }
    await page.locator(`[data-story="${index}"]`).click();
    await expect(page.locator(`[data-slide="${index}"]`)).toHaveClass(/is-active/);
    await expect.poll(() => page.evaluate((index) => {
      const story = document.getElementById("scroll-story");
      const stage = story.querySelector(".story-stage");
      const target = story.offsetTop + (story.offsetHeight - stage.offsetHeight) * index / 2;
      return Math.abs(scrollY - target);
    }, index)).toBeLessThanOrEqual(1);
    const cta = page.locator(`[data-slide="${index}"] .button`);
    const box = await cta.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(390);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(844);
    await cta.click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator("#contact")).toBeInViewport();
  }
});

test("collection scroll travel uses the rendered stage height", async ({ page }) => {
  await page.goto("/");
  // A small viewport unit can differ from innerHeight with browser chrome.
  await page.addStyleTag({ content: ".story-stage { height: 75svh; min-height: 0; }" });
  await page.evaluate(() => {
    const story = document.getElementById("scroll-story");
    const stage = story.querySelector(".story-stage");
    window.scrollTo({
      top: story.offsetTop + (story.offsetHeight - stage.offsetHeight) * 0.45,
      behavior: "instant",
    });
  });
  await expect(page.locator('[data-slide="1"]')).toHaveClass(/is-active/);
  const opacity = await page.locator('[data-slide="1"]').evaluate(
    (slide) => Number(getComputedStyle(slide).opacity),
  );
  expect.soft(opacity).toBeCloseTo(0.75, 2);
  await page.locator('[data-story="2"]').click();
  await expect.poll(() => page.evaluate(() => {
    const story = document.getElementById("scroll-story");
    const stage = story.querySelector(".story-stage");
    return Math.abs(scrollY - (story.offsetTop + story.offsetHeight - stage.offsetHeight));
  })).toBeLessThanOrEqual(1);
  // Scroll positions are rounded to device pixels, so opacity can stop just below 1.
  await expect.poll(() => page.locator('[data-slide="2"]').evaluate(
    (slide) => Number(getComputedStyle(slide).opacity),
  )).toBeCloseTo(1, 2);
});

test("collection crossfades on scroll and supports direct navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const story = document.getElementById("scroll-story");
    window.scrollTo({
      top: story.offsetTop + (story.offsetHeight - story.querySelector(".story-stage").offsetHeight) * 0.5,
      behavior: "instant",
    });
  });
  await expect(page.locator('[data-slide="1"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-slide="0"]')).toHaveAttribute("inert", "");
  await page.locator('[data-story="2"]').click();
  await expect(page.locator('[data-slide="2"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-story="2"]')).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.locator('[data-slide="2"] .button')).toBeVisible();
});
