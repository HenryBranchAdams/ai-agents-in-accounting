import {
  Bank,
  BookOpen,
  Buildings,
  Compass,
  Database,
  FileText,
  Robot,
  Scales,
  ShieldCheck,
  WarningDiamond,
} from "@phosphor-icons/react";
import type { AtlasNode } from "../atlas-data";

export function AtlasNodeGlyph({ record }: { record: AtlasNode }) {
  if (record.id === "atlas-path-bank-reconciliation") return <Database aria-hidden="true" />;
  if (record.id === "atlas-step-matching-evidence") return <FileText aria-hidden="true" />;
  if (record.id === "atlas-step-exception-handling") return <Compass aria-hidden="true" />;
  if (record.kind === "workflow") return <Bank aria-hidden="true" />;
  if (record.kind === "human-gate") return <Scales aria-hidden="true" />;
  if (record.kind === "control") return <ShieldCheck aria-hidden="true" />;
  if (record.kind === "capability") return <Robot aria-hidden="true" />;
  if (record.kind === "source") return <BookOpen aria-hidden="true" />;
  if (record.kind === "industry") return <Buildings aria-hidden="true" />;
  return <WarningDiamond aria-hidden="true" />;
}
