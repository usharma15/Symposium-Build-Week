import { useCallback, useEffect, useRef } from "react";

export const useCoalescedRefresh = (
  work: () => PromiseLike<unknown>[],
  delayMs = 650
) => {
  const workRef = useRef(work);
  const scheduleRef = useRef<() => void>(() => undefined);
  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const queuedRef = useRef(false);
  workRef.current = work;

  const schedule = useCallback(() => {
    if (timerRef.current) return;
    if (runningRef.current) {
      queuedRef.current = true;
      return;
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      runningRef.current = true;
      void Promise.allSettled(workRef.current()).finally(() => {
        runningRef.current = false;
        if (!queuedRef.current) return;
        queuedRef.current = false;
        scheduleRef.current();
      });
    }, delayMs);
  }, [delayMs]);
  scheduleRef.current = schedule;

  useEffect(() => () => {
    queuedRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return schedule;
};
