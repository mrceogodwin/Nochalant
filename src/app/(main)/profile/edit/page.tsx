import { OnboardingForm } from "@/components/forms";
import { BackHeader } from "@/components/shell";
import { requireUser } from "@/lib/auth";

export default async function EditProfilePage() {
  const user = await requireUser();
  return (
    <main className="px-4 pt-2 pb-8">
      <BackHeader back="/profile" />
      <h1 className="mt-4 text-3xl font-extrabold">Edit profile</h1>
      <div className="mt-4">
        <OnboardingForm displayName={user.displayName} bio={user.bio} interests={user.interests} location={user.location} mode="edit" />
      </div>
    </main>
  );
}
