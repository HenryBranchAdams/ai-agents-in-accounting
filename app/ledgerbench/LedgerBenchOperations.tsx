import { ledgerBenchLinks, ledgerBenchProgram } from "../ledgerbench-data";

export function LedgerBenchOperations() {
  return (
    <>
      <section id="admission">
        <h2>A task earns admission</h2>
        <ol className="numbered-records">
          {ledgerBenchProgram.task_admission.map((stage) => (
            <li key={stage.id}>
              <strong>{stage.order}. {stage.name}</strong>
              <span>{stage.gate}</span>
            </li>
          ))}
        </ol>
        <p>
          Gold truth is an acceptance model, not one privileged narrative. It
          combines invariants, tolerances, valid alternatives, required evidence,
          reviewer criteria, materiality, and hard exclusions.
        </p>
      </section>

      <section id="integrity">
        <h2>Keep the official test genuinely unseen</h2>
        <p>
          Every official episode receives exactly one primary split. Related
          economic events, root causes, companies, templates, contracts, policies,
          workpapers, generators, and calculations stay grouped across splits.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">LedgerBench evaluation splits</caption>
            <thead><tr><th>Split</th><th>Visibility</th><th>Unseen factor</th></tr></thead>
            <tbody>
              {ledgerBenchProgram.split_policy.splits.map((split) => (
                <tr key={split.id}>
                  <th scope="row">{split.id}</th>
                  <td>{split.visibility}</td>
                  <td>{split.unseen_factor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Predeclare the statistical plan</h3>
        <ul>
          {ledgerBenchProgram.statistical_principles.map((item) => <li key={item}>{item}</li>)}
        </ul>

        <h3>Verification states</h3>
        <dl className="term-list">
          {ledgerBenchProgram.submission_program.statuses.map((status) => (
            <div key={status.id}><dt>{status.id}</dt><dd>{status.meaning}</dd></div>
          ))}
        </dl>
        <p>
          The official comparison defaults to Verified and Audited results.
          Self-reported runs remain visible only when clearly labeled.
        </p>
      </section>

      <section id="governance">
        <h2>Govern the measurement independently</h2>
        <div className="baseline-columns">
          {ledgerBenchProgram.governance.map((body) => (
            <article key={body.id}>
              <h3>{body.name}</h3>
              <p>{body.responsibility}</p>
            </article>
          ))}
        </div>
        <p>
          A majority of decision-makers should be independent of active
          submitters. Hidden-test access must be role-limited and logged.
          Sponsors receive no privileged task access, result treatment, or
          scoring control.
        </p>
      </section>

      <section id="release">
        <h2>Proposed first official release</h2>
        <p>{ledgerBenchProgram.first_release.reporting_basis}.</p>
        <div className="corpus-summary">
          {ledgerBenchProgram.first_release.episode_plan.map((item) => (
            <div key={item.track}>
              <strong>
                {"official_hidden_episodes" in item
                  ? item.official_hidden_episodes
                  : "official_hidden_sequences" in item
                    ? item.official_hidden_sequences
                    : item.public_episodes}
              </strong>
              <span>{item.track}</span>
            </div>
          ))}
        </div>
        <ul>
          <li>At least {ledgerBenchProgram.first_release.minimum_operating_models} distinct operating models.</li>
          <li>At least {ledgerBenchProgram.first_release.minimum_organizational_contexts} organizational contexts.</li>
          <li>{ledgerBenchProgram.first_release.human_baseline}</li>
        </ul>

        <h3>Launch only when the gates are real</h3>
        <ul>
          {ledgerBenchProgram.launch_gates.map((gate) => <li key={gate}>{gate}</li>)}
        </ul>
      </section>

      <section id="precedents">
        <h2>Practices adapted from established programs</h2>
        <div className="doc-link-list">
          {ledgerBenchProgram.precedents.map((precedent) => (
            <a href={precedent.source} key={precedent.id} rel="noreferrer" target="_blank">
              <strong>{precedent.name}</strong>
              <span>{precedent.practice_adopted}</span>
            </a>
          ))}
        </div>
        <p>
          These precedents inform program design. They do not validate
          LedgerBench itself. The Preview must still complete independent
          accounting-practice, measurement-science, and evaluation-integrity
          review before an official leaderboard launches.
        </p>
      </section>

      <section id="machine">
        <h2>Open program contracts</h2>
        <div className="doc-link-list">
          <a href={ledgerBenchLinks.api}><strong>Program API</strong><span>Complete structured Preview record and canonical links.</span></a>
          <a href={ledgerBenchLinks.markdown}><strong>Program Markdown</strong><span>Portable human- and agent-readable program record.</span></a>
          <a href={ledgerBenchLinks.program_schema}><strong>Program schema</strong><span>Measurement-program record contract.</span></a>
          <a href={ledgerBenchLinks.episode_schema}><strong>Episode schema</strong><span>Atomic accounting evaluation contract.</span></a>
          <a href={ledgerBenchLinks.result_schema}><strong>Candidate-result schema</strong><span>Evidence, calculations, findings, proposed effects, actions, artifacts, and run record.</span></a>
          <a href={ledgerBenchLinks.submission_schema}><strong>Submission schema</strong><span>Candidate disclosure, budget, result digests, verification request, and rights declaration.</span></a>
        </div>
        <div className="note">
          <p className="note-title">Preview boundary</p>
          <p>
            This release establishes the program constitution and machine
            contracts. It does not publish an official item bank, hidden round,
            independently validated judge, or model ranking.
          </p>
        </div>
      </section>
    </>
  );
}
