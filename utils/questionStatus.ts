import { AnswerRequestStatus } from '@/types/answerRequest.types';
import { TFeedQuestion } from '@/types/question.types';

/**
 * The six question-status icons defined by the QuickPeek status spec.
 * - `outgoing` / `incoming` are mutually exclusive and rendered in a neutral color.
 * - The remaining icons stack alongside them and are NOT mutually exclusive.
 * - `near_me` is rendered in a separate location (next to the km value), not in
 *   the main status group.
 */
export type StatusIconKey =
  | 'outgoing'
  | 'incoming'
  | 'request_pending'
  | 'request_approved'
  | 'request_denied'
  | 'near_me';

export type StatusIcon = {
  key: StatusIconKey;
  label: string;
};

export const STATUS_ICON_LABELS: Record<StatusIconKey, string> = {
  outgoing: 'Outgoing',
  incoming: 'Incoming',
  request_pending: 'Pending request',
  request_approved: 'Request approved',
  request_denied: 'Request denied',
  near_me: 'Near me',
};

const iconFromKey = (key: StatusIconKey): StatusIcon => ({
  key,
  label: STATUS_ICON_LABELS[key],
});

type GetStatusIconsOptions = {
  /**
   * Override for the pending-request count on an outgoing question. The detail
   * screen fetches its requests separately and can pass a fresher count than the
   * feed payload carries. When omitted, the function falls back to
   * `requestCounts.PENDING` or the presence of `incomingRequest`.
   */
  outgoingPendingCount?: number;
};

/**
 * Compute the ordered list of status icons to render for a question.
 * Pure function — derived from the question payload + viewer id, so it stays in
 * sync with real-time feed refreshes automatically.
 */
export function getQuestionStatusIcons(
  question: TFeedQuestion,
  viewerId: string | undefined,
  options?: GetStatusIconsOptions,
): StatusIcon[] {
  if (!viewerId) return [];

  const icons: StatusIcon[] = [];
  const isOutgoing = question.userId === viewerId;

  if (isOutgoing) {
    icons.push(iconFromKey('outgoing'));

    const override = options?.outgoingPendingCount;
    const hasPending =
      override != null
        ? override > 0
        : (question.requestCounts?.PENDING ?? 0) > 0 || !!question.incomingRequest;

    if (hasPending) {
      icons.push(iconFromKey('request_pending'));
    }
  } else {
    icons.push(iconFromKey('incoming'));

    const status = question.viewerRequest?.status;
    if (status === AnswerRequestStatus.Pending) {
      icons.push(iconFromKey('request_pending'));
    } else if (status === AnswerRequestStatus.Accepted) {
      icons.push(iconFromKey('request_approved'));
    } else if (status === AnswerRequestStatus.Rejected || question.viewerRequest?.isBlocked) {
      icons.push(iconFromKey('request_denied'));
    }
  }

  // Near-me applies only to incoming, located questions flagged by the backend.
  const hasLocation = question.latitude != null && question.longitude != null;
  if (!isOutgoing && question.nearMe === true && hasLocation) {
    icons.push(iconFromKey('near_me'));
  }

  return icons;
}

/** Convenience: extract just the near-me icon if present (rendered separately). */
export function getNearMeIcon(
  question: TFeedQuestion,
  viewerId: string | undefined,
): StatusIcon | null {
  const icons = getQuestionStatusIcons(question, viewerId);
  return icons.find((i) => i.key === 'near_me') ?? null;
}

/** Convenience: status icons excluding the near-me one (the main grouped set). */
export function getMainStatusIcons(
  question: TFeedQuestion,
  viewerId: string | undefined,
  options?: GetStatusIconsOptions,
): StatusIcon[] {
  return getQuestionStatusIcons(question, viewerId, options).filter((i) => i.key !== 'near_me');
}

// ---------------------------------------------------------------------------
// Filter-tag bar (Home search box)
// ---------------------------------------------------------------------------

/**
 * Tag keys for the 5 status filter chips under the Home search box. The
 * `outgoing` tag is the direction tag; the others match the corresponding
 * status icon. Tags are AND-combined when multiple are active.
 */
export type StatusTagKey =
  | 'outgoing'
  | 'request_pending'
  | 'request_approved'
  | 'request_denied'
  | 'near_me';

export const STATUS_TAG_DEFS: { key: StatusTagKey; label: string }[] = [
  { key: 'outgoing', label: STATUS_ICON_LABELS.outgoing },
  { key: 'request_pending', label: STATUS_ICON_LABELS.request_pending },
  { key: 'request_approved', label: STATUS_ICON_LABELS.request_approved },
  { key: 'request_denied', label: STATUS_ICON_LABELS.request_denied },
  { key: 'near_me', label: STATUS_ICON_LABELS.near_me },
];

/**
 * Predicate used by the Home tag bar. A question matches a tag when the
 * corresponding status icon would render for it (so the tag list and the icons
 * on the cards always agree).
 */
export function questionMatchesTag(
  question: TFeedQuestion,
  viewerId: string | undefined,
  tag: StatusTagKey,
): boolean {
  const keys = getQuestionStatusIcons(question, viewerId).map((i) => i.key);
  return keys.includes(tag);
}
