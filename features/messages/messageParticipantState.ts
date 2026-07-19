import type {
  ConversationParticipantContract,
  ConversationSummaryContract,
  MessageContract
} from "@/packages/contracts/src";
import type { ResearchProfile } from "@/lib/mockData";
import { cleanHandle } from "@/lib/symposiumCore";

export const activeConversationParticipants = (participants: ConversationParticipantContract[]) =>
  participants.filter((participant) => participant.status === "active");

export const messageSenderProfile = (
  message: MessageContract,
  participants: ConversationParticipantContract[],
  profiles: Record<string, ResearchProfile>
) => {
  if (!message.senderHandle) return undefined;
  const senderHandle = cleanHandle(message.senderHandle);
  return participants.find((participant) => cleanHandle(participant.handle) === senderHandle)
    ?? profiles[senderHandle];
};

export const withoutConversationParticipant = (
  conversation: ConversationSummaryContract,
  handle: string
): ConversationSummaryContract => ({
  ...conversation,
  participants: conversation.participants.filter(
    (participant) => cleanHandle(participant.handle) !== cleanHandle(handle)
  )
});
