import { problemResponse, publicResponse, siteOrigin } from "../../agent-interface";

const apiCatalogUrl = `${siteOrigin}/.well-known/api-catalog`;
const openApiUrl = `${siteOrigin}/openapi.json`;
const documentationUrl = `${siteOrigin}/machine-access`;
const metadataUrl = `${siteOrigin}/api/v1/meta`;
const apiEndpoints = [
  `${siteOrigin}/api/v1/workflows`,
  `${siteOrigin}/api/v1/authority-levels`,
  `${siteOrigin}/api/v1/sensitive-actions`,
  `${siteOrigin}/api/v1/controls`,
  `${siteOrigin}/api/v1/templates`,
  `${siteOrigin}/api/v1/glossary`,
  `${siteOrigin}/api/v1/ecosystem`,
  `${siteOrigin}/api/v1/resources`,
  `${siteOrigin}/api/v1/search`,
  `${siteOrigin}/api/v1/packs`,
  `${siteOrigin}/api/v1/benchmark`,
  `${siteOrigin}/api/v1/ledgerbench`,
  metadataUrl,
  `${siteOrigin}/api/v1/taxonomy`,
  `${siteOrigin}/api/v1/content-contract`,
  `${siteOrigin}/api/v1/control-model`,
  `${siteOrigin}/api/v1/coverage`,
  `${siteOrigin}/api/v1/start-here`,
  `${siteOrigin}/api/v1/reviewer-guide`,
];
const schemaEndpoints = [
  `${siteOrigin}/schemas/ledgerbench-program.schema.json`,
  `${siteOrigin}/schemas/ledgerbench-episode.schema.json`,
  `${siteOrigin}/schemas/ledgerbench-result.schema.json`,
  `${siteOrigin}/schemas/ledgerbench-submission.schema.json`,
];

const document = {
  linkset: [
    {
      anchor: apiCatalogUrl,
      item: [...apiEndpoints, ...schemaEndpoints].map((href) => ({ href })),
    },
    ...apiEndpoints.map((anchor) => ({
      anchor,
      "service-desc": [
        {
          href: openApiUrl,
          type: "application/vnd.oai.openapi+json;version=3.1",
        },
      ],
      "service-doc": [{ href: documentationUrl, type: "text/html" }],
      "service-meta": [{ href: metadataUrl, type: "application/json" }],
    })),
    ...schemaEndpoints.map((anchor) => ({
      anchor,
      describedby: [{ href: `${siteOrigin}/ledgerbench`, type: "text/html" }],
      "service-desc": [{ href: anchor, type: "application/schema+json" }],
    })),
  ],
};

export async function GET(
  request: Request,
  context: { params: Promise<{ wellKnown: string }> },
) {
  const { wellKnown } = await context.params;

  if (wellKnown !== ".well-known") {
    return problemResponse(request, 404, "API catalog not found", "This discovery route is only published at /.well-known/api-catalog.");
  }

  return publicResponse(
    request,
    JSON.stringify(document, null, 2),
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"; charset=utf-8',
    {
      headers: {
        Link: `</.well-known/api-catalog>; rel="api-catalog", </openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json;version=3.1", </machine-access>; rel="service-doc"; type="text/html"`,
      },
    },
  );
}

export const HEAD = GET;
