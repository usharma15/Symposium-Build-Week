export type RevisionedEntity = { revision?: number };

export const entityRevision = (entity: RevisionedEntity | null | undefined) => {
  const revision = entity?.revision;
  return Number.isInteger(revision) && Number(revision) > 0 ? Number(revision) : null;
};

export const compareEntityRevisions = (
  incoming: RevisionedEntity | null | undefined,
  current: RevisionedEntity | null | undefined
) => {
  const incomingRevision = entityRevision(incoming);
  const currentRevision = entityRevision(current);
  if (incomingRevision === null || currentRevision === null) return null;
  return incomingRevision - currentRevision;
};

export const incomingEntityIsStale = (
  incoming: RevisionedEntity | null | undefined,
  current: RevisionedEntity | null | undefined
) => {
  const comparison = compareEntityRevisions(incoming, current);
  return comparison !== null && comparison < 0;
};
