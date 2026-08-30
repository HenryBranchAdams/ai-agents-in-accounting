"use client";

import {
  ArrowRightIcon,
  ClipboardTextIcon,
  FileMagnifyingGlassIcon,
  FileTextIcon,
  MapTrifoldIcon,
  MagnifyingGlassIcon,
  PencilSimpleLineIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useId, useState } from "react";

type RolePath = {
  id: string;
  label: string;
  href: string;
  next: string;
  outcome: string;
};

type MapStepId = "evidence" | "prepare" | "review" | "approve";

type MapStep = {
  id: MapStepId;
  label: string;
  description: string;
  preview: string;
  href: string;
  action: string;
  Icon: typeof FileTextIcon;
};

const steps: readonly MapStep[] = [
  {
    id: "evidence",
    label: "Evidence",
    description: "Collect and verify source records.",
    preview: "Inspect the synthetic bank and ledger extracts, source identifiers, period, and control totals.",
    href: "/tutorials/bank-reconciliation",
    action: "Inspect evidence",
    Icon: FileTextIcon,
  },
  {
    id: "prepare",
    label: "Prepare",
    description: "Draft the reconciliation and link supporting evidence.",
    preview: "Draft the bank reconciliation with explanations and links to the approved synthetic evidence set.",
    href: "/tutorials/bank-reconciliation",
    action: "Continue step",
    Icon: PencilSimpleLineIcon,
  },
  {
    id: "review",
    label: "Review",
    description: "Assess the draft and flag adjustments.",
    preview: "Assess the prepared draft, its exceptions, and the evidence needed before a conclusion can be considered.",
    href: "/reviewer-guide",
    action: "Open reviewer guide",
    Icon: MagnifyingGlassIcon,
  },
  {
    id: "approve",
    label: "Approve",
    description: "Approve conclusions and record final adjustments.",
    preview: "A named accountable reviewer decides whether to approve, modify, reject, or escalate the proposed treatment.",
    href: "/authority",
    action: "Read authority ladder",
    Icon: ShieldCheckIcon,
  },
];

export function LearningPathExplorer({
  rolePaths,
  sourceCount,
  workflowCount,
}: {
  rolePaths: readonly RolePath[];
  sourceCount: number;
  workflowCount: number;
}) {
  const [selectedStepId, setSelectedStepId] = useState<MapStepId>("prepare");
  const [selectedRoleId, setSelectedRoleId] = useState(rolePaths[0]?.id ?? "");
  const previewId = useId();
  const selectedStep = steps.find((step) => step.id === selectedStepId) ?? steps[1];
  const selectedRole = rolePaths.find((path) => path.id === selectedRoleId) ?? rolePaths[0];
  const visibleRoles = rolePaths.slice(0, 4);

  return (
    <div className="aa2-explorer">
      <section aria-label="Evidence to approval learning path" className="aa2-map">
        <div aria-hidden="true" className="aa2-map-contours" />
        <div className="aa2-map-line aa2-map-line-one" />
        <div className="aa2-map-line aa2-map-line-two" />
        <div className="aa2-map-line aa2-map-line-three" />

        <ol className="aa2-map-steps">
          {steps.map((step, index) => {
            const Icon = step.Icon;
            const isSelected = selectedStep.id === step.id;
            return (
              <li className={`aa2-map-step aa2-map-step-${step.id}`} key={step.id}>
                <button
                  aria-controls={previewId}
                  aria-pressed={isSelected}
                  className={isSelected ? "aa2-map-node aa2-map-node-selected" : "aa2-map-node"}
                  onClick={() => setSelectedStepId(step.id)}
                  type="button"
                >
                  <span className="aa2-map-node-icon"><Icon aria-hidden="true" size={25} weight="regular" /></span>
                  <span className="aa2-map-node-copy">
                    <strong>{step.label}</strong>
                    <span>{step.description}</span>
                  </span>
                </button>
                {index < steps.length - 1 ? <span aria-hidden="true" className="aa2-map-arrow" /> : null}
              </li>
            );
          })}
        </ol>

        <aside aria-live="polite" className="aa2-step-preview" id={previewId}>
          <p>{selectedStep.label.toUpperCase()} <span>·</span> WORKFLOW STAGE {steps.findIndex((step) => step.id === selectedStep.id) + 1} OF {steps.length}</p>
          <h2>{selectedStep.label}</h2>
          <p className="aa2-step-preview-summary">{selectedStep.preview}</p>
          {selectedStep.id === "prepare" ? (
            <>
              <div className="aa2-preview-rule"><span>You will</span></div>
              <ul>
                <li><FileMagnifyingGlassIcon aria-hidden="true" size={18} /> Propose match decisions</li>
                <li><ClipboardTextIcon aria-hidden="true" size={18} /> Create explanation notes</li>
                <li><FileTextIcon aria-hidden="true" size={18} /> Link to source evidence</li>
                <li><FileTextIcon aria-hidden="true" size={18} /> Generate reconciliation draft</li>
              </ul>
            </>
          ) : null}
          <Link className="aa2-step-preview-link" href={selectedStep.href}>
            {selectedStep.action} <ArrowRightIcon aria-hidden="true" size={19} />
          </Link>
        </aside>

        <div aria-label="Map legend" className="aa2-map-legend">
          {steps.map((step) => <span className={`aa2-legend-${step.id}`} key={step.id}>{step.label}</span>)}
          <span className="aa2-legend-capability">Agent capabilities</span>
          <span className="aa2-legend-path">Your learning path</span>
        </div>
      </section>

      <section aria-labelledby="aa2-role-title" className="aa2-paths">
        <div className="aa2-role-paths">
          <h2 id="aa2-role-title">Role-based paths</h2>
          <p>Choose your role to follow a focused learning path.</p>
          <div aria-label="Role-based learning paths" className="aa2-role-options" role="tablist">
            {visibleRoles.map((path) => {
              const selected = path.id === selectedRoleId;
              return (
                <button
                  aria-selected={selected}
                  className={selected ? "aa2-role-option aa2-role-option-selected" : "aa2-role-option"}
                  key={path.id}
                  onClick={() => setSelectedRoleId(path.id)}
                  role="tab"
                  type="button"
                >
                  <UserCircleIcon aria-hidden="true" size={24} weight="regular" />
                  <span>{path.label}</span>
                  <ArrowRightIcon aria-hidden="true" size={20} />
                </button>
              );
            })}
          </div>
          {selectedRole ? (
            <div className="aa2-role-detail" role="tabpanel">
              <p>{selectedRole.outcome}</p>
              <Link href={selectedRole.href}>{selectedRole.next} <ArrowRightIcon aria-hidden="true" size={17} /></Link>
            </div>
          ) : null}
        </div>

        <aside aria-labelledby="aa2-atlas-title" className="aa2-atlas-teaser">
          <div>
            <h2 id="aa2-atlas-title">The Living Atlas</h2>
            <p>Explore governed accounting work across industries, controls, and sources.</p>
            <div className="aa2-atlas-actions">
              <Link href="/atlas"><MapTrifoldIcon aria-hidden="true" size={21} /> Open the Atlas</Link>
              <Link href="/atlas"><MagnifyingGlassIcon aria-hidden="true" size={20} /> Search the Atlas</Link>
            </div>
            <p className="aa2-atlas-counts">{workflowCount} workflows · {sourceCount} source records</p>
          </div>
          <div aria-hidden="true" className="aa2-atlas-map" />
        </aside>

        <p className="aa2-mobile-boundary">
          <ShieldCheckIcon aria-hidden="true" size={24} weight="regular" />
          Agents prepare work. People approve conclusions and sensitive actions.
        </p>
      </section>
    </div>
  );
}
