import {
  clearSession,
  getSession,
  updateSession,
} from "@tanstack/react-start/server";
import type { OperatorRole, OperatorSession } from "@/lib/types";

const SESSION_COOKIE = "bitcycle-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type SessionData = {
  operator?: OperatorSession;
};

type SignInInput = {
  username: string;
  password: string;
  remembered: boolean;
};

function sessionConfig(remembered = false) {
  const password = process.env.BITCYCLE_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("Configurá BITCYCLE_SESSION_SECRET con al menos 32 caracteres.");
  }

  return {
    name: SESSION_COOKIE,
    password,
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(remembered ? {} : { maxAge: undefined, expires: undefined }),
    },
  };
}

function configuredCredential(prefix: "OPERATOR" | "ADMIN") {
  const username = process.env[`BITCYCLE_${prefix}_USERNAME`]?.trim();
  const password = process.env[`BITCYCLE_${prefix}_PASSWORD`];
  if (!username || !password) {
    throw new Error(`Configurá BITCYCLE_${prefix}_USERNAME y BITCYCLE_${prefix}_PASSWORD.`);
  }
  if (password.length < 12) {
    throw new Error(`BITCYCLE_${prefix}_PASSWORD debe tener al menos 12 caracteres.`);
  }
  return { username, password };
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

function validOperator(value: unknown): value is OperatorSession {
  if (!value || typeof value !== "object") return false;
  const operator = value as Partial<OperatorSession>;
  return (
    typeof operator.username === "string" &&
    typeof operator.displayName === "string" &&
    (operator.role === "operador" || operator.role === "admin")
  );
}

export async function readOperator(): Promise<OperatorSession | null> {
  const session = await getSession<SessionData>(sessionConfig());
  return validOperator(session.data.operator) ? session.data.operator : null;
}

export async function requireOperator(): Promise<OperatorSession> {
  const operator = await readOperator();
  if (!operator) throw new Error("La sesión expiró. Iniciá sesión nuevamente.");
  return operator;
}

export async function signInOperator(data: SignInInput): Promise<OperatorSession | null> {
  const operatorCredential = configuredCredential("OPERATOR");
  const adminCredential = configuredCredential("ADMIN");
  if (operatorCredential.username.toLowerCase() === adminCredential.username.toLowerCase()) {
    throw new Error("Las credenciales de operador y administración deben tener usuarios distintos.");
  }

  const candidates: Array<{
    credential: { username: string; password: string };
    role: OperatorRole;
    displayName: string;
  }> = [
    {
      credential: operatorCredential,
      role: "operador",
      displayName: "Operador San José",
    },
    {
      credential: adminCredential,
      role: "admin",
      displayName: "Dirección Operativa",
    },
  ];

  const match = candidates.find(
    ({ credential }) =>
      credential.username.toLowerCase() === data.username.toLowerCase() &&
      constantTimeEqual(credential.password, data.password),
  );
  if (!match) return null;

  const operator: OperatorSession = {
    username: match.credential.username,
    displayName: match.displayName,
    role: match.role,
  };
  await updateSession<SessionData>(sessionConfig(data.remembered), { operator });
  return operator;
}

export async function signOutOperator(): Promise<void> {
  await clearSession(sessionConfig());
}
