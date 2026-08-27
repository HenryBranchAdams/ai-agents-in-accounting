"use client";

import { useState } from "react";
import type { StartHereKnowledgeQuestion } from "../start-here";

type KnowledgeCheckProps = {
  questions: readonly StartHereKnowledgeQuestion[];
  completionId: string;
  completionTitle: string;
  completionStatements: readonly string[];
  interpretationBoundary: string;
};

export function KnowledgeCheck({
  questions,
  completionId,
  completionTitle,
  completionStatements,
  interpretationBoundary,
}: KnowledgeCheckProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const score = questions.filter(
    (question) => answers[question.id] === question.correct_option_id,
  ).length;
  const complete = score === questions.length;

  function reset() {
    setAnswers({});
    setChecked(false);
  }

  return (
    <form
      className="knowledge-check"
      onSubmit={(event) => {
        event.preventDefault();
        setChecked(true);
      }}
    >
      {questions.map((question, questionIndex) => {
        const selected = answers[question.id];
        const isCorrect = selected === question.correct_option_id;
        return (
          <fieldset id={question.id} key={question.id}>
            <legend>
              <span>{String(questionIndex + 1).padStart(2, "0")}</span>
              {question.prompt}
            </legend>
            {question.options.map((option) => (
              <label key={option.id}>
                <input
                  checked={selected === option.id}
                  name={question.id}
                  onChange={() => {
                    setAnswers((current) => ({ ...current, [question.id]: option.id }));
                    setChecked(false);
                  }}
                  type="radio"
                  value={option.id}
                />
                <span>{option.label}</span>
              </label>
            ))}
            {checked && (
              <p className={isCorrect ? "check-feedback check-feedback-correct" : "check-feedback"}>
                {isCorrect ? question.correct_feedback : question.incorrect_feedback}
              </p>
            )}
          </fieldset>
        );
      })}

      <div className="knowledge-check-actions">
        <button type="submit">Check answers</button>
        <button onClick={reset} type="button">Reset</button>
      </div>

      <div aria-live="polite" className="knowledge-check-result">
        {checked && (
          <>
            <p><strong>{score} of {questions.length} correct.</strong> {complete ? "Orientation complete." : "Review the feedback and try again."}</p>
            {complete && (
              <div className="completion-artifact" id={completionId}>
                <h3>{completionTitle}</h3>
                <ul>{completionStatements.map((statement) => <li key={statement}>{statement}</li>)}</ul>
                <p>{interpretationBoundary}</p>
              </div>
            )}
          </>
        )}
      </div>
    </form>
  );
}
