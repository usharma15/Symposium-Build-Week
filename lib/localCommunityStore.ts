import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  CommunityCallContract,
  CommunityMembershipStatusContract,
  CreateCommunityInputContract,
  CreateCommunityCallInputContract
} from "@/packages/contracts/src";
import { researchCommunities, type ResearchCommunity } from "@/lib/mockData";
import { cleanHandle } from "@/lib/symposiumCore";

type StoredMembership = {
  status: Exclude<CommunityMembershipStatusContract, "none"> | "removed";
  role: "owner" | "moderator" | "member";
  lastAccessedAt?: string;
};

type LocalCommunityState = {
  version: 2;
  communities: ResearchCommunity[];
  memberships: Record<string, Record<string, StoredMembership>>;
  calls: CommunityCallContract[];
};

const storagePath = process.env.VERCEL
  ? path.join("/tmp", "symposium-communities.json")
  : path.join(process.cwd(), ".data", "symposium-communities.json");

let queue: Promise<void> = Promise.resolve();
const withLock = <T>(operation: () => Promise<T>) => {
  const result = queue.then(operation, operation);
  queue = result.then(() => undefined, () => undefined);
  return result;
};

const seedCommunityCalls = (): CommunityCallContract[] => {
  const now = Date.now();
  return researchCommunities.flatMap((community, index) => {
    const hostHandle = community.moderatorHandles?.[0] ?? community.memberHandles[0];
    if (!hostHandle) return [];
    const calls: CommunityCallContract[] = [
      {
        id: `00000000-0000-4000-8000-${String(100 + index * 2).padStart(12, "0")}`,
        communityId: community.id,
        hostHandle,
        title: index % 3 === 0 ? "Weekly work review" : index % 3 === 1 ? "Open methods clinic" : "Member artifact table",
        kind: index % 2 === 0 ? "video" : "voice",
        status: "scheduled",
        startsAt: new Date(now + (index % 6 + 1) * 18 * 60 * 60 * 1000).toISOString(),
        provider: "symposium",
        providerRoomId: `${community.id}-weekly-review`,
        participantHandles: community.memberHandles.slice(0, 4 + (index % 5))
      },
      {
        id: `00000000-0000-4000-8000-${String(101 + index * 2).padStart(12, "0")}`,
        communityId: community.id,
        hostHandle: community.moderatorHandles?.[1] ?? hostHandle,
        title: index % 2 === 0 ? "Paper and source packet salon" : "New member working session",
        kind: index % 2 === 0 ? "voice" : "video",
        status: "scheduled",
        startsAt: new Date(now + (index % 8 + 4) * 24 * 60 * 60 * 1000).toISOString(),
        provider: "symposium",
        providerRoomId: `${community.id}-salon`,
        participantHandles: community.memberHandles.slice(3, 8 + (index % 4))
      }
    ];
    if (community.callStatus !== "quiet") {
      calls.unshift({
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        communityId: community.id,
        hostHandle,
        title: community.callStatus === "video live" ? "Open video workroom" : "Open voice workroom",
        kind: community.callStatus === "video live" ? "video" : "voice",
        status: "live",
        startsAt: new Date(now - (index % 5 + 1) * 11 * 60_000).toISOString(),
        provider: "symposium",
        providerRoomId: `${community.id}-live`,
        participantHandles: community.memberHandles.slice(0, Math.min(community.online, 10))
      });
    }
    return calls;
  });
};

const seedState = (): LocalCommunityState => ({
  version: 2,
  communities: researchCommunities,
  memberships: Object.fromEntries(researchCommunities.map((community, communityIndex) => [
    community.id,
    Object.fromEntries(community.memberHandles.map((handle, index) => [cleanHandle(handle), {
      status: "active" as const,
      role: (community.moderatorHandles ?? []).map(cleanHandle).includes(cleanHandle(handle))
        ? index === 0 ? "owner" as const : "moderator" as const
        : "member" as const,
      lastAccessedAt: cleanHandle(handle) === "@udayan"
        ? new Date(Date.UTC(2026, 6, 16, 12 - communityIndex, 0)).toISOString()
        : undefined
    }]))
  ])),
  calls: seedCommunityCalls()
});

const readState = async (): Promise<LocalCommunityState> => {
  try {
    const parsed = JSON.parse(await readFile(storagePath, "utf8")) as Partial<LocalCommunityState> & { version?: number };
    if (!Array.isArray(parsed.communities) || !parsed.memberships || !Array.isArray(parsed.calls)) return seedState();
    const seeded = seedState();
    const storedById = new Map(parsed.communities.map((community) => [community.id, community]));
    const seededIds = new Set(seeded.communities.map((community) => community.id));
    const communities = seeded.communities.map((community) => {
      const stored = storedById.get(community.id);
      if (!stored) return community;
      if (parsed.version === 2) return { ...community, ...stored };
      return {
        ...stored,
        memberHandles: Array.from(new Set([...community.memberHandles, ...stored.memberHandles])),
        memberCount: community.memberCount,
        monthlyActive: community.monthlyActive,
        moderatorHandles: community.moderatorHandles,
        guidelines: community.guidelines,
        announcements: community.announcements
      };
    });
    const memberships = Object.fromEntries(communities.map((community) => [
      community.id,
      { ...(seeded.memberships[community.id] ?? {}), ...(parsed.memberships?.[community.id] ?? {}) }
    ]));
    const seededCallById = new Map(seeded.calls.map((call) => [call.id, call]));
    for (const call of parsed.calls) seededCallById.set(call.id, call);
    return {
      version: 2,
      communities: [...communities, ...parsed.communities.filter((community) => !seededIds.has(community.id))],
      memberships: { ...memberships, ...Object.fromEntries(Object.entries(parsed.memberships).filter(([id]) => !seededIds.has(id))) },
      calls: [...seededCallById.values()]
    };
  } catch {
    return seedState();
  }
};

const writeState = async (state: LocalCommunityState) => {
  await mkdir(path.dirname(storagePath), { recursive: true });
  const temporaryPath = `${storagePath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await rename(temporaryPath, storagePath);
};

const projectCommunity = (state: LocalCommunityState, community: ResearchCommunity, rawHandle?: string) => {
  const handle = rawHandle ? cleanHandle(rawHandle) : "";
  const membership = handle ? state.memberships[community.id]?.[handle] : undefined;
  const activeMembers = Object.entries(state.memberships[community.id] ?? {})
    .filter(([, value]) => value.status === "active")
    .map(([memberHandle]) => memberHandle);
  const status = membership?.status === "active" || membership?.status === "requested" || membership?.status === "invited"
    ? membership.status
    : "none";
  return {
    ...community,
    online: community.visibility === "private" && status !== "active" ? 0 : community.online,
    memberHandles: community.visibility === "private" && status !== "active" ? [] : activeMembers,
    memberCount: community.visibility === "private" && status !== "active" ? 0 : activeMembers.length,
    monthlyActive: community.visibility === "private" && status !== "active" ? 0 : Math.max(community.online, Math.round(activeMembers.length * 0.72)),
    membershipStatus: status,
    lastAccessedAt: membership?.lastAccessedAt,
    moderatorHandles: community.visibility === "private" && status !== "active" ? [] : community.moderatorHandles ?? activeMembers.slice(0, 2),
    guidelines: community.visibility === "private" && status !== "active" ? undefined : community.guidelines ?? "Keep criticism attached to the work. Preserve sources and leave a legible trail when a claim changes.",
    announcements: community.visibility === "private" && status !== "active" ? [] : community.announcements ?? [],
    callStatus: community.visibility === "private" && status !== "active" ? "quiet" : community.callStatus
  } satisfies ResearchCommunity;
};

export const listLocalCommunities = async (actorHandle?: string) => {
  const state = await readState();
  return state.communities.map((community) => projectCommunity(state, community, actorHandle));
};

export const createLocalCommunity = (input: CreateCommunityInputContract, rawOwnerHandle: string) =>
  withLock(async () => {
    const state = await readState();
    const owner = cleanHandle(rawOwnerHandle);
    const baseId = input.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || `community-${randomUUID().slice(0, 8)}`;
    const id = state.communities.some((community) => community.id === baseId) ? `${baseId}-${randomUUID().slice(0, 6)}` : baseId;
    const now = new Date().toISOString();
    const community: ResearchCommunity = {
      id,
      name: input.name,
      field: input.field,
      summary: input.summary,
      visibility: input.visibility,
      online: 1,
      memberHandles: [owner],
      keywords: Array.from(new Set([input.name, input.field, ...input.keywords].map((value) => value.toLowerCase()))),
      seedCounts: { papers: 0, thoughts: 0, opportunities: 0 },
      callStatus: "quiet",
      memberCount: 1,
      monthlyActive: 1,
      membershipStatus: "active",
      lastAccessedAt: now,
      moderatorHandles: Array.from(new Set([owner, ...input.moderatorHandles.map(cleanHandle)])),
      guidelines: input.guidelines || "Keep criticism attached to the work. Preserve sources and leave a legible trail when a claim changes.",
      announcements: []
    };
    state.communities.push(community);
    state.memberships[id] = { [owner]: { status: "active", role: "owner", lastAccessedAt: now } };
    await writeState(state);
    return community;
  });

export const mutateLocalCommunityMembership = (
  communityId: string,
  rawActorHandle: string,
  action: "join" | "leave" | "access"
) => withLock(async () => {
  const state = await readState();
  const handle = cleanHandle(rawActorHandle);
  const community = state.communities.find((candidate) => candidate.id === communityId);
  if (!community) throw new Error("Community not found.");
  const current = state.memberships[communityId]?.[handle];
  const now = new Date().toISOString();
  state.memberships[communityId] ??= {};
  if (action === "access") {
    if (community.visibility === "private" && current?.status !== "active") throw new Error("This private community requires membership.");
    if (current?.status === "active") current.lastAccessedAt = now;
  } else if (action === "leave") {
    state.memberships[communityId]![handle] = { status: "removed", role: current?.role ?? "member", lastAccessedAt: current?.lastAccessedAt };
  } else {
    state.memberships[communityId]![handle] = {
      status: community.visibility === "private" ? "requested" : "active",
      role: current?.role ?? "member",
      lastAccessedAt: community.visibility === "public" ? now : current?.lastAccessedAt
    };
  }
  await writeState(state);
  const projected = projectCommunity(state, community, handle);
  return {
    community: projected,
    status: action === "leave" ? "left" as const : projected.membershipStatus === "active" ? "joined" as const : "requested" as const,
    accessedAt: action === "access" ? now : undefined
  };
});

export const listLocalCommunityCalls = async (communityId: string, rawActorHandle?: string) => {
  const state = await readState();
  const community = state.communities.find((candidate) => candidate.id === communityId);
  if (!community) throw new Error("Community not found.");
  const handle = rawActorHandle ? cleanHandle(rawActorHandle) : "";
  if (community.visibility === "private" && state.memberships[communityId]?.[handle]?.status !== "active") {
    throw new Error("Private community calls require membership.");
  }
  return state.calls.filter((call) => call.communityId === communityId);
};

export const createLocalCommunityCall = (input: CreateCommunityCallInputContract, rawActorHandle: string) =>
  withLock(async () => {
    const state = await readState();
    const handle = cleanHandle(rawActorHandle);
    if (state.memberships[input.communityId]?.[handle]?.status !== "active") throw new Error("Join this community before hosting a call.");
    const call: CommunityCallContract = {
      id: randomUUID(),
      communityId: input.communityId,
      hostHandle: handle,
      title: input.title,
      kind: input.kind,
      status: input.startsAt && Date.parse(input.startsAt) > Date.now() ? "scheduled" : "live",
      startsAt: input.startsAt ?? new Date().toISOString(),
      provider: input.provider,
      providerRoomId: input.providerRoomId,
      participantHandles: [handle]
    };
    state.calls.unshift(call);
    const community = state.communities.find((candidate) => candidate.id === input.communityId);
    if (community && call.status === "live") community.callStatus = input.kind === "video" ? "video live" : "voice live";
    await writeState(state);
    return call;
  });

export const joinLocalCommunityCall = (callId: string, rawActorHandle: string) => withLock(async () => {
  const state = await readState();
  const handle = cleanHandle(rawActorHandle);
  const call = state.calls.find((candidate) => candidate.id === callId);
  if (!call) throw new Error("Call not found.");
  const community = state.communities.find((candidate) => candidate.id === call.communityId);
  if (community?.visibility === "private" && state.memberships[call.communityId]?.[handle]?.status !== "active") {
    throw new Error("Private community calls require membership.");
  }
  call.participantHandles = Array.from(new Set([...call.participantHandles, handle]));
  await writeState(state);
  return call;
});
