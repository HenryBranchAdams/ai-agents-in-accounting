import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import type { EvidencePreview } from "../evidence-preview-contract";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

function EvidenceControls({ targets }: { targets: { element: HTMLElement; value: EvidencePreview }[] }) {
  const [active, setActive] = useState<number | null>(null);
  return targets.map(({ element, value }, index) => createPortal(
    <Popover open={active === index} onOpenChange={open => setActive(current => open ? index : current === index ? null : current)}>
      <PopoverTrigger asChild><Button variant="outline" size="sm" aria-label={`Inspect ${value.sources.length} referenced source${value.sources.length === 1 ? "" : "s"} for finding ${index + 1}`}>Inspect sources ({value.sources.length})</Button></PopoverTrigger>
      <PopoverContent size="evidence" align="start" aria-labelledby={`evidence-title-${index}`} aria-describedby={`evidence-description-${index}`}>
        <h3 id={`evidence-title-${index}`}>Recorded evidence connection</h3>
        <p id={`evidence-description-${index}`}>These are references recorded for this finding, not a count of independent confirmations.</p>
        <p><strong>{value.classification}:</strong> {value.claim}</p>
        <p><strong>Qualification:</strong> {value.qualification}</p>
        <p><strong>Finding-level locator:</strong> {value.locator}</p>
        <p>This locator applies to the finding; it is not automatically a separate locator for every source below.</p>
        <ul className="flex flex-col gap-5">
          {value.sources.map(source => <li key={source.id}>
            {source.available ? <a href={source.href}>{source.title}</a> : <p>Referenced record unavailable: {source.id}. <a href={value.owner_href}>Inspect the owner record</a>.</p>}
            <p><strong>Publisher:</strong> {source.publisher}</p>
            <p><strong>Source summary, not a finding-specific support reason:</strong> {source.summary}</p>
            <p><strong>Review:</strong> {source.review_status}. {source.review_scope}. Reviewed: {source.reviewed_at}.</p>
            <p><strong>Source review locator:</strong> {source.review_locator}</p>
            <p><strong>Access:</strong> {source.access}</p>
            {source.original_url ? <p><a href={source.original_url}>Open original source</a></p> : <p>Original-source URL unavailable or invalid.</p>}
            {source.limitations.length ? <><h4>Recorded source limitations</h4><ul>{source.limitations.map((limitation, i) => <li key={i}>{limitation}</li>)}</ul></> : <p>Source limitations are unknown or not recorded; absence is not evidence of unrestricted use.</p>}
            <h4>Rights and permissions</h4><dl>{source.rights.map(right => <div key={right.label}><dt>{right.label}</dt><dd>{right.value}</dd></div>)}</dl>
          </li>)}
        </ul>
        <p>Corpus edition {value.corpus_version}. <a href={value.owner_href}>Owner record</a>.</p>
      </PopoverContent>
    </Popover>, element, String(index)));
}

let initialized = false;
export function initializeEvidencePreviews() {
  if (initialized) return;
  const targets = [...document.querySelectorAll<HTMLElement>("[data-evidence-preview]")].flatMap(element => {
    try { const value = JSON.parse(element.dataset.evidencePreview || "") as EvidencePreview;
      return value.corpus_version === document.body.dataset.corpusVersion && Array.isArray(value.sources) && value.sources.length ? [{ element, value }] : [];
    } catch { return []; }
  });
  if (!targets.length) return;
  const container = document.createElement("div");document.body.appendChild(container);
  createRoot(container, { identifierPrefix: "evidence-" }).render(<EvidenceControls targets={targets} />);
  initialized = true;
}
