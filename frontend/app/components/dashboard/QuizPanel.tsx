"use client";

import type { Question, QuizCategory } from "./data/types";

type QuizPanelProps = {
  category: QuizCategory | null;
  questions: Question[];
  index: number;
  answers: number[];
  done: boolean;
  score: number;
  onStart: (category: QuizCategory) => void;
  onAnswer: (answer: number) => void;
  onReset: () => void;
};

export function QuizPanel({
  category,
  questions,
  index,
  answers,
  done,
  score,
  onStart,
  onAnswer,
  onReset,
}: QuizPanelProps) {
  if (!category)
    return (
      <>
        <PageIntro
          eyebrow="Knowledge check"
          title="Practice with purpose"
          text="Build confidence in the topics that matter on test day. Every quiz is a fresh set of questions."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [
              "Driving theory",
              "10 questions · Road rules and safe driving",
              "theory",
            ],
            ["Road signs", "10 questions · Signs and markings", "signs"],
            [
              "Intersections",
              "10 questions · Junction awareness",
              "intersections",
            ],
            [
              "Final mock test",
              "34 questions · 20 theory · 10 signs · 4 intersections",
              "final",
            ],
          ].map(([title, detail, value], index) => (
            <button
              className={`rounded-lg border p-5 text-left transition hover:border-primary sm:p-7 ${value === "final" ? "border-primary bg-primary text-white" : "border-border bg-surface"}`}
              type="button"
              key={value}
              onClick={() => onStart(value as QuizCategory)}
            >
              <span className="text-xs font-bold">
                {value === "final" ? "★" : `0${index + 1}`}
              </span>
              <h2 className="mt-6 font-display text-xl font-semibold">
                {title}
              </h2>
              <p className="mt-2 text-xs text-text-secondary">{detail}</p>
              <span className="mt-6 block text-xs font-bold">Start quiz →</span>
            </button>
          ))}
        </div>
      </>
    );
  if (done)
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        score={score}
        onReset={onReset}
      />
    );
  const question = questions[index];
  return (
    <>
      <PageIntro
        eyebrow={`${category} · Question ${index + 1} of ${questions.length}`}
        title="Take your time"
        text="Choose the answer that feels safest. There is no time limit."
      />
      <section className="mx-auto max-w-3xl rounded-lg border border-border bg-surface p-5 sm:p-8">
        <div className="h-1.5 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <h2 className="mt-8 font-display text-2xl font-semibold leading-tight">
          {question.prompt}
        </h2>
        <div className="mt-7 grid gap-3">
          {question.options.map((option, optionIndex) => (
            <button
              className="rounded-md border border-border p-4 text-left text-sm font-bold transition hover:border-primary hover:bg-primary-light"
              type="button"
              key={option}
              onClick={() => onAnswer(optionIndex)}
            >
              {String.fromCharCode(65 + optionIndex)}. {option}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function QuizResults({
  questions,
  answers,
  score,
  onReset,
}: {
  questions: Question[];
  answers: number[];
  score: number;
  onReset: () => void;
}) {
  return (
    <>
      <PageIntro
        eyebrow="Quiz complete"
        title={
          score / questions.length > 0.9
            ? "Excellent work"
            : "Keep building confidence"
        }
        text={`${score} out of ${questions.length} correct.`}
      />
      <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
        <p className="font-display text-3xl font-semibold">
          {Math.round((score / questions.length) * 100)}%
        </p>
        <h2 className="mt-8 font-display text-xl font-semibold">
          Answer review
        </h2>
        <div className="mt-4 divide-y divide-border">
          {questions.map((question, questionIndex) => (
            <div className="py-4" key={question.prompt}>
              <p className="text-sm font-bold">
                {questionIndex + 1}. {question.prompt}
              </p>
              <p className="mt-2 text-xs">
                {answers[questionIndex] === question.answer
                  ? "Correct"
                  : `Your answer: ${question.options[answers[questionIndex]] ?? "No answer"}`}
              </p>
            </div>
          ))}
        </div>
        <button
          className="mt-6 rounded-md bg-primary px-4 py-3 text-xs font-bold text-white"
          type="button"
          onClick={onReset}
        >
          Back to quizzes
        </button>
      </section>
    </>
  );
}
function PageIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-text-secondary">{text}</p>
    </div>
  );
}
