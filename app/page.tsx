import Link from "next/link";
import { ArrowRightIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { LearningPathExplorer } from "./LearningPathExplorer";
import { SiteHeader } from "./SiteHeader";
import { resources } from "./resources-data";
import { accountingAgentsStartHere } from "./start-here";
import { workflowRecords } from "./workflows-data";

export default function OverviewPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader active="/" />

      <main className="aa2-home" id="main-content">
        <section aria-labelledby="aa2-home-title" className="aa2-hero">
          <div className="aa2-hero-copy">
            <h1 id="aa2-home-title">Build your first governed accounting agent.</h1>
            <p>
              Learn the boundary. Work a synthetic case. Leave with a reviewer-ready plan.
            </p>
            <div className="aa2-hero-actions">
              <Link className="aa2-button aa2-button-primary" href="/start-here">
                Start in five minutes <ArrowRightIcon aria-hidden="true" size={20} />
              </Link>
              <Link className="aa2-button aa2-button-secondary" href="/tutorials/bank-reconciliation">
                Practice bank reconciliation <ArrowRightIcon aria-hidden="true" size={20} />
              </Link>
            </div>
            <p className="aa2-boundary-note">
              <ShieldCheckIcon aria-hidden="true" size={22} weight="regular" />
              Agents prepare work. People approve conclusions and sensitive actions.
            </p>
          </div>

          <LearningPathExplorer
            rolePaths={accountingAgentsStartHere.audience_paths}
            sourceCount={resources.length}
            workflowCount={workflowRecords.length}
          />
        </section>
      </main>
    </>
  );
}
