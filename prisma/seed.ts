import { PrismaClient, Rarity, SceneVisibility } from "@prisma/client";

const prisma = new PrismaClient();

const ranks = [
  ["NEW_FACE", "New Face", 0],
  ["REGULAR", "Regular", 100],
  ["FAMILIAR", "Familiar", 300],
  ["VIBE_CURATOR", "Vibe Curator", 700],
  ["SCENE_CONNECTOR", "Scene Connector", 1500],
  ["CULTURE_KEEPER", "Culture Keeper", 3000],
  ["SCENE_LEGEND", "Scene Legend", 6000],
  ["ICON", "Icon", 12000],
  ["GRANDMASTER", "Grandmaster", 25000],
  ["CLUB_ROYALTY", "Club Royalty", 50000],
] as const;

const catalogueNames = [
  "Crown","Red Crown","Black Crown","Royal Seal","Throne","Royal Ring","Royal Flame","Imperial Star","Royal Wings","Golden Crest",
  "Night Owl","Afterhours","Midnight Star","Moon Walker","Neon Pulse","Club Key","Night Pass","DJ Deck","Disco Ball","Night Mayor",
  "Headphones","Microphone","Vinyl","Soundwave","Speaker","Music Note","Bass Drop","Producer","Studio Rat","Sound Architect",
  "Rebel","Phantom","Mask","Misfit","Ghost","Electric Soul","Outsider","Wildcard","Black Sheep","Unbothered",
  "Drip","Sneakerhead","Fashion Curator","Diamond","Style Icon","Runway","Street King","Trendsetter","Mirror","Fashion House",
  "Connector","Social Butterfly","Conversation Starter","Community Builder","Squad Captain","Networker","Friend of the Club","Culture Connector","Host","People’s Choice",
  "Camera","Artist","Designer","Film Director","Writer","Photographer","Visionary","Creative Mind","Architect","Storyteller",
  "Unknown","Shadow","Observer","Oracle","Secret Agent","Silent Legend","Hidden Gem","Enigma","Cipher","The Watcher",
  "Warrior","Champion","Challenger","Gladiator","Winner","Game Master","Elite Player","Streak Master","Rising Star","The Finisher",
  "Founding Member","Beta Pioneer","First 100","Scene Founder","Squad Founder","Culture Ambassador","Nochalant Original","Anniversary Icon","Festival Pass","Limited Edition",
  "Flame Keeper","Vibe Architect","Sound Hunter","City Explorer","Foodie","Traveller","Film Head","Gamer","Bookworm","Tech Head",
  "Soft Life","Street Reporter","Debate Champion","Voice Room Host","Listening Room Regular","Music Critic","Event Insider","Scene Historian","Squad Legend","Club Royalty",
] as const;

const starterIdentities = ["The Observer", "The Rebel", "The Music Head", "The Night Owl", "The Curator", "The Creative", "The Connector", "The Social One"] as const;

const iconCategories = ["Royalty","Nightlife","Music","Alternative Culture","Fashion","Social","Creative","Mystery","Competitive","Exclusive","Culture","Culture"] as const;
const starterScenes = [
  ["alte-society","Alté Society","Alternative culture, music, fashion and creative expression.","MUSIC"],
  ["afterhours","Afterhours","Nightlife, clubs, events and afterparty stories.","NIGHTLIFE"],
  ["sound-district","Sound District","New music, unreleased drops, producers and artist talks.","MUSIC"],
  ["the-drip-room","The Drip Room","Outfits, sneakers, style and fashion battles.","FASHION"],
  ["lagos-unfiltered","Lagos Unfiltered","Lagos stories, city culture and honest conversations.","LIFESTYLE"],
  ["creative-misfits","Creative Misfits","A home for independent minds and unusual ideas.","CREATIVE"],
  ["no-sleep-club","No Sleep Club","Late-night conversations, plans and city energy.","NIGHTLIFE"],
  ["the-film-room","The Film Room","Film, series, Nollywood and screen culture.","ENTERTAINMENT"],
] as const;

async function main() {
  for (const [code, name, minXp] of ranks) {
    await prisma.rankDefinition.upsert({
      where: { code },
      update: { name, minXp },
      create: { code, name, minXp, description: `${name} rank in Nochalant Club.` },
    });
  }

  const plans = [
    { code: "FREE", name: "Free", description: "Your place in the Club.", priceKobo: 0n, entitlements: { scenes: "public", squads: "standard", profile: "basic" } },
    { code: "INNER_CIRCLE", name: "Inner Circle", description: "More ways to customise and participate.", priceKobo: 150000n, entitlements: { premiumScenes: true, profileThemes: true, seasonalIcons: true } },
    { code: "BLACK_CARD", name: "Black Card", description: "The highest tier of Club access.", priceKobo: 500000n, entitlements: { innerCircle: true, exclusiveExperiences: true, premiumCollections: true } },
  ];
  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { code: plan.code },
      update: { name: plan.name, description: plan.description, priceKobo: plan.priceKobo, entitlements: plan.entitlements },
      create: { ...plan, currency: "NGN", interval: "MONTH" },
    });
  }

  const allIcons = [
    ...catalogueNames.map((name, index) => ({
      id: `identity-${String(index + 1).padStart(3, "0")}`,
      name,
      category: iconCategories[Math.floor(index / 10)] ?? "Culture",
      rarity: index < 20 ? Rarity.COMMON : index < 50 ? Rarity.UNCOMMON : index < 85 ? Rarity.RARE : index < 108 ? Rarity.EPIC : Rarity.LEGENDARY,
      unlockCondition: index < 10 ? { type: "STARTER_OR_ACTIVITY" } : { type: "ACHIEVEMENT_OR_ADMIN" },
    })),
    ...starterIdentities.map((name, index) => ({
      id: `starter-${String(index + 1).padStart(3, "0")}`,
      name,
      category: "Starter",
      rarity: Rarity.COMMON,
      unlockCondition: { type: "STARTER" },
    })),
  ];

  for (const icon of allIcons) {
    await prisma.iconCatalog.upsert({
      where: { id: icon.id },
      update: { name: icon.name, category: icon.category, rarity: icon.rarity, unlockCondition: icon.unlockCondition, active: true },
      create: {
        ...icon,
        description: `${icon.name} identity from the Nochalant Club collection.`,
        svgPath: `/icons/identities/${icon.id}.svg`,
      },
    });
  }

  const seedOwner = await prisma.user.upsert({
    where: { email: "seed-owner@nochalant.local" },
    update: { displayName: "Nochalant Club Seed" },
    create: {
      email: "seed-owner@nochalant.local",
      username: "nochalant-seed-owner",
      displayName: "Nochalant Club Seed",
      passwordHash: "DISABLED_SEED_ACCOUNT_CANNOT_SIGN_IN",
    },
  });

  for (const [slug, name, description, category] of starterScenes) {
    await prisma.scene.upsert({
      where: { slug },
      update: { name, description, category, visibility: SceneVisibility.PUBLIC },
      create: {
        founderId: seedOwner.id,
        name, slug, description, category,
        visibility: SceneVisibility.PUBLIC,
        rules: { rules: ["Respect other members.", "No harassment or doxxing.", "Keep posts relevant.", "Report harmful content."] },
      },
    });
  }
}

main().finally(async () => prisma.$disconnect());
