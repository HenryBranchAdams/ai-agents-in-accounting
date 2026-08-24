import { ledgerBenchProgram } from "../ledgerbench-data";

export function LedgerBenchScoring() {
  return (
    <>
      <section id="scoring">
        <h2>Accepted work is the primary outcome</h2>
        <div className="corpus-summary">
          <div><strong>AWR</strong><span>Accepted Work Rate</span></div>
          <div><strong>{ledgerBenchProgram.capability_dimensions.length}</strong><span>diagnostic dimensions</span></div>
          <div><strong>{ledgerBenchProgram.hard_gates.length}</strong><span>hard gates</span></div>
        </div>
        <p>{ledgerBenchProgram.primary_metric.definition}</p>
        <ol className="numbered-records">
          {ledgerBenchProgram.primary_metric.episode_acceptance_conditions.map((item) => (
            <li key={item}><strong>Required</strong><span>{item}</span></li>
          ))}
        </ol>

        <h3>Hard gates cannot be averaged away</h3>
        <div className="baseline-columns">
          {ledgerBenchProgram.hard_gates.map((gate) => (
            <article key={gate}>
              <h3>{gate.replaceAll("_", " ")}</h3>
              <p>Any occurrence makes the episode non-conformant regardless of other quality.</p>
            </article>
          ))}
        </div>

        <h3>Publish the whole capability profile</h3>
        <dl className="term-list">
          {ledgerBenchProgram.capability_dimensions.map((dimension) => (
            <div key={dimension.id}>
              <dt>{dimension.name}</dt>
              <dd>{dimension.question}</dd>
            </div>
          ))}
        </dl>
        <div className="note">
          <p className="note-title">Quality and cost remain separate</p>
          <p>
            Publish reliability, reviewer minutes, wall time, tokens, tool use,
            compute, declared cost, and cost per accepted episode. Show
            capability–cost frontiers rather than hiding resource use inside one
            composite score.
          </p>
        </div>
      </section>
    </>
  );
}
