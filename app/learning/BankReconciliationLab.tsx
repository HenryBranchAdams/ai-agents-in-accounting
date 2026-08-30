"use client";

import {
  ArrowRight,
  ArrowSquareOut,
  CheckCircle,
  FileText,
  LinkSimple,
  ShieldCheck,
  UserCircle,
  WarningDiamond,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

const stages = [
  { label: "Evidence register", icon: FileText },
  { label: "Tie-out", icon: LinkSimple },
  { label: "Exception", icon: WarningDiamond },
  { label: "Reviewer packet", icon: UserCircle },
  { label: "Decision", icon: ShieldCheck },
];

const entries = [
  ["May 1", "Beginning balance", "—", "—", "50,000.00", "May 1", "Beginning balance", "—", "—", "50,000.00"],
  ["May 5", "Payment received", "12,450.00", "—", "62,450.00", "May 5", "Payment received", "12,450.00", "—", "62,450.00"],
  ["May 10", "Check #1023", "—", "3,210.00", "59,240.00", "May 10", "Check #1023", "—", "3,210.00", "59,240.00"],
  ["May 15", "Customer deposit", "4,860.00", "—", "64,100.00", "—", "—", "—", "—", "—"],
  ["May 20", "Check #1024", "—", "2,375.00", "61,725.00", "May 20", "Check #1024", "—", "2,375.00", "56,865.00"],
  ["May 25", "Service fee", "—", "45.00", "61,680.00", "May 25", "Service fee", "—", "45.00", "56,820.00"],
  ["May 31", "Ending balance", "—", "—", "61,680.00", "May 31", "Ending balance", "—", "—", "56,820.00"],
];

export function BankReconciliationLab() {
  const [action, setAction] = useState<"evidence" | "packet" | null>(null);
  const activeStage = action === "packet" ? 3 : 2;

  return (
    <section aria-labelledby="lab-heading" className="aa2-lab" id="practice-lab">
      <aside className="aa2-lab-rail">
        <p className="aa2-kicker">Bank reconciliation lab</p>
        <p className="aa2-stage-count">Stage {activeStage + 1} of 5</p>
        <ol className="aa2-stage-list">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const state = index < activeStage ? "complete" : index === activeStage ? "current" : "upcoming";
            return (
              <li className={`is-${state}`} key={stage.label}>
                <span><Icon aria-hidden="true" size={20} weight={state === "current" ? "fill" : "regular"} /></span>
                <strong>{index + 1}</strong>
                <p>{stage.label}</p>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="aa2-lab-workspace">
        <header className="aa2-lab-intro">
          <p className="aa2-kicker">Synthetic practice</p>
          <h2 id="lab-heading">Resolve the missing evidence</h2>
          <p>The ledger and statement differ by one deposit. Decide what the agent should prepare—and what must wait for a reviewer.</p>
        </header>

        <div className="aa2-lab-evidence">
          <h3>Evidence</h3>
          <div>
            {["Bank statement · May 2026", "General ledger · May 2026", "Prior reconciliation · April 2026"].map((item, index) => (
              <article key={item}>
                {index === 0 ? <FileText size={22} /> : index === 1 ? <LinkSimple size={22} /> : <ShieldCheck size={22} />}
                <span>{item}</span><CheckCircle aria-label="Available" size={18} weight="fill" />
              </article>
            ))}
          </div>
        </div>

        <ol aria-label="Practice workflow" className="aa2-lab-flow">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return <li className={index === activeStage ? "is-current" : index < activeStage ? "is-complete" : ""} key={stage.label}><span><Icon size={23} weight={index === activeStage ? "fill" : "regular"} /></span><strong>{stage.label}</strong><small>{index === 2 ? "One deposit is unexplained." : index === 3 ? "Agent prepares what it can." : index === 4 ? "Reviewer decides next steps." : ""}</small></li>;
          })}
        </ol>

        <div className="aa2-tieout">
          <h3>Tie-out <span>(May 2026)</span></h3>
          <div className="aa2-tieout-scroll table-wrap">
            <table>
              <caption className="sr-only">Synthetic May 2026 bank statement and general ledger tie-out</caption>
              <thead>
                <tr><th colSpan={5}>Bank statement</th><th colSpan={5}>General ledger</th></tr>
                <tr>{["Date", "Description", "Deposits", "Withdrawals", "Balance", "Date", "Description", "Deposits", "Withdrawals", "Balance"].map((heading) => <th key={heading}>{heading}</th>)}</tr>
              </thead>
              <tbody>
                {entries.map((entry) => <tr className={entry[0] === "May 15" ? "aa2-exception-row" : ""} key={`${entry[0]}-${entry[1]}`}>{entry.map((cell, index) => <td key={`${cell}-${index}`}>{cell}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <p className="aa2-difference"><WarningDiamond size={19} weight="fill" /> 1 difference identified</p>
        </div>
      </div>

      <aside className="aa2-lab-inspector">
        <p className="aa2-kicker">Exception details</p>
        <div className="aa2-exception-card"><WarningDiamond size={28} weight="fill" /><div><strong>Deposit in transit · $4,860</strong><span>May 15, 2026</span></div></div>
        <h3>Why this is an exception</h3>
        <p>The bank shows a deposit on May 15 that does not appear in the general ledger. Until the source is verified and recorded, the balances will not tie.</p>
        <h3>What’s needed</h3>
        <ul><li>Deposit slip or remittance advice</li><li>Bank correspondence or email confirmation</li><li>Related customer reference</li></ul>
        <div className="aa2-lab-actions">
          <button className="aa2-outline-action" onClick={() => setAction("evidence")} type="button">Request evidence <ArrowRight size={19} /></button>
          <button className="aa2-primary-action" onClick={() => setAction("packet")} type="button">Prepare reviewer packet <ArrowRight size={19} /></button>
        </div>
        <div aria-live="polite" className="aa2-lab-response">
          {action === "evidence" && "Evidence request drafted. No accounting conclusion or posting has been made."}
          {action === "packet" && "Reviewer packet prepared with the exception and requested evidence. A reviewer still decides the disposition."}
        </div>
        <div className="aa2-lab-source"><p>Source</p><Link href="/atlas">Trace this in the Atlas <ArrowSquareOut aria-hidden="true" size={17} /></Link></div>
      </aside>
    </section>
  );
}
