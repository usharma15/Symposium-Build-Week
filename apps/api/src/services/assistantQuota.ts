export type AssistantDailyLimitPolicy = {
  baseLimit: number;
};

export const assistantDailyLimitFor = (
  _actorHandle: string,
  _usageDay: string,
  policy: AssistantDailyLimitPolicy
) => policy.baseLimit;
