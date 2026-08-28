import { accountingAgentsCoverageMap, renderCoverageMapMarkdown } from "../../../coverage-map";
import { siteOrigin } from "../../../agent-interface";
import { createKnowledgeHubRoute } from "../../../knowledge-hub-api";

const route = createKnowledgeHubRoute({
  collection: "coverage_map",
  item: accountingAgentsCoverageMap,
  links: {
    self: `${siteOrigin}/api/v1/coverage`,
    human: `${siteOrigin}/coverage`,
    markdown: `${siteOrigin}/coverage.md`,
    workflows: `${siteOrigin}/api/v1/workflows?limit=60`,
  },
  renderMarkdown: renderCoverageMapMarkdown,
});

export const { GET, HEAD, OPTIONS } = route;
