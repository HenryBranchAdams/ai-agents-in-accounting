import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";

const description = "How sources enter the corpus, how claims are bounded, how records are reviewed, and how corrections become releases.";

export const metadata = docsMetadata("Methodology", description, "/methodology");

export default function MethodologyPage() {
  return (
    <DocsShell
      active="/methodology"
      category="Project"
      title="Methodology"
      description={description}
      headerImage={{ src: "/images/editorial/options/20-professional-learning.jpg", alt: "A quiet study field of documents, review marks, and structured learning paths." }}
      toc={[
        { href: "#admission", label: "Source admission" },
        { href: "#claims", label: "Claim discipline" },
        { href: "#review", label: "Review states" },
        { href: "#evaluation", label: "Evaluation method" },
        { href: "#corrections", label: "Corrections" },
      ]}
      previous={{ href: "/spec", label: "Public specification" }}
      next={{ href: "/changes", label: "Changes" }}
    >
      <section id="admission">
        <h2>Source admission</h2>
        <p>
          Prefer primary standards, regulations, official guidance, research
          papers, specifications, and first-party implementation evidence.
          Thought pieces and practice examples are useful for framing and
          pattern discovery, but their source type remains visible and they do
          not become neutral authority by inclusion.
        </p>
        <ul>
          <li>Record publisher, title, date or status, jurisdiction, access, source type, canonical URL, and verification date.</li>
          <li>Write an original summary; do not republish the source.</li>
          <li>Keep rights status unknown until a first-party grant or legal basis is recorded.</li>
          <li>Retain contrary evidence and applicability limits.</li>
        </ul>
      </section>

      <section id="claims">
        <h2>Claim discipline</h2>
        <p>
          Records separate evidence, observation, claim, judgment, and decision.
          Workflow source links name the exact claim they support and the section
          where it appears. A source link is not evidence that every sentence on
          a page is correct or current.
        </p>
      </section>

      <section id="review">
        <h2>Review states</h2>
        <dl className="term-list">
          <div><dt>Maintainer reviewed</dt><dd>Structure, links, rights boundary, language, and integrity checks were reviewed for publication.</dd></div>
          <div><dt>Subject-matter reviewed</dt><dd>A named or designated reviewer assessed a material domain claim within an explicit scope.</dd></div>
          <div><dt>Independent reviewed</dt><dd>Used only when a distinct reviewer and review evidence are recorded. It is not an automatic label.</dd></div>
          <div><dt>Professional sign-off</dt><dd>Not asserted by this public corpus.</dd></div>
        </dl>
      </section>

      <section id="evaluation">
        <h2>Evaluation method</h2>
        <p>
          Deterministic checks cover schemas, arithmetic, dates, population
          totals, identifiers, evidence links, exception visibility, and action
          state. Expert review covers accounting support, contrary evidence,
          proposed-versus-executed separation, and reviewer usefulness. Hard
          authority failures make a run non-conformant.
        </p>
      </section>

      <section id="corrections">
        <h2>Corrections and releases</h2>
        <p>
          Substantive corrections create a new immutable release with a change
          entry and compatibility note. Stable IDs are not reassigned. A record
          can be corrected, superseded, withdrawn, or access-limited while its
          prior history remains attributable when safe and lawful.
        </p>
      </section>
    </DocsShell>
  );
}
