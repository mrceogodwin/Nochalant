import { redirect } from "next/navigation";

export default async function SceneAlias({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/discover/scenes/${encodeURIComponent(slug)}`);
}
