import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { glossary } from "../reference-data";

const description = "Use a shared vocabulary for accounting-agent workflows, evidence, authority, controls, tools, approvals, and operations.";

export const metadata = {
  ...docsMetadata("Glossary", description, "/glossary"),
  alternates: {
    canonical: "/glossary",
    types: { "application/json": "/api/v1/glossary", "text/markdown": "/glossary.md" },
  },
};

const sortedGlossary = [...glossary].sort((a, b) => a.term.localeCompare(b.term, "en", { numeric: true }));
const entryByTerm = new Map(glossary.map((entry) => [entry.term.toLowerCase(), entry]));
const glossaryGroups = [...sortedGlossary.reduce((groups, entry) => {
  const letter = entry.term[0]?.toUpperCase() ?? "#";
  const current = groups.get(letter) ?? [];
  current.push(entry);
  groups.set(letter, current);
  return groups;
}, new Map<string, typeof glossary>()).entries()];

export default function GlossaryPage() {
  return (
    <DocsShell
      active="/glossary"
      category="Reference"
      title="Glossary"
      description={description}
      jsonHref="/api/v1/glossary"
      markdownHref="/glossary.md"
      toc={[
        { href: "#usage", label: "Usage" },
        { href: "#terms", label: "Terms" },
        { href: "#boundary", label: "Language boundary" },
      ]}
      previous={{ href: "/templates", label: "Templates and checklists" }}
      next={{ href: "/resources", label: "Source library" }}
    >
      <section id="usage">
        <h2>Use terms as operating definitions</h2>
        <p>
          Shared language reduces ambiguity between accounting, audit, risk,
          security, product, data, and engineering teams. Put the applicable
          terms in workflow specifications, authority matrices, evaluation plans,
          workpapers, incidents, and approval interfaces.
        </p>
        <nav className="alphabet-index" aria-label="Glossary letters">
          {glossaryGroups.map(([letter]) => (
            <a href={`#glossary-${letter.toLowerCase()}`} key={letter}>{letter}</a>
          ))}
        </nav>
      </section>

      <section id="terms">
        <h2>{glossary.length} defined terms</h2>
        <div className="glossary-groups">
          {glossaryGroups.map(([letter, entries]) => (
            <section aria-labelledby={`glossary-${letter.toLowerCase()}-heading`} id={`glossary-${letter.toLowerCase()}`} key={letter}>
              <h3 id={`glossary-${letter.toLowerCase()}-heading`}>{letter}</h3>
              <dl className="glossary-list">
                {entries.map((entry) => (
                  <div key={entry.id}>
                    <dt id={entry.id}>{entry.term}</dt>
                    <dd>
                      <p>{entry.definition}</p>
                      {entry.related.length > 0 && (
                        <p className="related-terms">
                          <span>Related</span>
                          {entry.related.map((term) => {
                            const relatedEntry = entryByTerm.get(term.toLowerCase());
                            return relatedEntry
                              ? <a href={`#${relatedEntry.id}`} key={term}>{term}</a>
                              : <span key={term}>{term}</span>;
                          })}
                        </p>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </section>

      <section id="boundary">
        <h2>Language does not assign authority</h2>
        <p>
          A label such as “autonomous,” “approved,” “audited,” “compliant,” or
          “certified” can hide the actual actor and decision. Name the smallest
          action, the assigned authority level, the accountable person, the
          deterministic control, and the retained evidence instead.
        </p>
        <div className="note">
          <p className="note-title">Prefer precise statements</p>
          <p>
            “The agent prepared a draft reconciliation under A1 and the named
            reviewer approved it” is more useful than “the AI completed the reconciliation.”
          </p>
        </div>
      </section>
    </DocsShell>
  );
}
