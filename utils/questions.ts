import { QuestionStatus, TQuestion } from '@/types/question.types';
import { TabType } from '@/types/ui.types';

export enum QuestionFilter {
  All = 'ALL',
  New = 'NEW',
  Pending = 'PENDING',
  Answered = 'ANSWERED',
  Expired = 'EXPIRED',
}

export const INBOX_FILTERS: QuestionFilter[] = [
  QuestionFilter.All,
  QuestionFilter.New,
  QuestionFilter.Answered,
];

export const OUTBOX_FILTERS: QuestionFilter[] = [
  QuestionFilter.All,
  QuestionFilter.New,
  QuestionFilter.Pending,
  QuestionFilter.Answered,
  QuestionFilter.Expired,
];

export const QUESTION_FILTER_LABELS: Record<QuestionFilter, string> = {
  [QuestionFilter.All]: 'All',
  [QuestionFilter.New]: 'New',
  [QuestionFilter.Pending]: 'Pending',
  [QuestionFilter.Answered]: 'Answered',
  [QuestionFilter.Expired]: 'Expired',
};

export const DEFAULT_TTR_MS = 600000;

export const getAssignmentDeadlineMs = (question: TQuestion): number | null => {
  if (!question.assignedAt) {
    return null;
  }

  const ttrMs = question.timeToRespondMs ?? DEFAULT_TTR_MS;
  return new Date(question.assignedAt).getTime() + ttrMs;
};

export const isAssignmentTtrActive = (question: TQuestion): boolean => {
  if (question.status !== QuestionStatus.Assigned) {
    return false;
  }

  const deadline = getAssignmentDeadlineMs(question);
  if (deadline === null) {
    return false;
  }

  return Date.now() < deadline;
};

export const getRemainingTtrMs = (question: TQuestion, now = Date.now()): number => {
  const deadline = getAssignmentDeadlineMs(question);
  if (deadline === null) {
    return 0;
  }

  return Math.max(0, deadline - now);
};

const getInboxSortTime = (question: TQuestion) => {
  if (question.status === QuestionStatus.Assigned && question.assignedAt) {
    return new Date(question.assignedAt).getTime();
  }

  return new Date(question.updatedAt || question.createdAt).getTime();
};

const getOutboxSortTime = (question: TQuestion) =>
  new Date(question.createdAt).getTime();

export const sortInboxQuestions = (questions: TQuestion[]): TQuestion[] =>
  [...questions].sort((a, b) => getInboxSortTime(b) - getInboxSortTime(a));

export const sortOutboxQuestions = (questions: TQuestion[]): TQuestion[] =>
  [...questions].sort((a, b) => getOutboxSortTime(b) - getOutboxSortTime(a));

export const matchesQuestionFilter = (
  question: TQuestion,
  filter: QuestionFilter,
  activeTab: TabType,
): boolean => {
  if (filter === QuestionFilter.All) {
    return true;
  }

  switch (filter) {
    case QuestionFilter.New:
      return activeTab === TabType.Inbox
        ? isAssignmentTtrActive(question)
        : question.status === QuestionStatus.Open;
    case QuestionFilter.Pending:
      return question.status === QuestionStatus.Assigned && isAssignmentTtrActive(question);
    case QuestionFilter.Answered:
      return question.status === QuestionStatus.Answered;
    case QuestionFilter.Expired:
      return question.status === QuestionStatus.Expired;
    default:
      return true;
  }
};

export const filterAndSortQuestions = (
  questions: TQuestion[],
  filter: QuestionFilter,
  activeTab: TabType,
): TQuestion[] => {
  const filtered = questions.filter((question) =>
    matchesQuestionFilter(question, filter, activeTab),
  );

  return activeTab === TabType.Inbox
    ? sortInboxQuestions(filtered)
    : sortOutboxQuestions(filtered);
};
