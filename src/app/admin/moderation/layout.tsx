import type { ReactNode } from "react";

import { requireModerator } from "@/lib/auth/guards";

export default async function ModerationLayout({ children }: { children: ReactNode }) {
  await requireModerator();
  return children;
}
