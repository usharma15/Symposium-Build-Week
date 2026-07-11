"use client";

import { useEffect, useState } from "react";

const entranceSeenStorageKey = "symposium-entrance-seen-v1";
const presenceChannelName = "symposium-browser-presence-v1";
const presenceProbeMs = 120;

export type SymposiumTabIdentity = {
  openedAt: number;
  tabId: string;
};

const identityOrder = (left: SymposiumTabIdentity, right: SymposiumTabIdentity) =>
  left.openedAt - right.openedAt || left.tabId.localeCompare(right.tabId);

export const shouldPlayBrowserPresenceEntrance = (input: {
  currentTab: SymposiumTabIdentity;
  peerTabs: SymposiumTabIdentity[];
  seenInThisTab: boolean;
}) =>
  !input.seenInThisTab &&
  input.peerTabs.every((peer) => identityOrder(input.currentTab, peer) < 0);

type PresenceMessage =
  | { kind: "probe"; sender: SymposiumTabIdentity }
  | { kind: "present"; sender: SymposiumTabIdentity; targetTabId: string };

export const useBrowserPresenceEntrance = () => {
  const [shouldPlayEntrance, setShouldPlayEntrance] = useState<boolean | null>(null);

  useEffect(() => {
    const currentTab: SymposiumTabIdentity = {
      openedAt: Date.now(),
      tabId: window.crypto.randomUUID()
    };
    const seenInThisTab = window.sessionStorage.getItem(entranceSeenStorageKey) === "true";

    if (typeof BroadcastChannel === "undefined") {
      setShouldPlayEntrance(!seenInThisTab);
      window.sessionStorage.setItem(entranceSeenStorageKey, "true");
      return;
    }

    const channel = new BroadcastChannel(presenceChannelName);
    const peerTabs = new Map<string, SymposiumTabIdentity>();
    const receivePresence = (event: MessageEvent<PresenceMessage>) => {
      const message = event.data;
      if (!message || message.sender.tabId === currentTab.tabId) return;
      if (message.kind === "probe") {
        peerTabs.set(message.sender.tabId, message.sender);
        channel.postMessage({
          kind: "present",
          sender: currentTab,
          targetTabId: message.sender.tabId
        } satisfies PresenceMessage);
        return;
      }
      if (message.kind === "present" && message.targetTabId === currentTab.tabId) {
        peerTabs.set(message.sender.tabId, message.sender);
      }
    };
    channel.addEventListener("message", receivePresence);
    channel.postMessage({ kind: "probe", sender: currentTab } satisfies PresenceMessage);
    const decisionTimer = window.setTimeout(() => {
      setShouldPlayEntrance(
        shouldPlayBrowserPresenceEntrance({
          currentTab,
          peerTabs: [...peerTabs.values()],
          seenInThisTab
        })
      );
      window.sessionStorage.setItem(entranceSeenStorageKey, "true");
    }, presenceProbeMs);

    return () => {
      window.clearTimeout(decisionTimer);
      channel.removeEventListener("message", receivePresence);
      channel.close();
    };
  }, []);

  return shouldPlayEntrance;
};
