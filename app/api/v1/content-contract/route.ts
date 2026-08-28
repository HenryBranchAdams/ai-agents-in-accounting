import {
  educationalContentContract,
  renderContentContractMarkdown,
} from "../../../content-contract";
import { siteOrigin } from "../../../agent-interface";
import { createKnowledgeHubRoute } from "../../../knowledge-hub-api";

const route = createKnowledgeHubRoute({
  collection: "content_contract",
  item: educationalContentContract,
  links: {
    self: `${siteOrigin}/api/v1/content-contract`,
    human: `${siteOrigin}/content-contract`,
    markdown: `${siteOrigin}/content-contract.md`,
    openapi: `${siteOrigin}/openapi.json`,
  },
  renderMarkdown: renderContentContractMarkdown,
});

export const { GET, HEAD, OPTIONS } = route;
