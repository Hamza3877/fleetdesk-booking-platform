import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { UnauthorizedError } from "@/server/errors";


export const SESSION_COOKIE = "fd_session";
const SESSION_SECONDS = 60 * 60 * 8;

const secret = () => process.env.AUTH_SECRET ?? "fleetdesk-local-dev-secret-change-me";
const ownerEmail = () => process.env.OWNER_EMAIL ?? "owner@fleetdesk.dev";
const ownerPassword = () => process.env.OWNER_PASSWORD ?? "demo1234";

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

export function checkCredentials(email: string, password: string): boolean {
  return safeEqual(email.toLowerCase(), ownerEmail().toLowerCase()) && safeEqual(password, ownerPassword());
}

export function createSessionToken(email: string, now: number = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: now + SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined, now: number = Date.now()): { email: string } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email: string; exp: number };
    return data.exp > now ? { email: data.email } : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(email: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true, // JavaScript in the browser can't read it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ email: string } | null> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireOwner(): Promise<{ email: string }> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export const demoCredentials = () => ({ email: ownerEmail(), password: ownerPassword() });
