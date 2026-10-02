"use client";

import { useEffect, useState } from "react";
import type { ApiQuizQuestion, ApiQuizSubmission } from "../../lib/api";

type QuizPanelProps = {
  questions: ApiQuizQuestion[];
  index: number;
  result: ApiQuizSubmission | null;
  loading: boolean;
  error: string;
  onStart: () => void;
  onAnswer: (answerIds: number[]) => void | Promise<void>;
  onReset: () => void;
};

export function QuizPanel({
  questions,
  index,
  result,
  loading,
  error,
  onStart,
  onAnswer,
  onReset,
}: QuizPanelProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

  useEffect(() => {
    setSelectedAnswers([]);
  }, [index]);

  if (!result && questions.length === 0) {
    return (
      <>
        <PageIntro
          eyebrow="Knowledge check"
          title="Practice with purpose"
          text="Take a 20-question quiz selected at random from the questions in the database."
        />
        {error && (
          <p className="mb-4 text-sm font-bold text-red-600">{error}</p>
        )}
        <button
          className="rounded-md bg-primary px-5 py-3 text-xs font-bold text-white disabled:opacity-50"
          type="button"
          onClick={onStart}
          disabled={loading}
        >
          {loading ? "Loading questions..." : "Start quiz"}
        </button>
      </>
    );
  }

  if (result) return <QuizResults result={result} onReset={onReset} />;

  if (error) {
    return (
      <>
        <PageIntro
          eyebrow="Quiz error"
          title="We could not finish the quiz"
          text={error}
        />
        <button
          className="rounded-md bg-primary px-4 py-3 text-xs font-bold text-white"
          type="button"
          onClick={onReset}
        >
          Back to quiz
        </button>
      </>
    );
  }

  const question = questions[index];
  const isMultiple = question.allow_multiple;

  function chooseAnswer(answerId: number) {
    if (!isMultiple) {
      void onAnswer([answerId]);
      return;
    }
    setSelectedAnswers((current) =>
      current.includes(answerId)
        ? current.filter((id) => id !== answerId)
        : [...current, answerId],
    );
  }

  return (
    <>
      <PageIntro
        eyebrow={`Question ${index + 1} of ${questions.length}`}
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
        {question.image_url && (
          <img
            className="mt-8 max-h-72 w-full rounded-md object-cover"
            src={question.image_url}
            alt="Question illustration"
          />
        )}
        <h2 className="mt-8 font-display text-2xl font-semibold leading-tight">
          {question.question_text}
        </h2>
        {isMultiple && (
          <p className="mt-2 text-xs font-bold text-primary">
            Select all answers that apply.
          </p>
        )}
        <div className="mt-7 grid gap-3">
          {question.answers.map((answer, answerIndex) => (
            <button
              className={`rounded-md border p-4 text-left text-sm font-bold transition hover:border-primary hover:bg-primary-light disabled:cursor-wait disabled:opacity-50 ${selectedAnswers.includes(answer.id) ? "border-primary bg-primary-light text-primary" : "border-border"}`}
              type="button"
              key={answer.id}
              onClick={() => chooseAnswer(answer.id)}
              disabled={loading}
            >
              {String.fromCharCode(65 + answerIndex)}. {answer.answer_text}
            </button>
          ))}
        </div>
        {isMultiple && (
          <button
            className="mt-6 rounded-md bg-primary px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={!selectedAnswers.length || loading}
            onClick={() => {
              void onAnswer(selectedAnswers);
              setSelectedAnswers([]);
            }}
          >
            Continue
          </button>
        )}
      </section>
    </>
  );
}

function QuizResults({
  result,
  onReset,
}: {
  result: ApiQuizSubmission;
  onReset: () => void;
}) {
  return (
    <>
      <PageIntro
        eyebrow="Quiz complete"
        title={
          result.score / result.total > 0.9
            ? "Excellent work"
            : "Keep building confidence"
        }
        text={`${result.score} out of ${result.total} correct.`}
      />
      <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
        <p className="font-display text-3xl font-semibold">
          {Math.round((result.score / result.total) * 100)}%
        </p>
        <h2 className="mt-8 font-display text-xl font-semibold">
          Answer review
        </h2>
        <div className="mt-4 divide-y divide-border">
          {result.review.map((item, questionIndex) => (
            <div className="py-4" key={item.question_id}>
              <p className="text-sm font-bold">
                {questionIndex + 1}. {item.question_text}
              </p>
              <p
                className={`mt-2 text-xs font-bold ${item.is_correct ? "text-success" : "text-red-600"}`}
              >
                {item.is_correct
                  ? "Correct"
                  : `Your answer: ${item.selected_answers.join(", ") || "No answer"}. Correct answer: ${item.correct_answers.join(", ")}`}
              </p>
            </div>
          ))}
        </div>
        <button
          className="mt-6 rounded-md bg-primary px-4 py-3 text-xs font-bold text-white"
          type="button"
          onClick={onReset}
        >
          Back to quiz
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
