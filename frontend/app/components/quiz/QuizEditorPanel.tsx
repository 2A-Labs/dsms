"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createManageQuizQuestion,
  createManageQuiz,
  deleteManageQuiz,
  deleteManageQuizQuestion,
  getManageQuizzes,
  getManageQuizQuestions,
  updateManageQuizQuestion,
  type ApiQuizManageQuestion,
  type ApiQuiz,
} from "../../lib/api";

type Draft = {
  id?: number;
  quiz_id: number;
  question_text: string;
  image_url: string;
  allow_multiple: boolean;
  is_active: boolean;
  answers: { answer_text: string; is_correct: boolean }[];
};

const emptyDraft = (quizId = 0): Draft => ({
  quiz_id: quizId,
  question_text: "",
  image_url: "",
  allow_multiple: false,
  is_active: true,
  answers: [
    { answer_text: "", is_correct: false },
    { answer_text: "", is_correct: false },
  ],
});

export function QuizEditorPanel() {
  const [questions, setQuestions] = useState<ApiQuizManageQuestion[]>([]);
  const [quizzes, setQuizzes] = useState<ApiQuiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadQuestions() {
    setLoading(true);
    try {
      const [loadedQuizzes, loadedQuestions] = await Promise.all([
        getManageQuizzes(),
        getManageQuizQuestions(),
      ]);
      setQuizzes(loadedQuizzes);
      setQuestions(loadedQuestions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load quiz questions");
    } finally {
      setLoading(false);
    }
  }

  async function addQuiz() {
    const name = window.prompt("Quiz name")?.trim();
    if (!name) return;
    const description = window.prompt("Quiz description")?.trim() ?? "";
    setError("");
    try {
      const quiz = await createManageQuiz(name, description);
      setQuizzes((current) => [...current, quiz].sort((left, right) => left.name.localeCompare(right.name)));
      setNotice("Quiz added.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add quiz");
    }
  }

  async function removeQuiz(quiz: ApiQuiz) {
    if (!window.confirm(`Delete ${quiz.name} and all its questions?`)) return;
    setError("");
    try {
      await deleteManageQuiz(quiz.id);
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id));
      setQuestions((current) => current.filter((question) => question.quiz_id !== quiz.id));
      setNotice("Quiz deleted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete quiz");
    }
  }

  useEffect(() => {
    void loadQuestions();
  }, []);

  function updateAnswer(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      answers: current.answers.map((answer, answerIndex) =>
        answerIndex === index ? { ...answer, answer_text: value } : answer,
      ),
    }));
  }

  function toggleCorrect(index: number) {
    setDraft((current) => ({
      ...current,
      answers: current.answers.map((answer, answerIndex) =>
        answerIndex === index
          ? { ...answer, is_correct: current.allow_multiple ? !answer.is_correct : true }
          : current.allow_multiple
            ? answer
            : { ...answer, is_correct: false },
      ),
    }));
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const answers = draft.answers.filter((answer) => answer.answer_text.trim());
    const correctCount = answers.filter((answer) => answer.is_correct).length;
    if (answers.length < 2) {
      setError("Add at least two answers.");
      return;
    }
    if ((!draft.allow_multiple && correctCount !== 1) || (draft.allow_multiple && correctCount < 2)) {
      setError(draft.allow_multiple ? "Select at least two correct answers." : "Select exactly one correct answer.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        quiz_id: draft.quiz_id,
        question_text: draft.question_text.trim(),
        image_url: draft.image_url.trim() || null,
        allow_multiple: draft.allow_multiple,
        is_active: draft.is_active,
        answers,
      };
      const saved = draft.id
        ? await updateManageQuizQuestion(draft.id, payload)
        : await createManageQuizQuestion(payload);
      setQuestions((current) =>
        draft.id
          ? current.map((question) => (question.id === saved.id ? saved : question))
          : [saved, ...current],
      );
      setDraft(emptyDraft(selectedQuizId ?? 0));
      setNotice(draft.id ? "Question updated." : "Question added.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save question");
    } finally {
      setSaving(false);
    }
  }

  async function removeQuestion(id: number) {
    if (!window.confirm("Delete this quiz question?")) return;
    setError("");
    try {
      await deleteManageQuizQuestion(id);
      setQuestions((current) => current.filter((question) => question.id !== id));
      if (draft.id === id) setDraft(emptyDraft(selectedQuizId ?? 0));
      setNotice("Question deleted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete question");
    }
  }

  if (selectedQuizId === null) {
    return (
      <>
        <div className="mb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Quiz bank</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Choose a quiz</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">Open a quiz to manage its questions, or create a new quiz to get started.</p>
        </div>
        {(error || notice) && <p className={`mb-6 rounded-md p-4 text-xs font-bold ${error ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>{error || notice}</p>}
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Your quizzes</h2>
              <p className="mt-1 text-xs text-text-secondary">{loading ? "Loading..." : `${quizzes.length} quizzes`}</p>
            </div>
            <button className="rounded-md bg-primary px-4 py-3 text-xs font-bold text-white" type="button" onClick={addQuiz}>Add quiz</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((quiz) => (
              <div className="flex min-h-48 flex-col justify-between rounded-lg border border-border bg-background p-5" key={quiz.id}>
                <div><p className="font-display text-lg font-semibold">{quiz.name}</p><p className="mt-2 min-h-10 text-xs leading-5 text-text-secondary">{quiz.description || "No description added."}</p><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{quiz.question_count} questions · {quiz.is_active ? "Active" : "Inactive"}</p></div>
                <div className="mt-5 flex gap-3">
                  <button className="flex-1 rounded-md border border-primary/30 px-3 py-2.5 text-xs font-bold text-primary" type="button" onClick={() => { setSelectedQuizId(quiz.id); setDraft(emptyDraft(quiz.id)); }}>Open quiz</button>
                  <button className="rounded-md border border-error/30 px-3 py-2.5 text-xs font-bold text-error" type="button" onClick={() => removeQuiz(quiz)}>Delete</button>
                </div>
              </div>
            ))}
            {!loading && quizzes.length === 0 && <p className="text-sm text-text-secondary">No quizzes have been created yet.</p>}
          </div>
        </section>
      </>
    );
  }

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId);

  return (
    <>
      <div className="mb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Quiz bank</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{selectedQuiz?.name ?? "Edit quiz questions"}</h1>
            <button
              className="rounded-md border border-border px-4 py-2.5 text-xs font-bold text-text-secondary"
              type="button"
              onClick={() => { setSelectedQuizId(null); setDraft(emptyDraft()); }}
            >
              Back to quiz bank
            </button>
          </div>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">Create theory questions, add an optional image, and choose whether one or several answers are correct.</p>
      </div>
      {(error || notice) && <p className={`mb-6 rounded-md p-4 text-xs font-bold ${error ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>{error || notice}</p>}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Questions</h2>
            <button className="rounded-md border border-border px-3 py-2 text-xs font-bold text-text-secondary" type="button" onClick={() => { setSelectedQuizId(null); setDraft(emptyDraft()); }}>Back to quizzes</button>
          </div>
          <h2 className="font-display text-xl font-semibold">{draft.id ? "Edit question" : "Add question"}</h2>
          <form className="mt-6 grid gap-4" onSubmit={saveQuestion}>
            <label className="grid gap-2 text-xs font-bold">
              Question
              <textarea className="min-h-24 rounded-md border border-border bg-background px-3 py-3 text-sm font-normal outline-none focus:border-primary" value={draft.question_text} onChange={(event) => setDraft({ ...draft, question_text: event.target.value })} required />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Image URL <span className="font-normal text-text-secondary">Optional</span>
              <input className="rounded-md border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-primary" type="url" value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} placeholder="https://..." />
            </label>
            <label className="flex items-center gap-3 text-xs font-bold">
              <input type="checkbox" checked={draft.allow_multiple} onChange={(event) => setDraft({ ...draft, allow_multiple: event.target.checked, answers: draft.answers.map((answer) => ({ ...answer, is_correct: event.target.checked ? answer.is_correct : false })) })} />
              Multiple correct answers
            </label>
            <div className="grid gap-3">
              {draft.answers.map((answer, index) => (
                <div className="flex items-center gap-3" key={index}>
                  <input className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" value={answer.answer_text} onChange={(event) => updateAnswer(index, event.target.value)} placeholder={`Answer ${index + 1}`} required />
                  <label className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary">
                    <input type="checkbox" checked={answer.is_correct} onChange={() => toggleCorrect(index)} /> Correct
                  </label>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="rounded-md border border-border px-4 py-3 text-xs font-bold text-text-secondary" type="button" onClick={() => setDraft((current) => ({ ...current, answers: [...current.answers, { answer_text: "", is_correct: false }] }))}>Add answer</button>
              <button className="rounded-md bg-primary px-4 py-3 text-xs font-bold text-white disabled:opacity-40" type="submit" disabled={saving || !draft.question_text.trim() || !draft.quiz_id}>{saving ? "Saving..." : draft.id ? "Save question" : "Add question"}</button>
              {draft.id && <button className="rounded-md border border-border px-4 py-3 text-xs font-bold text-text-secondary" type="button" onClick={() => setDraft(emptyDraft())}>Cancel</button>}
            </div>
          </form>
        </section>
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Question bank</h2><p className="mt-1 text-xs text-text-secondary">{loading ? "Loading..." : `${questions.filter((question) => question.quiz_id === selectedQuizId).length} questions`}</p></div></div>
          <div className="grid gap-4">
            {questions.filter((question) => question.quiz_id === selectedQuizId).map((question) => (
              <article className="border-b border-border pb-4 last:border-0" key={question.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0"><p className="text-sm font-bold">{question.question_text}</p><p className="mt-1 text-xs text-text-secondary">{question.allow_multiple ? "Multiple answers" : "Single answer"} · {question.is_active ? "Active" : "Inactive"}</p></div>
                  <div className="flex shrink-0 gap-3"><button className="text-xs font-bold text-primary" type="button" onClick={() => setDraft({ ...question, image_url: question.image_url ?? "", answers: question.answers.map(({ answer_text, is_correct }) => ({ answer_text, is_correct })) })}>Edit</button><button className="text-xs font-bold text-error" type="button" onClick={() => removeQuestion(question.id)}>Delete</button></div>
                </div>
              </article>
            ))}
            {!loading && questions.length === 0 && <p className="text-sm text-text-secondary">No quiz questions have been added yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
