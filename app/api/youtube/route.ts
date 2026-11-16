import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_USERS = [
  {
    id: "user-1",
    email: "alex@yewtube.app",
    password: "demo",
    name: "Alex Rivera",
    handle: "@alexbuilds",
    color: "bg-blue-600",
    bio: "Full-stack tinkerer, mechanical keyboards, and late-night lofi.",
    joinedAt: "2026-01-12",
    favoriteTopics: ["Programming", "Tech", "Lofi"],
  },
  {
    id: "user-2",
    email: "maya@yewtube.app",
    password: "demo",
    name: "Maya Lin",
    handle: "@mayagames",
    color: "bg-purple-600",
    bio: "Variety gaming streams, speedruns, and indie reviews.",
    joinedAt: "2026-02-04",
    favoriteTopics: ["Gaming", "Speedruns", "Indie"],
  },
  {
    id: "user-3",
    email: "sam@yewtube.app",
    password: "demo",
    name: "Samir Patel",
    handle: "@samir4k",
    color: "bg-emerald-600",
    bio: "Cinematography, 4K HDR travel films, and sound design.",
    joinedAt: "2026-03-19",
    favoriteTopics: ["4K HDR", "Travel", "Filmmaking"],
  },
];

// Fallback in-memory store if database env vars aren't connected yet
let memoryUsers = [...DEFAULT_USERS];

async function getStoredUsers() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return memoryUsers;

  try {
    const res = await fetch(`${url}/get/yewtube_users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    if (data?.result) {
      return JSON.parse(data.result);
    }
    // Seed initial users into database on first run
    await saveStoredUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  } catch {
    return memoryUsers;
  }
}

async function saveStoredUsers(users: any[]) {
  memoryUsers = users;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return;

  await fetch(`${url}/set/yewtube_users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(JSON.stringify(users)),
  });
}

// GET all registered users (with passwords stripped for public directory)
export async function GET() {
  const users = await getStoredUsers();
  const publicUsers = users.map(({ password, ...safeUser }: any) => safeUser);
  return NextResponse.json({ users: publicUsers });
}

// POST register, sign in, or update profile
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  const users = await getStoredUsers();

  if (action === "register") {
    const emailClean = (body.email || "").trim().toLowerCase();
    if (!emailClean || !emailClean.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if ((body.password || "").length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
    }
    if (users.some((u: any) => u.email.toLowerCase() === emailClean)) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 400 });
    }

    const cleanName = (body.name || "").trim() || emailClean.split("@")[0];
    const rawHandle = (body.handle || "").trim() || cleanName.toLowerCase().replace(/\s+/g, "");
    const formattedHandle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;

    const newUser = {
      id: `user-${Date.now()}`,
      email: emailClean,
      password: body.password,
      name: cleanName,
      handle: formattedHandle,
      color: body.color || "bg-emerald-600",
      bio: (body.bio || "").trim() || "New YewTube creator and viewer.",
      joinedAt: new Date().toISOString().slice(0, 10),
      favoriteTopics: ["Trending"],
    };

    const updated = [newUser, ...users];
    await saveStoredUsers(updated);

    const { password, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser });
  }

  if (action === "signin") {
    const emailClean = (body.email || "").trim().toLowerCase();
    const matched = users.find(
      (u: any) => u.email.toLowerCase() === emailClean && u.password === body.password
    );
    if (!matched) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const { password, ...safeUser } = matched;
    return NextResponse.json({ user: safeUser });
  }

  if (action === "update") {
    const { userId, updates } = body;
    let updatedUser: any = null;
    const updatedList = users.map((u: any) => {
      if (u.id === userId) {
        updatedUser = { ...u, ...updates };
        return updatedUser;
      }
      return u;
    });
    if (updatedUser) {
      await saveStoredUsers(updatedList);
      const { password, ...safeUser } = updatedUser;
      return NextResponse.json({ user: safeUser });
    }
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
