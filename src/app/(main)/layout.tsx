import { redirect } from "next/navigation";
import { AppNav } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { unreadCount } from "@/lib/data";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  const unread = await unreadCount(user.id);
  return (
    <>
      <div className="pb-36">{children}</div>
      <AppNav unread={unread} />
    </>
  );
}
