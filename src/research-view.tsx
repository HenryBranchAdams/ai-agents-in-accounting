import { Badge } from "./components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { intersperse } from "./components/content";
import {
  researchView,
  researchSummary,
  classificationRelationships,
} from "./research";
import { getRecord } from "./corpus";
import { displayText as esc } from "./components/format";
import { coverageTopology } from "./coverage";
const industryTitle = (code: string) =>
  coverageTopology.industry_backbone.nodes.find((n) => n.code === code)
    ?.title || code;
const familyTitle = (id: string) =>
  coverageTopology.question_families.find((f) => f.id === id)?.title || id;
export function researchPanel(view: ReturnType<typeof researchView>) {
  const s = researchSummary,
    p = view.profile;
  return (
    <>
      <section className="my-8" id="research-results">
        <h2>{"Reviewed questions and open work"}</h2>
        {"\n "}
        <p>
          {s.named_research_questions}
          {
            " named questions across all 62 families have bounded answers or recorded evidence gaps. The "
          }
          {s.screening_pairs.toLocaleString("en-US")}
          {" screening decisions comprise "}
          {s.applicability_counts["applicable-to-profile"]}
          {" relevant to the stated profile, "}
          {s.applicability_counts.conditional}
          {" conditional and "}
          {s.applicability_counts["excluded-for-stated-role"]}
          {
            " exclusions from a stated role. No whole family or industry is marked sufficient."
          }
        </p>
        {"\n "}
        <p>
          {"All "}
          {s.inherited_source_reviews + s.inherited_editorial_reviews}
          {" inherited records have review dispositions: "}
          {s.source_access_levels["substantive-excerpt"]}
          {" source excerpts, "}
          {s.source_access_levels["abstract-or-landing"]}
          {" abstracts or landing pages, "}
          {s.source_access_levels["attempted-unresolved"]}
          {" unresolved access attempts, and "}
          {s.inherited_editorial_reviews}
          {" editorial reviews. These are different depths of review."}
        </p>
        {"\n "}
        {p ? (
          <>
            <h3>
              {esc(p.code)}
              {" · "}
              {esc(p.title)}
            </h3>
            <p>{esc(view.screening_scope)}</p>
            <p>
              <a href={"/records/" + esc(p.guide_id)}>
                {"Read the business profile and workflow →"}
              </a>
            </p>
            <div className="screening-list">
              {view.screening.map((c) => (
                <>
                  <details>
                    <summary>
                      {esc(familyTitle(c.family_id))}{" "}
                      <div className="mt-2">
                        <Badge variant="outline">
                          {esc(c.applicability.replaceAll("-", " "))}
                        </Badge>
                      </div>
                    </summary>
                    <p>{esc(c.rationale)}</p>
                    <p>
                      <strong>{"Evidence outcome:"}</strong>{" "}
                      {esc(c.evidence_outcome.replaceAll("-", " "))}
                      {". "}
                      {esc(c.accounting_adequacy)}
                    </p>
                    <p>
                      <strong>{"Facts required:"}</strong>{" "}
                      {c.required_facts.map(esc).join("; ")}
                      {"."}
                    </p>
                    <p>
                      <strong>{"Counterexample:"}</strong>{" "}
                      {esc(c.scope_counterexample)}
                    </p>
                    {c.open_question ? (
                      <>
                        <p>
                          <strong>{"Open question:"}</strong>{" "}
                          {esc(c.open_question)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong>{"Reopen this exclusion when:"}</strong>{" "}
                          {esc(c.exclusion_reopen_trigger)}
                        </p>
                      </>
                    )}
                    <ul>
                      {c.named_question_ids.map((id) => {
                        const q = view.named_questions.find((q) => q.id === id);
                        return q ? (
                          <>
                            <li>
                              <a
                                href={
                                  "/records/" +
                                  esc(q.record_id) +
                                  "#" +
                                  esc(q.id)
                                }
                              >
                                {esc(q.question)}
                              </a>
                              {" · "}
                              {esc(q.assessment_status)}
                            </li>
                          </>
                        ) : (
                          ""
                        );
                      })}
                    </ul>
                  </details>
                </>
              ))}
            </div>
          </>
        ) : (
          <>
            <Alert role="note">
              <AlertTitle>Choose a research scope</AlertTitle>
              <AlertDescription>
                Select a subsector above to inspect all 62 decisions and its
                individual detailed-industry reviews. Select a question family
                to read its named answers.
              </AlertDescription>
            </Alert>
          </>
        )}
        {"\n "}
        <details
          className="my-6"
          {...(view.named_questions.length < 12 ? { open: true } : {})}
        >
          <summary>
            {view.named_questions.length}
            {" named questions in this research view"}
          </summary>
          <p>{esc(view.broader_family_questions_note)}</p>
          <ul>
            {view.named_questions.map((q) => (
              <>
                <li>
                  <a href={"/records/" + esc(q.record_id) + "#" + esc(q.id)}>
                    {esc(q.question)}
                  </a>{" "}
                  <small>
                    {esc(q.assessment_status)}
                    {" · "}
                    {esc(q.answer_status.replaceAll("-", " "))}
                  </small>
                </li>
              </>
            ))}
          </ul>
        </details>
        {"\n "}
        {view.leaf_reviews.length ? (
          <>
            <section id="leaf-reviews">
              <h3>
                {view.leaf_reviews.length}
                {" detailed-industry exception reviews"}
              </h3>
              <p>
                {
                  "These individually inspected definitions and original research implications establish a screening result, not full accounting coverage."
                }
              </p>
              {view.leaf_reviews.map((l) => (
                <>
                  <details id={esc(l.id)}>
                    <summary>
                      {esc(l.industry_code)}
                      {" · "}
                      {esc(industryTitle(l.industry_code))}{" "}
                      <div className="mt-2">
                        <Badge variant="outline">
                          {esc(l.exception_outcome.replaceAll("-", " "))}
                        </Badge>
                      </div>
                    </summary>
                    <p>{esc(l.classification_facts)}</p>
                    <p>{esc(l.rationale)}</p>
                    <ul>
                      {l.additional_questions.map((q) => (
                        <>
                          <li>{esc(q)}</li>
                        </>
                      ))}
                    </ul>
                    <p>{esc(l.accounting_evidence_outcome)}</p>
                    <p>
                      <a href="/records/src_roadmap_naics2022_manual">
                        {"Census classification source"}
                      </a>
                      {" · "}
                      {esc(
                        typeof l.definition_locator === "string"
                          ? l.definition_locator
                          : l.definition_locator.heading,
                      )}
                      {typeof l.definition_locator !== "string" &&
                      "pdf_page" in l.definition_locator
                        ? `, PDF page ${esc(l.definition_locator.pdf_page)}`
                        : ""}
                      {". "}
                      {l.remaining_gaps.map(esc).join(" ")}
                    </p>
                    <a
                      href={
                        "/coverage?industry=" +
                        esc(l.industry_code) +
                        "#leaf-reviews"
                      }
                    >
                      {"Link to this industry review"}
                    </a>
                  </details>
                </>
              ))}
            </section>
          </>
        ) : (
          ""
        )}
        {"\n "}
        <details>
          <summary>{"Declared scope, criteria and downloads"}</summary>
          <p>{esc(view.criteria.method)}</p>
          <p>
            {
              "Seven research dimensions are recorded per named question. Source currency, professional review, empirical support and reuse rights stay separate. "
            }
            {s.screening_open_pairs}
            {" applicable or conditional pairs and "}
            {s.leaf_additional_question_count}
            {
              " leaf-level questions remain visible in their respective populations; these are overlapping units and must not be added into one completion percentage."
            }
          </p>
          <p>
            {
              "Selected jurisdiction packages: Texas and California construction/public works, UK construction/services, and Canada with Ontario GST/HST. This is a declared footprint, not worldwide coverage."
            }
          </p>
          <ul>
            {Object.entries(view.downloads).map(([name, path]) => (
              <>
                <li>
                  <a href={esc(path)}>{esc(name)}</a>
                </li>
              </>
            ))}
            <li>
              <a href="/downloads/source-reviews.json">
                {"Inherited source reviews"}
              </a>
            </li>
            <li>
              <a href="/downloads/editorial-reviews.json">
                {"Inherited editorial reviews"}
              </a>
            </li>
          </ul>
          <h3>{"Verified classification relationships"}</h3>
          {classificationRelationships.relationships.map((r) => (
            <>
              <p>
                {esc(r.left.edition)} {esc(r.left.code)}
                {" → "}
                {esc(r.right.edition)} {esc(r.right.code)}
                {": "}
                {esc(r.relationship_type)}
                {". "}
                {r.limits.map(esc).join(" ")}{" "}
                {intersperse(
                  r.source_ids.map((id) => (
                    <>
                      <a href={"/records/" + esc(id)}>
                        {esc(getRecord(id)?.title || id)}
                      </a>
                    </>
                  )),
                  " · ",
                )}
              </p>
            </>
          ))}
        </details>
      </section>
    </>
  );
}
