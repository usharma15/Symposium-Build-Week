import type { ViewActionOptions } from "@/features/actions/actionTypes";
import { createClientMutationId, symposiumApi } from "@/features/api/symposiumApiClient";

export const recordPassiveView = async <T>(
  target: "post" | "comment",
  itemId: string,
  commentId: string | null,
  actorHandle: string,
  options: ViewActionOptions
) => {
  const path = target === "post"
    ? `/api/posts/${itemId}/actions`
    : `/api/posts/${itemId}/comments/${commentId}/actions`;
  try {
    return await symposiumApi.request<T>(path, {
      method: "POST",
      idempotencyKey: createClientMutationId(`${target}-view`),
      body: { action: "read", actorHandle, trigger: options.trigger, surface: options.surface }
    });
  } catch {
    return null;
  }
};
