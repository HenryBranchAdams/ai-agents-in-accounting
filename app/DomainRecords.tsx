import type { ReactNode } from "react";
import {
  authorityLevels,
  type AuthorityLevelId,
  type WorkflowSourceLink,
} from "./domain-model";
import { resources } from "./resources-data";

const authorityById = new Map(authorityLevels.map((level) => [level.id, level]));
const resourceById = new Map(resources.map((resource) => [resource.id, resource]));

export function AuthorityTag({
  level,
  prefix,
}: {
  level: AuthorityLevelId;
  prefix?: string;
}) {
  const record = authorityById.get(level);

  return (
    <span className={`authority-tag authority-${level}`}>
      {prefix ? `${prefix} ` : ""}{level === "human-only" ? "Human-only" : level} · {record?.label}
    </span>
  );
}

export function SourceReferences({
  ids,
  annotations,
}: {
  ids: string[];
  annotations?: Record<string, {
    supports: string;
    claims?: WorkflowSourceLink["claims"];
    applicability: string;
  }>;
}) {
  return (
    <ul className="source-reference-list">
      {ids.map((id) => {
        const source = resourceById.get(id);
        if (!source) return <li key={id}>Unknown source · {id}</li>;

        return (
          <li key={id}>
            <a href={`/resources/${source.id}`}>{source.title}</a>
            <span>
              {source.owner} · {source.kind} ·{" "}
              <a href={source.href} rel="noreferrer" target="_blank">
                Primary source<span aria-hidden="true"> ↗</span>
              </a>
            </span>
            {annotations?.[id] && (
              <span className="source-reference-note">
                <strong>{annotations[id].supports}.</strong>{" "}
                {annotations[id].claims?.length
                  ? `Claims: ${annotations[id].claims.map((claim) => `${claim.placement}: ${claim.text}`).join(" ")} `
                  : ""}
                {annotations[id].applicability}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ClaimReferences({
  links,
  placement,
  label = "Source-linked claims",
}: {
  links: WorkflowSourceLink[];
  placement: WorkflowSourceLink["claims"][number]["placement"];
  label?: string;
}) {
  const placedClaims = links.flatMap((link) =>
    link.claims
      .filter((claim) => claim.placement === placement)
      .map((claim) => ({ claim, link })),
  );
  if (!placedClaims.length) return null;

  return (
    <aside aria-label={label} className="claim-reference-block">
      <p className="claim-reference-label">{label}</p>
      <ul>
        {placedClaims.map(({ claim, link }) => {
          const source = resourceById.get(link.source_id);
          if (!source) return null;

          return (
            <li key={`${link.source_id}-${placement}-${claim.text}`}>
              <span>{claim.text}</span>
              <small>
                <a href={`/resources/${source.id}`}>{source.title}</a>
                {" · "}{link.supports}. {link.applicability}
              </small>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function RecordSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="record-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="compact-list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}
