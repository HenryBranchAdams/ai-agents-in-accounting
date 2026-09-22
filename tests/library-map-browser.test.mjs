import test from "node:test";
import { productionBrowser } from "./browser-support/production.mjs";
import { libraryMapJourney } from "./browser-support/library-map-journey.mjs";
test(
  "whole-library desktop/mobile journeys, provenance, native List and failure recovery",
  { timeout: 240000 },
  async (t) => {
    const { browser, origin, directory, receipt } = await productionBrowser(
      t,
      "library-map",
    );
    receipt.fallback =
      "Browser plugin not available; authorized project Playwright Chromium fallback";
    await libraryMapJourney(browser, origin, directory, receipt);
  },
);
