import crypto from "crypto";
import type { NextRequest } from "next/server";
import outputs from "@/amplify_outputs.json";

const REGION = outputs.auth.aws_region;
const USER_POOL_ID = outputs.auth.user_pool_id;
const CLIENT_ID = outputs.auth.user_pool_client_id;
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;
const JWKS_TTL_MS = 6 * 60 * 60 * 1000;

type Jwk = {
  kid: string;
  kty: string;
  alg?: string;
  use?: string;
  n: string;
  e: string;
};

type JwtPayload = {
  sub: string;
  aud?: string;
  iss?: string;
  exp?: number;
  token_use?: string;
  email?: string;
  "cognito:username"?: string;
};

type AuthResult = {
  userId: string;
  username?: string;
  email?: string;
};

type JwksCache = {
  keys: Jwk[];
  fetchedAt: number;
};

let jwksCache: JwksCache | null = null;

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = 4 - (normalized.length % 4 || 4);
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64");
}

async function loadJwks(): Promise<Jwk[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }

  const res = await fetch(JWKS_URL);
  if (!res.ok) {
    throw new Error("failed to fetch jwks");
  }
  const data = (await res.json()) as { keys?: Jwk[] };
  const keys = Array.isArray(data.keys) ? data.keys : [];
  jwksCache = { keys, fetchedAt: now };
  return keys;
}

async function verifyJwt(token: string): Promise<JwtPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("invalid token");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlDecode(headerB64).toString("utf8")) as { kid?: string; alg?: string };
  const payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8")) as JwtPayload;

  if (payload.iss !== ISSUER) throw new Error("invalid issuer");
  if (payload.aud && payload.aud !== CLIENT_ID) throw new Error("invalid audience");
  if (payload.token_use !== "id") throw new Error("invalid token use");
  if (payload.exp && Date.now() >= payload.exp * 1000) throw new Error("token expired");

  const jwks = await loadJwks();
  const key = jwks.find((k) => k.kid === header.kid);
  if (!key) throw new Error("key not found");

  if (header.alg && header.alg !== "RS256") throw new Error("unsupported alg");

  const publicKey = crypto.createPublicKey({ key, format: "jwk" });
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();

  const signature = base64UrlDecode(signatureB64);
  const ok = verifier.verify(publicKey, signature);
  if (!ok) throw new Error("invalid signature");

  return payload;
}

export async function requireAuth(req: NextRequest): Promise<AuthResult | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    const payload = await verifyJwt(match[1]);
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      username: payload["cognito:username"],
      email: payload.email,
    };
  } catch {
    return null;
  }
}
