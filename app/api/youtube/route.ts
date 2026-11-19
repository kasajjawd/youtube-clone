import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_USERS = [
  {
    id: "seed-1",
    email: "alex@yewtube.tv",
    name: "Alex Rivera",
    handle: "@alexbuilds",
    color: "bg-emerald-600",
    bio: "Full-stack developer & tech reviewer on YewTube.",
    joinedAt: "2026",
    favoriteTopics: ["Programming", "Tech"],
  },
  {
    id: "seed-2",
    email: "maya@yewtube.tv",
    name: "Maya Lin",
    handle: "@mayabeats",
    color: "bg-purple-600",
    bio: "Lo-fi producer, synth collector, and late-night coder.",
    joinedAt: "2026",
    favoriteTopics: ["Music", "Gaming"],
  },
];

let memoryUsers = [...DEFAULT_USERS];

export async function GET() {
  return NextResponse.json({
    users: memoryUsers.map(({ ...u }) => u),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, name, handle, bio, color } = body;

    if (action === "signin") {
      const existing = memoryUsers.find(
        (u) => u.email.toLowerCase() === String(email).toLowerCase()
      );
      if (!existing) {
        return NextResponse.json(
          { error: "No account found with that email. Create one first!" },
          { status: 404 }
        );
      }
      return NextResponse.json({ user: existing });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: String(email),
      name: String(name || "YewTuber"),
      handle: String(handle || "@yewtuber"),
      color: String(color || "bg-emerald-600"),
      bio: String(bio || "Watching on YewTube."),
      joinedAt: "2026",
      favoriteTopics: [],
    };

    memoryUsers = [
      newUser,
      ...memoryUsers.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase()),
    ];

    return NextResponse.json({ user: newUser });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
