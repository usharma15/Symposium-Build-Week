export type ProfileWithHandle = { handle: string };

const profileForHandle = <T extends ProfileWithHandle>(profiles: Record<string, T>, handle?: string | null) => {
  if (!handle) return undefined;
  return profiles[handle] ?? Object.values(profiles).find((profile) => profile.handle === handle);
};

export const selectActiveProfile = <T extends ProfileWithHandle>({
  profiles,
  defaultProfile,
  authenticatedHandle,
  authenticatedProfile,
  preferredHandle
}: {
  profiles: Record<string, T>;
  defaultProfile: T;
  authenticatedHandle?: string | null;
  authenticatedProfile?: T | null;
  preferredHandle?: string | null;
}) =>
  profileForHandle(profiles, authenticatedHandle) ??
  (authenticatedHandle && authenticatedProfile?.handle === authenticatedHandle ? authenticatedProfile : undefined) ??
  profileForHandle(profiles, preferredHandle) ??
  profileForHandle(profiles, defaultProfile.handle) ??
  defaultProfile;
