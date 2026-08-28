"use client";

import { useId, useState, type ComponentType } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { BinocularsIcon } from "@phosphor-icons/react/Binoculars";
import { BookOpenIcon } from "@phosphor-icons/react/BookOpen";
import { BuildingsIcon } from "@phosphor-icons/react/Buildings";
import { CheckIcon } from "@phosphor-icons/react/Check";
import { FlowArrowIcon } from "@phosphor-icons/react/FlowArrow";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { UserIcon } from "@phosphor-icons/react/User";
import { UsersThreeIcon } from "@phosphor-icons/react/UsersThree";

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

type BranchProps = {
  accent: "blue" | "orange" | "plum" | "green";
  align: "left" | "right";
  description: string;
  href: string;
  icon: ComponentType<{ "aria-hidden"?: boolean; size?: number; weight?: "regular" | "bold" }>;
  meta: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  title: string;
};

function Branch({
  accent,
  align,
  description,
  href,
  icon: Icon,
  meta,
  secondaryHref,
  secondaryLabel,
  title,
}: BranchProps) {
  return (
    <article className={`learning-branch learning-branch-${align} learning-branch-${accent}`}>
      <Link className="learning-branch-primary" href={href}>
        <span aria-hidden="true" className="learning-branch-icon">
          <Icon size={27} weight="regular" />
        </span>
        <span className="learning-branch-copy">
          <h3>{title}</h3>
          <span>{description}</span>
          <small>{meta}</small>
        </span>
      </Link>
      {secondaryHref && secondaryLabel ? (
        <Link className="learning-branch-secondary" href={secondaryHref}>
          {secondaryLabel}
          <ArrowRightIcon aria-hidden="true" size={13} weight="bold" />
        </Link>
      ) : null}
    </article>
  );
}

export function LearningPathExplorer({
  industries,
  rolePaths,
  sourceCount,
  templateCount,
  workflowCount,
}: {
  industries: readonly Industry[];
  rolePaths: readonly RolePath[];
  sourceCount: number;
  templateCount: number;
  workflowCount: number;
}) {
  const roleControlId = useId();
  const industryControlId = useId();
  const [roleId, setRoleId] = useState(rolePaths[0]?.id ?? "");
  const [industryId, setIndustryId] = useState("general");

  const selectedRole = rolePaths.find((path) => path.id === roleId) ?? rolePaths[0];
  const selectedIndustry = industries.find((industry) => industry.id === industryId) ?? industries[0];
  const industryQuery = industryId ? `?industry=${encodeURIComponent(industryId)}` : "";

  return (
    <section
      aria-labelledby="learning-map-title"
      className="learning-path-explorer"
      data-learning-path-map
      id="guide-map"
    >
      <div className="learning-path-controls">
        <label htmlFor={roleControlId}>
          <span>I am a</span>
          <span className="select-control">
            <UserIcon aria-hidden="true" size={22} weight="regular" />
            <select id={roleControlId} onChange={(event) => setRoleId(event.target.value)} value={roleId}>
              {rolePaths.map((path) => (
                <option key={path.id} value={path.id}>{path.label}</option>
              ))}
            </select>
          </span>
        </label>

        <label htmlFor={industryControlId}>
          <span>Industry context</span>
          <span className="select-control">
            <BuildingsIcon aria-hidden="true" size={22} weight="regular" />
            <select id={industryControlId} onChange={(event) => setIndustryId(event.target.value)} value={industryId}>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>{industry.label}</option>
              ))}
            </select>
          </span>
        </label>
      </div>

      <h2 id="learning-map-title">Find your path</h2>
      <p aria-live="polite" className="learning-path-selection">
        <strong>{selectedRole?.label}</strong>
        <span aria-hidden="true"> · </span>
        {selectedRole?.next}. Industry material is filtered to {selectedIndustry?.label ?? "General accounting"} where applicable.
      </p>

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

      <div className="learning-map-canvas">
        <Branch
          accent="blue"
          align="left"
          description="Orientation and core course"
          href="/start-here"
          icon={BookOpenIcon}
          meta={`${workflowCount} workflows`}
          secondaryHref="/course"
          secondaryLabel="Take the core course"
          title="Learn the foundations"
        />
        <Branch
          accent="orange"
          align="right"
          description="Synthetic lessons and templates"
          href="/tutorials/bank-reconciliation"
          icon={FlowArrowIcon}
          meta={`${templateCount} templates`}
          secondaryHref="/workflows"
          secondaryLabel="Explore accounting workflows"
          title="Practice a complete accounting lesson"
        />

        <div className="learning-rule-node" id="operating-rule">
          <UsersThreeIcon aria-hidden="true" size={31} weight="regular" />
          <strong>Agents prepare work</strong>
          <span aria-hidden="true" />
          <strong>People approve conclusions</strong>
          <span aria-hidden="true" className="learning-rule-check">
            <CheckIcon size={19} weight="bold" />
          </span>
        </div>

        <Branch
          accent="plum"
          align="left"
          description="Authority, controls, and reviewer guides"
          href="/templates"
          icon={ShieldCheckIcon}
          meta={`${templateCount} practical templates`}
          secondaryHref="/control-model"
          secondaryLabel="Put the guidance to work"
          title="Govern the work"
        />
        <Branch
          accent="green"
          align="right"
          description="Reading room, observatory, and sources"
          href="/reading-room"
          icon={BinocularsIcon}
          meta={`${sourceCount} source records`}
          secondaryHref={`/resources${industryQuery}`}
          secondaryLabel="Browse the source catalog"
          title="Research the field"
        />
      </div>

      <div className="learning-path-actions">
        <Link className="button button-primary" href="/reviewer-guide">
          Run a reviewer-led session
          <ArrowRightIcon aria-hidden="true" size={17} weight="bold" />
        </Link>
        <Link className="button button-secondary" href={`/observatory${industryQuery}`}>
          Browse current developments
        </Link>
      </div>

      <p className="learning-path-boundary">
        These are deterministic starting paths, not rankings or conclusions. The selected role continues to{" "}
        <Link href={selectedRole?.href ?? "/start-here"}>{selectedRole?.next ?? "Start here"}</Link>.
      </p>
    </section>
  );
}
