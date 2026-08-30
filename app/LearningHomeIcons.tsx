"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/ClockCounterClockwise";
import { DatabaseIcon } from "@phosphor-icons/react/Database";
import { FileTextIcon } from "@phosphor-icons/react/FileText";
import { FlowArrowIcon } from "@phosphor-icons/react/FlowArrow";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { UsersThreeIcon } from "@phosphor-icons/react/UsersThree";

export function InlineArrow({ size = 16 }: { size?: number }) {
  return <ArrowRightIcon aria-hidden="true" size={size} weight="bold" />;
}

export function CorpusIcon({ type }: { type: "archive" | "record" | "template" | "workflow" }) {
  if (type === "archive") {
    return <ClockCounterClockwiseIcon aria-hidden="true" size={23} weight="regular" />;
  }
  if (type === "record") {
    return <DatabaseIcon aria-hidden="true" size={23} weight="regular" />;
  }
  return <FileTextIcon aria-hidden="true" size={23} weight="regular" />;
}

export function InstrumentIcon({
  size = 18,
  type,
}: {
  size?: number;
  type: "people" | "record" | "template" | "workflow";
}) {
  if (type === "people") {
    return <UsersThreeIcon aria-hidden="true" size={size} weight="regular" />;
  }
  if (type === "record") {
    return <FileTextIcon aria-hidden="true" size={size} weight="regular" />;
  }
  if (type === "workflow") {
    return <FlowArrowIcon aria-hidden="true" size={size} weight="regular" />;
  }
  return <ShieldCheckIcon aria-hidden="true" size={size} weight="regular" />;
}
