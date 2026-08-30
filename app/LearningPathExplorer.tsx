"use client";

import {
  ArrowRightIcon,
  BinocularsIcon,
  BookOpenIcon,
  BuildingsIcon,
  CheckIcon,
  FlowArrowIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useId, useState } from "react";
import type { PracticeObservatoryItem } from "./practice-observatory";

type RolePath = {
  id: string;
  label: string;
  href: string;
  next: string;
  outcome: string;
};

type Industry = {
  id: string;
  label: string;
};

type PathItem = {
  title: string;
  description: string;
  href: string;
  secondaryHref: string;
  secondaryLabel: string;
  icon: typeof BookOpenIcon;
  meta: string;
  accent: string;
};

export function LearningPathExplorer({
  industries,
  rolePaths,
  sourceCount,
  templateCount,
  workflowCount,
  currentSignals,
  currentSignalCount,
  laneLabels,
}: {
  industries: readonly Industry[];
  rolePaths: readonly RolePath[];
  sourceCount: number;
  templateCount: number;
  workflowCount: number;
  currentSignals: readonly PracticeObservatoryItem[];
  currentSignalCount: number;
  laneLabels: ReadonlyMap<string, string>;
}) {
  const roleControlId = useId();
  const industryControlId = useId();
  const [roleId, setRoleId] = useState(rolePaths[0]?.id ?? "");
  const [industryId, setIndustryId] = useState("general");
  const selectedRole = rolePaths.find((path) => path.id === roleId) ?? rolePaths[0];
  const selectedIndustry = industries.find((industry) => industry.id === industryId) ?? industries[0];
  const industryQuery = industryId ? `?industry=${encodeURIComponent(industryId)}` : "";
  const pathItems: PathItem[] = [
    {
      accent: "blue",
      title: "Learn the foundations",
      description: "Orientation and core course",
      href: "/start-here",
      secondaryHref: "/course",
      secondaryLabel: "Take the core course",
      icon: BookOpenIcon,
      meta: `${workflowCount} workflows`,
    },
    {
      accent: "orange",
      title: "Practice a complete accounting lesson",
      description: "Synthetic lessons and templates",
      href: "/tutorials/bank-reconciliation",
      secondaryHref: "/workflows",
      secondaryLabel: "Explore accounting workflows",
      icon: FlowArrowIcon,
      meta: `${templateCount} templates`,
    },
    {
      accent: "plum",
      title: "Govern the work",
      description: "Authority, controls, and reviewer guides",
      href: "/templates",
      secondaryHref: "/control-model",
      secondaryLabel: "Put the guidance to work",
      icon: ShieldCheckIcon,
      meta: `${templateCount} practical templates`,
    },
    {
      accent: "green",
      title: "Research the field",
      description: "Reading room, observatory, and sources",
      href: "/reading-room",
      secondaryHref: `/resources${industryQuery}`,
      secondaryLabel: "Browse the source catalog",
      icon: BinocularsIcon,
      meta: `${sourceCount} source records`,
    },
  ];

  return (
    <section
      aria-labelledby="learning-map-title"
      className="learning-path-explorer"
      data-learning-path-map
      id="guide-map"
    >
      <div className="learning-path-heading">
        <div>
          <p className="learning-kicker">Find your path</p>
          <h2 id="learning-map-title">Find your path</h2>
        </div>
        <div className="learning-path-controls">
          <label htmlFor={roleControlId}>
            <span>I am a</span>
            <span className="select-control">
              <select id={roleControlId} onChange={(event) => setRoleId(event.target.value)} value={roleId}>
                {rolePaths.map((path) => <option key={path.id} value={path.id}>{path.label}</option>)}
              </select>
            </span>
          </label>
          <label htmlFor={industryControlId}>
            <span>Industry context</span>
            <span className="select-control">
              <BuildingsIcon aria-hidden="true" size={20} />
              <select id={industryControlId} onChange={(event) => setIndustryId(event.target.value)} value={industryId}>
                {industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.label}</option>)}
              </select>
            </span>
          </label>
        </div>
      </div>

      <p aria-live="polite" className="learning-path-selection">
        <strong>{selectedRole?.label}</strong>
        <span aria-hidden="true"> · </span>
        {selectedRole?.next}. Industry material is filtered to {selectedIndustry?.label ?? "General accounting"} where applicable.
      </p>

      <div className="learning-path-body">
        <div className="learning-path-main">
          {/* This raster contains only synthetic ledger textures; all map content remains code-native. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Two synthetic ledger sheets frame the learning-path map."
            className="learning-map-backdrop"
            decoding="async"
            height="700"
            loading="eager"
            src="/images/editorial/07-learning-path-ledger-edges.png"
            width="1800"
          />
          <ol className="learning-path-rail">
            {pathItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <li className={`learning-path-step learning-path-step-${item.accent}`} key={item.title}>
                  <span aria-hidden="true" className="learning-path-step-marker">
                    {index === 0 ? <CheckIcon size={16} weight="bold" /> : index + 1}
                  </span>
                  <article>
                    <Link className="learning-branch-primary" href={item.href}>
                      <span aria-hidden="true" className="learning-branch-icon"><Icon size={23} /></span>
                      <span className="learning-branch-copy">
                        <span className="learning-path-step-number">0{index + 1}</span>
                        <h3>{item.title}</h3>
                        <span>{item.description}</span>
                        <small>{item.meta}</small>
                      </span>
                      <ArrowRightIcon aria-hidden="true" size={18} />
                    </Link>
                    <Link className="learning-branch-secondary" href={item.secondaryHref}>
                      {item.secondaryLabel}
                      <ArrowRightIcon aria-hidden="true" size={13} />
                    </Link>
                  </article>
                </li>
              );
            })}
          </ol>
          <div className="learning-rule-node" id="operating-rule">
            <strong>Agents prepare work</strong>
            <span aria-hidden="true" />
            <strong>People approve conclusions</strong>
          </div>
          <div className="learning-path-actions">
            <Link className="button button-primary" href="/reviewer-guide">
              Run a reviewer-led session <ArrowRightIcon aria-hidden="true" size={17} />
            </Link>
            <Link className="button button-secondary" href={`/observatory${industryQuery}`}>
              Browse current developments
            </Link>
          </div>
          <p className="learning-path-boundary">
            These are deterministic starting paths, not rankings or conclusions. The selected role continues to{" "}
            <Link href={selectedRole?.href ?? "/start-here"}>{selectedRole?.next ?? "Start here"}</Link>.
          </p>
        </div>

        <aside aria-labelledby="learning-current-title" className="learning-current-rail">
          <p className="learning-kicker">Current signal</p>
          <h2 id="learning-current-title">Current signal</h2>
          {currentSignals.map((item) => (
            <article className="learning-current-item" key={item.id}>
              <div>
                <span>{laneLabels.get(item.lane_id)}</span>
                <time dateTime={item.source_updated_at ?? item.published_or_status}>
                  {item.source_updated_at ?? item.published_or_status}
                </time>
              </div>
              <h3><Link href={item.catalog_href}>{item.title}</Link></h3>
              <Link href={item.catalog_href}>
                Inspect source record <ArrowRightIcon aria-hidden="true" size={14} />
              </Link>
            </article>
          ))}
          <Link className="learning-section-link" href="/observatory">
            Practice observatory · {currentSignalCount} current developments <ArrowRightIcon aria-hidden="true" size={14} />
          </Link>
          <div className="learning-source-method">
            <p className="learning-kicker">Source method</p>
            <p>Source records are dated, classified, and linked to their original publishers.</p>
            <Link href="/resources#method">Read the source method</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
