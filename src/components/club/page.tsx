import type { ReactNode } from "react";
import type { LinkProps } from "@tanstack/react-router";
import { ClubFrame } from "@/components/club/shell";

export function ClubPage({
  title,
  kicker,
  back,
  tabs = !back,
  children,
}: {
  title: string;
  kicker?: string;
  back?: LinkProps["to"];
  tabs?: boolean;
  children: ReactNode;
}) {
  return (
    <ClubFrame tabs={tabs} title={title} kicker={kicker} back={back}>
      <div className="px-4 py-4">{children}</div>
    </ClubFrame>
  );
}
