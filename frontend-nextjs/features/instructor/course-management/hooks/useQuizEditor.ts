import { useState } from "react";
import type {
  QuizEditorOption,
  QuizEditorQuestion,
  QuizEditorState,
} from "../types";

export interface UseQuizEditorReturn {
  state: QuizEditorState;
  selectedQuestionId: number | null;
  selectedQuestion: QuizEditorQuestion | null;
  updateQuestion: (
    questionId: number,
    updater: (question: QuizEditorQuestion) => QuizEditorQuestion,
  ) => void;
  addQuestion: () => void;
  removeQuestion: (questionId: number) => void;
  addOption: (questionId: number) => void;
  removeOption: (questionId: number, optionId: string) => void;
  updateOption: (
    questionId: number,
    optionId: string,
    updater: (option: QuizEditorOption) => QuizEditorOption,
  ) => void;
  setState: (updater: (prev: QuizEditorState) => QuizEditorState) => void;
  setSelectedQuestionId: (id: number | null) => void;
  updateTitle: (title: string) => void;
  updateDescription: (description: string) => void;
  updatePassingScore: (score: number) => void;
  updateTimeLimitMinutes: (minutes: number) => void;
  updateIsInVideo: (isInVideo: boolean) => void;
}

const createEmptyQuestion = (seed: number): QuizEditorQuestion => ({
  id: seed,
  prompt: "",
  explanation: "",
  videoTimestamp: "",
  options: [
    { id: `${seed}-a`, label: "", isCorrect: true },
    { id: `${seed}-b`, label: "", isCorrect: false },
  ],
});

const createBlankQuizState = (
  lessonActivityId: number | null,
): QuizEditorState => ({
  lessonActivityId,
  title: "Quiz mới",
  description: "",
  passingScore: 70,
  timeLimitMinutes: 10,
  shuffleQuestion: false,
  shuffleOption: false,
  isInVideo: false,
  questions: [createEmptyQuestion(Date.now())],
});

export function useQuizEditor(
  initialQuiz?: QuizEditorState | null,
): UseQuizEditorReturn {
  const [state, setState] = useState<QuizEditorState>(
    initialQuiz ?? createBlankQuizState(null),
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    state.questions[0]?.id ?? null,
  );

  const selectedQuestion =
    state.questions.find((question) => question.id === selectedQuestionId) ??
    state.questions[0] ??
    null;

  const updateQuestion = (
    questionId: number,
    updater: (question: QuizEditorQuestion) => QuizEditorQuestion,
  ) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    }));
  };

  const updateOption = (
    questionId: number,
    optionId: string,
    updater: (option: QuizEditorOption) => QuizEditorOption,
  ) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.map((option) =>
        option.id === optionId ? updater(option) : option,
      ),
    }));
  };

  const addQuestion = () => {
    const nextQuestion = createEmptyQuestion(Date.now());
    setState((prev) => ({
      ...prev,
      questions: [...prev.questions, nextQuestion],
    }));
    setSelectedQuestionId(nextQuestion.id);
  };

  const removeQuestion = (questionId: number) => {
    if (state.questions.length <= 1) {
      return;
    }

    const nextQuestions = state.questions.filter(
      (question) => question.id !== questionId,
    );

    setState((prev) => ({
      ...prev,
      questions: nextQuestions,
    }));

    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(nextQuestions[0]?.id ?? null);
    }
  };

  const addOption = (questionId: number) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: [
        ...question.options,
        {
          id: `${questionId}-${Date.now()}`,
          label: "",
          isCorrect: false,
        },
      ],
    }));
  };

  const removeOption = (questionId: number, optionId: string) => {
    updateQuestion(questionId, (question) => {
      if (question.options.length <= 2) {
        return question;
      }

      const nextOptions = question.options.filter(
        (option) => option.id !== optionId,
      );

      if (!nextOptions.length) {
        return question;
      }

      if (!nextOptions.some((option) => option.isCorrect)) {
        nextOptions[0] = { ...nextOptions[0], isCorrect: true };
      }

      return {
        ...question,
        options: nextOptions,
      };
    });
  };

  const updateTitle = (title: string) => {
    setState((prev) => ({ ...prev, title }));
  };

  const updateDescription = (description: string) => {
    setState((prev) => ({ ...prev, description }));
  };

  const updatePassingScore = (score: number) => {
    setState((prev) => ({ ...prev, passingScore: score }));
  };

  const updateTimeLimitMinutes = (minutes: number) => {
    setState((prev) => ({ ...prev, timeLimitMinutes: minutes }));
  };

  const updateIsInVideo = (isInVideo: boolean) => {
    setState((prev) => ({
      ...prev,
      isInVideo,
      questions: isInVideo
        ? prev.questions
        : prev.questions.map((question) => ({
            ...question,
            videoTimestamp: "",
          })),
    }));
  };

  return {
    state,
    selectedQuestionId,
    selectedQuestion,
    updateQuestion,
    addQuestion,
    removeQuestion,
    addOption,
    removeOption,
    updateOption,
    setState,
    setSelectedQuestionId,
    updateTitle,
    updateDescription,
    updatePassingScore,
    updateTimeLimitMinutes,
    updateIsInVideo,
  };
}
