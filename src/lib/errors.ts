export function errorMessage(error: unknown, fallback = "No se pudo completar la operación."): string {
  if (error instanceof Error && error.message) {
    const msg = error.message;
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      return "Sin conexión con el servidor. Reintentá cuando vuelva la red.";
    }
    return msg;
  }
  if (typeof error === "string" && error) return error;
  return fallback;
}
