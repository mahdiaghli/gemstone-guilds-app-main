export function requirePremium(): boolean {
  return import.meta.env.VITE_REQUIRE_PREMIUM === "true";
}
