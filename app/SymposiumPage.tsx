import { SymposiumV0 } from "@/components/SymposiumV0";
import type { CanonicalRoute } from "@/features/navigation/canonicalRoute";

export function SymposiumPage({ initialRoute = { kind: "hall" } }: { initialRoute?: CanonicalRoute }) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <SymposiumV0 clerkEnabled={clerkEnabled} initialRoute={initialRoute} />;
}
