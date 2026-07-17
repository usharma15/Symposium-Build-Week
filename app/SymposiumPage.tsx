import { SymposiumV0 } from "@/components/SymposiumV0";
import type { CanonicalRoute } from "@/features/navigation/canonicalRoute";

export function SymposiumPage({ initialRoute = { kind: "hall" } }: { initialRoute?: CanonicalRoute }) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  const liveBackendUrl = process.env.SYMPOSIUM_API_URL?.replace(/\/$/, "") ?? null;
  return (
    <SymposiumV0
      clerkEnabled={clerkEnabled}
      initialRoute={initialRoute}
      initialShouldPlayEntrance={null}
      liveBackendUrl={liveBackendUrl}
    />
  );
}
