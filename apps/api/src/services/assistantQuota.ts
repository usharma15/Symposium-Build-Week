import { cleanHandle } from "@/lib/symposiumCore";

export type AssistantDailyLimitPolicy = {
  baseLimit: number;
  ownerHandle: string;
  ownerOverrideLimit: number;
  ownerOverrideUsageDay: string;
};

export const assistantDailyLimitFor = (
  actorHandle: string,
  usageDay: string,
  policy: AssistantDailyLimitPolicy
) => {
  const ownerOverrideActive = Boolean(policy.ownerOverrideUsageDay) &&
    usageDay === policy.ownerOverrideUsageDay &&
    cleanHandle(actorHandle) === cleanHandle(policy.ownerHandle);

  return ownerOverrideActive
    ? Math.max(policy.baseLimit, policy.ownerOverrideLimit)
    : policy.baseLimit;
};
