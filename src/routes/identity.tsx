import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as Switch from "@radix-ui/react-switch";
import { Collectible } from "@/components/club/objects";
import { Stage } from "@/components/club/stage";
import { Button, Field, TextArea } from "@/components/club/ui";
import { emojiGroups, personalityById } from "@/lib/club/data";
import { useClub } from "@/lib/club/store";
import type { CollectibleId } from "@/lib/club/types";
import { cn, slugHandle } from "@/lib/utils";

export const Route = createFileRoute("/identity")({ component: IdentityScreen });

function IdentityScreen() {
  const stored = useClub((state) => state);
  const setProfile = useClub((state) => state.setProfile);
  const personality = personalityById(stored.personality);
  const navigate = useNavigate();
  const [name, setName] = useState(stored.name);
  const [handle, setHandle] = useState(stored.handle);
  const [bio, setBio] = useState(stored.bio);
  const [emoji, setEmoji] = useState<CollectibleId>(stored.emoji);
  const [isPrivate, setPrivate] = useState(stored.isPrivate);
  const [touchedHandle, setTouchedHandle] = useState(Boolean(stored.handle));

  return (
    <Stage
      step={5}
      back="/interests"
      kicker="Club ID"
      title="Create your Club ID."
      subtitle="This is the card people see. Keep the rest of the story for later."
      footer={
        <Button
          full
          disabled={!name.trim()}
          onClick={() => {
            setProfile({
              name: name.trim(),
              handle: slugHandle(handle || name),
              bio: bio.trim(),
              emoji,
              isPrivate,
            });
            void navigate({ to: "/circle" });
          }}
        >
          Continue
        </Button>
      }
    >
      <div className="membership-card rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <span className="w-16">
            <Collectible id={emoji} />
          </span>
          <div>
            <p className="text-xs tracking-widest text-secondary">NOCHALANT CLUB</p>
            <p className="font-display text-2xl font-semibold">{name.trim() || "Your name"}</p>
            <p className="text-sm text-secondary">@{slugHandle(handle || name || "member")}</p>
          </div>
        </div>
        {personality ? <p className="mt-3 text-sm text-secondary">{personality.name}</p> : null}
      </div>
      <div className="mt-5 flex flex-col gap-4">
        <Field
          label="Display name"
          value={name}
          maxLength={24}
          onChange={(event) => {
            setName(event.target.value);
            if (!touchedHandle) setHandle(slugHandle(event.target.value));
          }}
          placeholder="What the room calls you"
        />
        <Field
          label="Username"
          value={handle}
          maxLength={16}
          onChange={(event) => {
            setTouchedHandle(true);
            setHandle(slugHandle(event.target.value));
          }}
          placeholder="handle"
        />
        <TextArea label="Bio" value={bio} maxLength={140} onChange={(event) => setBio(event.target.value)} placeholder="One line. Optional." />
      </div>
      <p className="mt-5 text-sm text-secondary">Starter object</p>
      <div className="mt-2 flex flex-col gap-3">
        {emojiGroups.slice(0, 3).map((group) => (
          <div key={group.name} className="flex gap-2 overflow-x-auto">
            {group.ids.map((id) => (
              <button
                key={id}
                type="button"
                aria-label={id}
                onClick={() => setEmoji(id)}
                className={cn("w-16 shrink-0 rounded-2xl border p-1", emoji === id ? "border-paper" : "border-transparent")}
              >
                <Collectible id={id} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line px-4 py-3">
        <span>
          <span className="block text-sm font-medium">Private profile</span>
          <span className="block text-xs text-muted">People request to follow. Your posts stay quieter.</span>
        </span>
        <Switch.Root
          checked={isPrivate}
          onCheckedChange={setPrivate}
          className="relative h-7 w-12 shrink-0 rounded-full bg-line data-[state=checked]:bg-paper"
          aria-label="Private profile"
        >
          <Switch.Thumb className="block size-6 translate-x-0.5 rounded-full bg-fg transition data-[state=checked]:translate-x-5 data-[state=checked]:bg-ink" />
        </Switch.Root>
      </label>
    </Stage>
  );
}
