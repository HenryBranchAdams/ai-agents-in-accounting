import type { MetadataRoute } from "next";
import { catalogModifiedAt, siteOrigin } from "./agent-interface";
import { resources } from "./resources-data";
import { processFamilies, workflowRecords } from "./workflows-data";
import { packs } from "./platform-data";

const pages = [
  ["/", 1],
  ["/start-here", 1],
  ["/fundamentals", 0.9],
  ["/lifecycle", 0.9],
  ["/coverage", 0.9],
  ["/authority", 0.9],
  ["/workflows", 0.9],
  ["/control-model", 0.9],
  ["/controls", 0.9],
  ["/sensitive-actions", 0.9],
  ["/evidence-assurance", 0.8],
  ["/security-identity", 0.8],
  ["/architecture", 0.8],
  ["/ecosystem", 0.8],
  ["/evaluation", 0.8],
  ["/pilot", 0.8],
  ["/operations", 0.8],
  ["/templates", 0.8],
  ["/glossary", 0.8],
  ["/resources", 0.9],
  ["/reading-room", 0.8],
  ["/machine-access", 0.7],
  ["/packs", 0.9],
  ["/bench", 0.9],
  ["/ledgerbench", 0.9],
  ["/spec", 0.8],
  ["/methodology", 0.7],
  ["/changes", 0.7],
  ["/open-source", 0.8],
  ["/content-contract", 0.8],
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = pages.map(([path, priority]) => ({
    url: `${siteOrigin}${path}`,
    lastModified: new Date(
      path === "/resources"
        ? catalogModifiedAt
        : path === "/start-here" || path === "/authority"
          ? "2026-08-27T00:00:00Z"
        : path === "/control-model" || path === "/coverage"
          ? "2026-08-25T00:00:00Z"
          : "2026-08-23T00:00:00Z",
    ),
    changeFrequency: "monthly",
    priority,
  }));

  const familyPages: MetadataRoute.Sitemap = processFamilies.map((family) => ({
    url: `${siteOrigin}/workflows/${family.id}`,
    lastModified: new Date("2026-08-23T00:00:00Z"),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const workflowPages: MetadataRoute.Sitemap = workflowRecords.map((workflow) => ({
    url: `${siteOrigin}/workflows/${workflow.family}/${workflow.id}`,
    lastModified: new Date("2026-08-23T00:00:00Z"),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const resourcePages: MetadataRoute.Sitemap = resources.map((resource) => ({
    url: `${siteOrigin}/resources/${resource.id}`,
    lastModified: new Date(catalogModifiedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const packPages: MetadataRoute.Sitemap = packs.map((pack) => ({
    url: `${siteOrigin}/packs/${pack.id}`,
    lastModified: new Date("2026-08-23T00:00:00Z"),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...familyPages, ...workflowPages, ...resourcePages, ...packPages] as MetadataRoute.Sitemap;
}
