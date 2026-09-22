import assert from "node:assert/strict";
import path from "node:path";
export async function libraryMapJourney(browser, origin, directory, receipt) {
  const data = await (await fetch(origin + "/api/v1/library-map")).json();
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 1000 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({
        viewport,
        hasTouch: name === "mobile",
        reducedMotion: "reduce",
      }),
      page = await context.newPage(),
      errors = [],
      requests = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => requests.push(r.url()));
    const journey = { name, viewport, status: "running", errors };
    receipt.journeys.push(journey);
    try {
      await page.goto(origin + "/map");
      const canvas = page.locator(".library-map-canvas");
      await page.waitForFunction(
        () => document.querySelector(".library-map-canvas")?.dataset.readyMs,
      );
      assert.equal(
        await canvas.getAttribute("data-records"),
        String(data.records.length),
      );
      assert.equal(
        await canvas.getAttribute("data-topics"),
        String(data.topics.length),
      );
      assert.match(await page.title(), /Library map/);
      assert.ok(
        await page
          .getByRole("heading", { name: "Library map", exact: true })
          .isVisible(),
      );
      const positions = await canvas.getAttribute("data-positions");
      journey.initial = await page.evaluate(() => ({
        ready_ms:
          performance.getEntriesByName("library-map-ready")[0]?.startTime,
        heap_bytes: performance.memory?.usedJSHeapSize,
        requests: performance.getEntriesByType("resource").map((r) => ({
          name: new URL(r.name).pathname,
          transfer_bytes: r.transferSize,
          decoded_bytes: r.decodedBodySize,
          duration_ms: r.duration,
        })),
      }));
      await page.screenshot({
        path: path.join(directory, `${name}-overview.png`),
      });
      await page
        .locator(".library-map-stage")
        .screenshot({ path: path.join(directory, `${name}-whole-canvas.png`) });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "No horizontal overflow",
      );
      const topic = data.topics.find(
        (t) => t.title === "Family office accounting",
      );
      await page.locator(".map-filter-disclosure > summary").click();
      await page.getByLabel("Topic", { exact: true }).selectOption(topic.id);
      await page.getByRole("button", { name: "Apply", exact: true }).click();
      await page.waitForURL(
        (url) => url.searchParams.get("topic") === topic.id,
      );
      assert.match(
        await page.getByRole("status").last().innerText(),
        new RegExp(`${topic.count} matching records`),
      );
      assert.equal(
        await canvas.getAttribute("data-positions"),
        positions,
        "Topic selection must not rerun the layout",
      );
      await page
        .locator(".library-map-stage")
        .screenshot({ path: path.join(directory, `${name}-topic.png`) });
      await page
        .getByLabel("Search the whole library", { exact: true })
        .fill("bank reconciliation");
      const start = Date.now();
      await page
        .getByLabel("Search the whole library", { exact: true })
        .press("Enter");
      await page.waitForURL(
        (url) => url.searchParams.get("q") === "bank reconciliation",
      );
      assert.equal(
        new URL(page.url()).searchParams.has("topic"),
        false,
        "Global search clears the prior topic",
      );
      await page
        .locator("#map-record-list")
        .getByRole("link", { name: "Bank reconciliations", exact: true })
        .click();
      await page.waitForURL(
        (url) =>
          url.searchParams.get("record") === "wf-r2r-bank-reconciliations",
      );
      await page.getByText("Source review", { exact: true }).waitFor();
      journey.search_to_inspection_ms = Date.now() - start;
      assert.equal(
        await canvas.getAttribute("data-positions"),
        positions,
        "Record inspection must not rerun the layout",
      );
      assert.equal(
        await page
          .locator("#map-selection-title")
          .evaluate((e) => e === document.activeElement),
        true,
        "Selection restores meaningful keyboard focus",
      );
      await page
        .locator("aside details")
        .filter({ hasText: /recorded connections/ })
        .locator("summary")
        .click();
      const edgeLink = page
        .locator("aside details")
        .filter({ hasText: /recorded connections/ })
        .getByRole("link")
        .first();
      await edgeLink.click();
      await page
        .getByRole("region", { name: "Selected connection evidence" })
        .waitFor();
      assert.ok(await page.getByText(/Stored at/).count());
      const cameraBefore = JSON.parse(
        await canvas.getAttribute("data-viewport"),
      );
      await page
        .getByRole("link", { name: "Open the complete record", exact: true })
        .click();
      await page.waitForURL(/\/records\/wf-r2r-bank-reconciliations$/);
      await page.goBack();
      await page.waitForFunction(
        () => document.querySelector(".library-map-canvas")?.dataset.readyMs,
      );
      assert.equal(
        new URL(page.url()).searchParams.get("record"),
        "wf-r2r-bank-reconciliations",
      );
      const cameraAfter = JSON.parse(
        await canvas.getAttribute("data-viewport"),
      );
      assert.ok(Math.abs(cameraBefore.zoom - cameraAfter.zoom) < 0.001);
      assert.ok(Math.abs(cameraBefore.pan.x - cameraAfter.pan.x) < 1);
      assert.ok(Math.abs(cameraBefore.pan.y - cameraAfter.pan.y) < 1);
      await page
        .getByRole("navigation", { name: "Library map views" })
        .getByRole("link", { name: "Whole library", exact: true })
        .click();
      await page.waitForURL(
        (url) =>
          !url.searchParams.has("record") &&
          !url.searchParams.has("topic") &&
          !url.searchParams.has("q"),
      );
      assert.equal(
        await canvas.getAttribute("data-records"),
        String(data.records.length),
      );
      const zoomBefore = JSON.parse(
        await canvas.getAttribute("data-viewport"),
      ).zoom;
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
      await page.waitForFunction(
        (before) =>
          JSON.parse(
            document.querySelector(".library-map-canvas").dataset.viewport,
          ).zoom > before,
        zoomBefore,
      );
      await page
        .getByRole("button", { name: "Fit whole library", exact: true })
        .click();
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        (before) =>
          Math.abs(
            JSON.parse(
              document.querySelector(".library-map-canvas").dataset.viewport,
            ).zoom - before,
          ) < 0.001,
        zoomBefore,
      );
      // Choose a visible label, where a touch target is much clearer than a tiny overview point.
      const point = await canvas.evaluate((element) => {
        const labels = JSON.parse(element.dataset.labels);
        return labels.length
          ? {
              x: labels[0].x + labels[0].w / 2,
              y: labels[0].y + labels[0].h / 2,
              id: labels[0].id,
            }
          : null;
      });
      assert.ok(point, "A visible topic can be selected directly");
      journey.pointer_target = point;
      if (name === "mobile")
        await canvas.tap({ position: { x: point.x, y: point.y } });
      else await canvas.click({ position: { x: point.x, y: point.y } });
      await page.waitForURL(
        (url) => url.searchParams.get("topic") === point.id,
      );
      if (name === "desktop") {
        const bounds = await canvas.boundingBox();
        const panBefore = JSON.parse(
          await canvas.getAttribute("data-viewport"),
        ).pan;
        await page.mouse.move(bounds.x + 10, bounds.y + 10);
        await page.mouse.down();
        await page.mouse.move(bounds.x + 55, bounds.y + 35, { steps: 5 });
        await page.mouse.up();
        await page.waitForFunction(
          (before) =>
            Math.abs(
              JSON.parse(
                document.querySelector(".library-map-canvas").dataset.viewport,
              ).pan.x - before.x,
            ) > 20,
          panBefore,
        );
        const picked = JSON.parse(
          await canvas.getAttribute("data-selected-point"),
        );
        const dragBefore = await canvas.getAttribute("data-positions");
        await page.mouse.move(bounds.x + picked.x, bounds.y + picked.y);
        await page.mouse.down();
        await page.mouse.move(
          bounds.x + picked.x + 35,
          bounds.y + picked.y + 20,
          { steps: 5 },
        );
        await page.mouse.up();
        await page.waitForFunction(
          (before) =>
            document.querySelector(".library-map-canvas").dataset.positions !==
            before,
          dragBefore,
        );
      }
      if (name === "desktop") {
        const positionBefore = await canvas.getAttribute("data-positions");
        await page.setViewportSize({ width: 800, height: 900 });
        assert.equal(
          await canvas.getAttribute("data-positions"),
          positionBefore,
        );
        await page.setViewportSize(viewport);
      }
      await page
        .getByRole("navigation", { name: "Library map views" })
        .getByRole("link", { name: "List", exact: true })
        .click();
      assert.equal(await canvas.count(), 0);
      await page
        .getByRole("navigation", { name: "Library map views" })
        .getByRole("link", { name: "Whole library", exact: true })
        .click();
      await page.getByRole("link", { name: "Next page", exact: true }).click();
      await page.waitForURL((url) => url.searchParams.get("page") === "2");
      assert.equal(await page.locator("#map-record-list li").count(), 30);
      await page.goBack();
      await page.goForward();
      assert.equal(new URL(page.url()).searchParams.get("page"), "2");
      assert.deepEqual(errors, []);
      assert.ok(requests.every((url) => new URL(url).origin === origin));
      journey.status = "passed";
    } catch (error) {
      journey.status = "failed";
      journey.failure = error.message;
      await page.screenshot({
        path: path.join(directory, `${name}-failure.png`),
      });
      throw error;
    } finally {
      await context.close();
    }
  }
  const keyboardContext = await browser.newContext(),
    keyboardPage = await keyboardContext.newPage();
  await keyboardPage.goto(origin + "/map");
  await keyboardPage.waitForFunction(
    () => document.querySelector(".library-map-canvas")?.dataset.readyMs,
  );
  await keyboardPage
    .getByLabel("Search the whole library", { exact: true })
    .focus();
  await keyboardPage.keyboard.type("bank reconciliation");
  await keyboardPage.keyboard.press("Enter");
  const result = keyboardPage
    .locator("#map-record-list")
    .getByRole("link", { name: "Bank reconciliations", exact: true });
  await result.focus();
  await keyboardPage.keyboard.press("Enter");
  await keyboardPage.getByText("Source review", { exact: true }).waitFor();
  assert.equal(
    await keyboardPage
      .locator("#map-selection-title")
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await keyboardPage
    .getByRole("link", { name: "Open the complete record", exact: true })
    .focus();
  await keyboardPage.keyboard.press("Enter");
  await keyboardPage.waitForURL(/\/records\/wf-r2r-bank-reconciliations$/);
  await keyboardPage.goBack();
  await keyboardPage
    .getByRole("heading", { name: "Bank reconciliations", exact: true })
    .waitFor();
  await keyboardContext.close();
  const native = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    }),
    page = await native.newPage();
  await page.goto(origin + "/map?mode=list");
  assert.equal(await page.locator("#map-record-list li").count(), 30);
  await page.getByRole("link", { name: "Next page", exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.get("page"), "2");
  await native.close();
  const failed = await browser.newContext(),
    failure = await failed.newPage();
  await failure.route("**/api/v1/library-map?*", (route) => route.abort());
  await failure.goto(origin + "/map");
  await failure.getByText(/interactive map could not load/).waitFor();
  assert.equal(await failure.locator("#map-record-list li").count(), 30);
  await failed.close();
  const reading = await browser.newContext(),
    read = await reading.newPage(),
    readingRequests = [];
  read.on("request", (r) => readingRequests.push(new URL(r.url()).pathname));
  await read.goto(origin + "/records/wf-r2r-bank-reconciliations");
  await read.getByRole("heading", { level: 1 }).waitFor();
  assert.ok(
    !readingRequests.some(
      (p) => p.includes("library-map") || p.includes("connections"),
    ),
  );
  await reading.close();
  receipt.status = "passed";
  receipt.map_version = data.map_version;
  receipt.corpus_version = data.corpus_version;
}
