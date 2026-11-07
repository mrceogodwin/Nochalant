import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/guards";

export default async function AppealsLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}
