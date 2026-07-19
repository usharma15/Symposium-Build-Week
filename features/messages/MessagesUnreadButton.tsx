"use client";

import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MessageUnreadCountContract } from "@/packages/contracts/src";
import { symposiumApi } from "@/features/api/symposiumApiClient";
import type { MessagingLiveEvent } from "@/features/messages/messageLiveState";
import {
  compactMessageUnreadCount,
  latestUnreadChangingEventKey
} from "@/features/messages/messageUnreadState";

export function MessagesUnreadButton({
  actorHandle,
  expanded,
  liveEvents,
  onOpen
}: {
  actorHandle: string;
  expanded: boolean;
  liveEvents: MessagingLiveEvent[];
  onOpen: () => void;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const requestEpochRef = useRef(0);
  const refreshTimerRef = useRef<number | null>(null);
  const wasExpandedRef = useRef(expanded);
  const latestEventKey = useMemo(() => latestUnreadChangingEventKey(liveEvents), [liveEvents]);

  const loadUnreadCount = useCallback(async () => {
    const requestEpoch = requestEpochRef.current + 1;
    requestEpochRef.current = requestEpoch;
    const parameters = new URLSearchParams({ actorHandle });
    try {
      const result = await symposiumApi.request<MessageUnreadCountContract>(
        `/api/conversations/unread?${parameters.toString()}`,
        { cache: "no-store" }
      );
      if (requestEpoch === requestEpochRef.current) setUnreadCount(result.unreadCount);
    } catch {
      // Messaging remains usable when the live service is reconnecting. The
      // next authoritative live event or actor change retries this projection.
    }
  }, [actorHandle]);

  useEffect(() => {
    setUnreadCount(0);
    void loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!latestEventKey) return;
    if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void loadUnreadCount();
    }, 80);
    return () => {
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    };
  }, [latestEventKey, loadUnreadCount]);

  useEffect(() => {
    const wasExpanded = wasExpandedRef.current;
    wasExpandedRef.current = expanded;
    if (wasExpanded && !expanded) void loadUnreadCount();
  }, [expanded, loadUnreadCount]);

  const title = unreadCount
    ? `Quick messages · ${unreadCount} unread`
    : "Quick messages";

  return (
    <button
      className={`icon-button quick-messages-button ${unreadCount ? "has-unread" : ""}`}
      type="button"
      title={title}
      aria-label={title}
      aria-expanded={expanded}
      onClick={onOpen}
    >
      <MessageCircle size={18} />
      {unreadCount ? <b aria-hidden="true">{compactMessageUnreadCount(unreadCount)}</b> : null}
    </button>
  );
}
