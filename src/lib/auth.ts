import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OperatorSession } from "@/lib/types";

const readOperatorServer = createServerOnlyFn(async () => {
  const { readOperator } = await import("@/lib/auth.server");
  return readOperator();
});

export const requireOperator = createServerOnlyFn(async () => {
  const { requireOperator: requireServerOperator } = await import("@/lib/auth.server");
  return requireServerOperator();
});

export const getCurrentOperator = createServerFn({ method: "GET" }).handler(() =>
  readOperatorServer(),
);

export const signIn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      username: z.string().trim().min(1).max(80),
      password: z.string().min(1).max(200),
      remembered: z.boolean(),
    }),
  )
  .handler(async ({ data }): Promise<OperatorSession | null> => {
    const { signInOperator } = await import("@/lib/auth.server");
    return signInOperator(data);
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { signOutOperator } = await import("@/lib/auth.server");
  await signOutOperator();
});
