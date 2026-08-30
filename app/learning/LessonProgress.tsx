"use client";

import { ArrowCounterClockwise, CheckCircle, Info } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type ProgressRecord = {
  version: 1;
  reviewed: boolean;
};

const storagePrefix = "accounting-agents-learning-v1:";

type LessonProgressProps = {
  lessonId: string;
  label?: string;
};

export function LessonProgress({ lessonId, label = "Mark lesson reviewed" }: LessonProgressProps) {
  const storageKey = `${storagePrefix}${lessonId}`;
  const [reviewed, setReviewed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const value = window.localStorage.getItem(storageKey);
        if (value) {
          const parsed = JSON.parse(value) as ProgressRecord;
          setReviewed(parsed.version === 1 && parsed.reviewed === true);
        }
      } catch {
        // Progress is optional and intentionally stays local to this browser.
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  function setProgress(next: boolean) {
    setReviewed(next);
    try {
      if (next) {
        window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, reviewed: true } satisfies ProgressRecord));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Keep the current browser-session interaction useful when storage is unavailable.
    }
  }

  return (
    <section aria-label="Lesson progress" className="aa2-device-progress">
      <div className="aa2-device-progress-heading">
        <h2>On this device</h2>
        <Info aria-label="Progress stays in this browser and is not a completion credential." size={18} weight="bold" />
      </div>
      <p>Private learning markers only. Nothing is sent, shared, or certified.</p>
      <label className="aa2-progress-toggle">
        <input
          checked={ready && reviewed}
          onChange={(event) => setProgress(event.target.checked)}
          type="checkbox"
        />
        <span>{label}</span>
      </label>
      {ready && reviewed && (
        <p className="aa2-progress-confirmation"><CheckCircle size={18} weight="fill" /> Review marker saved in this browser.</p>
      )}
      <button className="aa2-quiet-button" onClick={() => setProgress(false)} type="button">
        <ArrowCounterClockwise size={17} /> Reset this lesson
      </button>
    </section>
  );
}
