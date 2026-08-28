import { accountingAgentsCoreCourse, renderCoreCourseMarkdown } from "../../../core-course";
import { siteOrigin } from "../../../agent-interface";
import { createKnowledgeHubRoute } from "../../../knowledge-hub-api";

const route = createKnowledgeHubRoute({
  collection: "accounting_agents_core_course",
  item: accountingAgentsCoreCourse,
  links: {
    self: `${siteOrigin}/api/v1/course`,
    human: `${siteOrigin}/course`,
    markdown: `${siteOrigin}/course.md`,
    start_here: `${siteOrigin}/start-here`,
    source_library: `${siteOrigin}/resources`,
    capstone_workflow: `${siteOrigin}/workflows/record-to-report/wf-r2r-bank-reconciliations`,
  },
  renderMarkdown: renderCoreCourseMarkdown,
});

export const { GET, HEAD, OPTIONS } = route;
