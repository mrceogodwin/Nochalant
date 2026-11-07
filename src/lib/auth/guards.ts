import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireMember() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
