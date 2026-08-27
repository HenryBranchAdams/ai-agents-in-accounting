import {
  apiVersion,
  corsOptionsResponse,
  negotiatePublicFormat,
  problemResponse,
  publicResponse,
  rightsNotice,
  siteOrigin,
} from "../../../agent-interface";
import { accountingAgentsCoreCourse, renderCoreCourseMarkdown } from "../../../core-course";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const requestedFormat = new URL(request.url).searchParams.get("format")?.trim().toLowerCase();
  if (requestedFormat && requestedFormat !== "json" && requestedFormat !== "markdown") {
    return problemResponse(request, 400, "Invalid format", "The format parameter must be json or markdown.", {
      allowed_values: ["json", "markdown"],
    });
  }
  const format = negotiatePublicFormat(request, requestedFormat);
  if (!format) {
    return problemResponse(request, 406, "Not acceptable", "Request application/json or text/markdown.", {
      available_types: ["application/json", "text/markdown"],
    });
  }
  if (format === "markdown") {
    return publicResponse(request, renderCoreCourseMarkdown(), "text/markdown; charset=utf-8", {
      headers: { "Content-Language": "en" },
    });
  }

  return publicResponse(
    request,
    JSON.stringify({
      schema_version: apiVersion,
      collection: "accounting_agents_core_course",
      rights_notice: rightsNotice,
      links: {
        self: `${siteOrigin}/api/v1/course`,
        human: `${siteOrigin}/course`,
        markdown: `${siteOrigin}/course.md`,
        start_here: `${siteOrigin}/start-here`,
        source_library: `${siteOrigin}/resources`,
        capstone_workflow: `${siteOrigin}/workflows/record-to-report/wf-r2r-bank-reconciliations`,
      },
      item: accountingAgentsCoreCourse,
    }, null, 2),
    "application/json; charset=utf-8",
  );
}

export const HEAD = GET;
