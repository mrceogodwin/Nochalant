import type { ReactNode } from "react";

// Each admin route applies its own server-side role guard. This lets moderators
// access the moderation workspace without granting them the Super Admin dashboard.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
