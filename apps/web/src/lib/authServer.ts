import crypto from "crypto";
import type { NextRequest } from "next/server";
import outputs from "../../amplify_outputs.json";

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

  // Cognito
  aud?: string; // mainly id token
  client_id?: string; // mainly access token
  iss?: string;
  exp?: number;
  token_use?: "id" | "access";

  email?: string;
  "cognito:username"?: string;
};

export type AuthResult = {
  userId: string;
  username?: string;
  email?: string;
  tokenUse?: "id" | "access";
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

  // 有効キャッシュがあればそれを使う
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }

  // 更新しに行く。失敗したら古いキャッシュがあればそれで耐える
  try {
    const res = await fetch(JWKS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`failed to fetch jwks: ${res.status}`);

    const data = (await res.json()) as { keys?: Jwk[] };
    const keys = Array.isArray(data.keys) ? data.keys : [];
    jwksCache = { keys, fetchedAt: now };
    return keys;
  } catch (e) {
    if (jwksCache?.keys?.length) return jwksCache.keys;
    throw e;
  }
}

function assertBasicClaims(payload: JwtPayload) {
  if (payload.iss !== ISSUER) throw new Error("invalid issuer");
  if (!payload.exp) throw new Error("exp missing");
  if (Date.now() >= payload.exp * 1000) throw new Error("token expired");

  // token_use は必須（Cognitoの仕様上ある）
  if (payload.token_use !== "id" && payload.token_use !== "access") {
    throw new Error("invalid token use");
  }

  // audience / client_id 検証
  // - id token: aud が clientId
  // - access token: client_id が clientId
  if (payload.token_use === "id") {
    if (payload.aud !== CLIENT_ID) throw new Error("invalid audience");
  } else {
    if (payload.client_id !== CLIENT_ID) throw new Error("invalid client_id");
  }
}

async function verifyJwt(token: string): Promise<JwtPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("invalid token");

  const [headerB64, payloadB64, signatureB64] = parts;

  const header = JSON.parse(base64UrlDecode(headerB64).toString("utf8")) as {
    kid?: string;
    alg?: string;
  };
  const payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8")) as JwtPayload;

  if (header.alg && header.alg !== "RS256") throw new Error("unsupported alg");
  if (!header.kid) throw new Error("kid missing");

  assertBasicClaims(payload);

  const jwks = await loadJwks();
  const key = jwks.find((k) => k.kid === header.kid);
  if (!key) throw new Error("key not found");

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
      tokenUse: payload.token_use,
    };
  } catch {
    return null;
  }
}
