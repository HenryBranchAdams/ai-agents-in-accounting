import Link from "next/link";
import { CorpusIcon, InlineArrow, InstrumentIcon } from "./LearningHomeIcons";
import { LearningPathExplorer } from "./LearningPathExplorer";
import { SiteHeader } from "./SiteHeader";
import { contentModeForPath } from "./content-contract";
import { corpusReviewedAt } from "./domain-model";
import { packs } from "./platform-data";
import {
  practiceObservatoryItems,
  practiceObservatoryLanes,
} from "./practice-observatory";
import { readingRoomResources } from "./reading-room-data";
import { templates } from "./reference-data";
import { resourceIndustryFacets, resources } from "./resources-data";
import { accountingAgentsStartHere } from "./start-here";
import { workflowRecords } from "./workflows-data";

const currentSignals = practiceObservatoryItems.slice(0, 3);
const laneLabels = new Map(practiceObservatoryLanes.map((lane) => [lane.id, lane.label]));

function displayDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export default function OverviewPage() {
  const primaryMode = contentModeForPath("/");

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader active="/" />

      <main className="learning-home" id="main-content">
        <header className="learning-hero" id="purpose">
          <p className="learning-eyebrow">Educational field guide</p>
          <div className="learning-hero-copy">
            <div className="learning-reviewed">Reviewed {displayDate(corpusReviewedAt)}</div>
            <h1><span>AI agents</span>{" "}<span>in accounting</span></h1>
            <p>
              Learn how governed agents can prepare accounting work while accountable
              people approve conclusions and sensitive actions.
            </p>
            <Link className="learning-atlas-link" href="/atlas">
              <span className="learning-atlas-link-label">Explore the Living Atlas</span>
              <InlineArrow />
            </Link>
            <p className="learning-atlas-caption">
              <span aria-hidden="true" className="learning-caption-icon"><InlineArrow size={15} /></span>
              Trace one workflow through evidence, controls, sources, and accountable review.
            </p>
          </div>
          <div aria-label="Public corpus instrument" className="learning-hero-instrument" role="img">
            <div className="learning-instrument-core"><InstrumentIcon size={26} type="people" /></div>
            <span className="learning-instrument-label learning-instrument-top">Govern</span>
            <span className="learning-instrument-label learning-instrument-left">Evidence</span>
            <span className="learning-instrument-label learning-instrument-right">Sources</span>
            <span className="learning-instrument-label learning-instrument-bottom">Controls</span>
            <ul className="learning-instrument-legend" aria-label="Public corpus contents">
              <li><InstrumentIcon type="record" /> <span>{resources.length} source records</span></li>
              <li><InstrumentIcon type="workflow" /> <span>{workflowRecords.length} workflow records</span></li>
              <li><InstrumentIcon type="template" /> <span>{templates.length} practical templates</span></li>
              <li><span aria-hidden="true" className="learning-legend-code">&lt;/&gt;</span> <span>Open source</span></li>
            </ul>
          </div>
        </header>

        <LearningPathExplorer
          industries={resourceIndustryFacets}
          rolePaths={accountingAgentsStartHere.audience_paths}
          sourceCount={resources.length}
          templateCount={templates.length}
          workflowCount={workflowRecords.length}
          currentSignals={currentSignals}
          currentSignalCount={practiceObservatoryItems.length}
          laneLabels={laneLabels}
        />

        <div aria-label="Page trust and formats" className="learning-trust-row" role="group">
          <span>
            <time dateTime={corpusReviewedAt}>Reviewed {displayDate(corpusReviewedAt)}</time>
          </span>
          <span>Maintainer-reviewed educational synthesis</span>
          <span
            aria-label={`Primary content mode: ${primaryMode.label}`}
            className="content-mode"
            data-content-mode={primaryMode.id}
            data-primary-mode={primaryMode.id}
          >
            Content mode: <strong>{primaryMode.label}</strong>
          </span>
          <Link href="/resources#method">Source method</Link>
        </div>

        <section className="learning-library" id="ecosystem">
          <div className="learning-section-heading">
            <div>
              <p className="learning-kicker">A durable archive behind every path</p>
              <h2>Learn, practice, and trace the evidence</h2>
              <p>
                An open educational hub for governed agent work, with foundational
                material separated from the dated current signal.
              </p>
            </div>
          </div>

          <ul aria-label="Public corpus coverage" className="learning-corpus">
            <li>
              <Link href="/workflows">
                <CorpusIcon type="workflow" />
                <strong>{workflowRecords.length}</strong>
                <span>workflow records</span>
              </Link>
            </li>
            <li>
              <Link href="/resources">
                <CorpusIcon type="record" />
                <strong>{resources.length}</strong>
                <span>source records</span>
              </Link>
            </li>
            <li>
              <Link href="/reading-room">
                <CorpusIcon type="archive" />
                <strong>{readingRoomResources.length}</strong>
                <span>curated readings</span>
              </Link>
            </li>
            <li>
              <Link href="/templates">
                <CorpusIcon type="template" />
                <strong>{templates.length}</strong>
                <span>practical templates</span>
              </Link>
            </li>
          </ul>

          <div className="builder-strip">
            <p>
              Building or testing a system? Use the <Link href="/packs">{packs.length} synthetic workflow packs</Link>,
              {" "}<Link href="/evaluation">evaluation guide</Link>, and
              {" "}<Link href="/machine-access">read-only machine interfaces</Link>.
            </p>
            <p>
              Benchmark expansion is deferred while the knowledge hub, source archive,
              and practical learning paths take priority.
            </p>
          </div>
        </section>

        <section className="learning-scope" id="scope">
          <div>
            <p className="learning-kicker">Execution boundary</p>
            <h2>Preparation is not approval</h2>
          </div>
          <p>
            The guide can help teams specify objectives, evidence, procedures, checks,
            exceptions, authority, review, and retained records. It does not grant an
            agent authority to post, pay, file, certify, attest, or communicate externally.
          </p>
          <div className="learning-scope-links">
            <Link href="/authority">Authority ladder</Link>
            <Link href="/sensitive-actions">Sensitive actions</Link>
            <Link href="/coverage">Coverage and gaps</Link>
          </div>
        </section>

        <footer className="learning-footer">
          <p>
            Educational material. Original content CC BY 4.0; project metadata and
            synthetic fixtures CC0 1.0; software MIT. External publisher terms apply.
          </p>
          <Link href="/open-source">Open source and reuse</Link>
        </footer>
      </main>
    </>
  );
}
