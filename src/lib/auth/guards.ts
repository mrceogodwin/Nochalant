import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AdminRole } from "@prisma/client";

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

/**
 * Staff access is resolved from revocable database assignments on every request.
 * Never trust a role copied into a client payload or long-lived JWT claim.
 */
export async function requireStaff(allowedRoles: AdminRole[]) {
  const member = await requireMember();

  const assignment = await prisma.adminAssignment.findFirst({
    where: {
      userId: member.id,
      revokedAt: null,
      role: { in: allowedRoles },
      user: { status: "ACTIVE", emailVerifiedAt: { not: null } },
    },
    select: { id: true, role: true },
  });

  if (!assignment) {
    redirect("/club?access=denied");
  }

  return { ...member, assignmentId: assignment.id, role: assignment.role };
}

export async function requireModerator() {
  return requireStaff(["OWNER", "ADMIN", "MODERATOR"]);
}

export async function requireAdmin() {
  return requireStaff(["OWNER", "ADMIN"]);
}
