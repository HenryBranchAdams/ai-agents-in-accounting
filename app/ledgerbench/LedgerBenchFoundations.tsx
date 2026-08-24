import { ledgerBenchProgram } from "../ledgerbench-data";

export function LedgerBenchFoundations() {
  return (
    <>
      <section id="claim">
        <div className="record-heading-row record-heading-intro">
          <h2>Begin with the claim, not the leaderboard</h2>
          <span className="controlling-boundary">
            <small>Program status</small>
            <strong>{ledgerBenchProgram.status}</strong>
          </span>
        </div>
        <p>{ledgerBenchProgram.mission}</p>
        <div className="note">
          <p className="note-title">Measurement claim</p>
          <p>{ledgerBenchProgram.measurement_claim}</p>
        </div>
        <dl className="record-facts">
          <div><dt>Unit under test</dt><dd>{ledgerBenchProgram.unit_under_test}</dd></div>
          <div><dt>Unit of evaluation</dt><dd>{ledgerBenchProgram.unit_of_evaluation.name}</dd></div>
          <div><dt>Program version</dt><dd>{ledgerBenchProgram.version}</dd></div>
          <div><dt>Review state</dt><dd>Maintainer-reviewed Preview; independent program bodies are not yet constituted.</dd></div>
        </dl>
        <p>{ledgerBenchProgram.unit_of_evaluation.definition}</p>
        <h3>What a result does not establish</h3>
        <ul>
          {ledgerBenchProgram.non_claims.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section id="products">
        <h2>Four products answer four different questions</h2>
        <div className="baseline-columns">
          {ledgerBenchProgram.products.map((product) => (
            <article key={product.id}>
              <h3>{product.name}</h3>
              <p>{product.question}</p>
              <p><strong>Output:</strong> {product.result}</p>
              <p><strong>Competitive ranking:</strong> {product.ranking ? "Yes" : "No"}</p>
            </article>
          ))}
        </div>
        <div className="note note-warning">
          <p className="note-title">Do not collapse the products</p>
          <p>
            Capability, conformance, field utility, and grader validity require
            different evidence. A system can be capable but non-conformant,
            conformant but weak, or useful in one field setting without supporting
            a universal deployment claim.
          </p>
        </div>
      </section>

      <section id="tracks">
        <h2>Measure increasing horizons of work</h2>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">LedgerBench tracks</caption>
            <thead>
              <tr><th>Track</th><th>Human horizon</th><th>Status</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              {ledgerBenchProgram.tracks.map((track) => (
                <tr key={track.id}>
                  <th scope="row">{track.name}</th>
                  <td>{track.human_horizon}</td>
                  <td>{track.status}</td>
                  <td>{track.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Keep comparison conditions explicit</h3>
        <div className="baseline-columns">
          {ledgerBenchProgram.divisions.map((division) => (
            <article key={division.id}>
              <h3>{division.name}</h3>
              <p>{division.purpose}</p>
              <p><strong>Human intervention:</strong> {division.human_intervention}</p>
              <p><strong>Comparability:</strong> {division.comparability}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="universe">
        <h2>Sample from accounting work, not a convenient question list</h2>
        <p>
          Every episode is classified across domain, behavior, evidence condition,
          human time horizon, authority exposure, consequence, and operating
          context. An official release must publish its coverage and omissions.
        </p>
        <div className="baseline-columns">
          <article>
            <h3>Domains</h3>
            <ul>{ledgerBenchProgram.task_universe.domains.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <h3>Evidence conditions</h3>
            <ul>{ledgerBenchProgram.task_universe.evidence_conditions.map((item) => <li key={item}>{item.replaceAll("_", " ")}</li>)}</ul>
          </article>
          <article>
            <h3>Time horizons</h3>
            <ul>{ledgerBenchProgram.task_universe.time_horizons.map((item) => <li key={item}>{item.replaceAll("_", " ")}</li>)}</ul>
          </article>
          <article>
            <h3>Authority exposures</h3>
            <ul>{ledgerBenchProgram.task_universe.authority_exposures.map((item) => <li key={item}>{item.replaceAll("_", " ")}</li>)}</ul>
          </article>
        </div>
      </section>
    </>
  );
}
