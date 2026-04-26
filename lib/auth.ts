import crypto from "crypto";
import { headers } from "next/headers";
import { prisma } from "./prisma";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function requireApiToken(): Promise<void> {
  const h = await headers();
  const auth = h.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing bearer token");
  }

  const token = auth.slice("Bearer ".length).trim();
  const tokenHash = sha256(token);

  const existing = await prisma.apiToken.findFirst({
    where: {
      tokenHash,
      deletedAt: null
    }
  });

  if (!existing) {
    throw new Error("Invalid API token");
  }

  if (existing.expiresAt && existing.expiresAt < new Date()) {
    throw new Error("Expired API token");
  }

  await prisma.apiToken.update({
    where: { id: existing.id },
    data: { lastUsedAt: new Date() }
  });
}
