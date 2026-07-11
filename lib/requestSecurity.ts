const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const isCrossSiteMutation = (input: {
  method: string;
  origin?: string | null;
  requestOrigin: string;
  secFetchSite?: string | null;
}) => {
  if (!mutationMethods.has(input.method.toUpperCase())) return false;
  if (input.secFetchSite?.toLowerCase() === "cross-site") return true;
  if (!input.origin) return false;
  try {
    return new URL(input.origin).origin !== new URL(input.requestOrigin).origin;
  } catch {
    return true;
  }
};
