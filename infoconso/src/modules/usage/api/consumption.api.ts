import { mockFetchConsumption, mockLogin } from "../mock/consumption.mock";
import { ConsumptionData, LoginPayload } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_TIMEOUT_MS = Number.parseInt(import.meta.env.VITE_API_TIMEOUT_MS || "15000", 10) || 15000;
const hasRealApi = API_BASE_URL && !API_BASE_URL.includes("example.com");

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!hasRealApi) {
    throw new Error("API base non configurée, bascule sur mock.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Compte introuvable ou identifiants incorrects.");
      }
      if (res.status >= 500) {
        throw new Error("Service indisponible, réessayez plus tard.");
      }
      throw new Error(`Erreur API ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Thin API layer. Swap mock* calls with real fetch('/api/...') later.
 */
export async function login(payload: LoginPayload): Promise<ConsumptionData> {
  try {
    if (hasRealApi) {
      let body: { username: string; password: string };
      if (payload.type === "voucher") {
        body = { username: payload.code, password: payload.code };
      } else {
        body = { username: payload.username, password: payload.password };
      }

      const res = await fetchJson<{ success: boolean; data: ConsumptionData }>("/consumption/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.success) throw new Error("Échec authentification");
      return res.data;
    }
  } catch (err) {
    if (hasRealApi) {
      throw err;
    }
  }

  if (payload.type === "voucher") {
    await mockLogin("voucher", payload.code, payload.code);
  } else {
    await mockLogin("user", payload.username, payload.password);
  }
  const response = await mockFetchConsumption();
  if (!response.success) {
    throw new Error("Impossible de récupérer la consommation");
  }
  return response.data;
}

export async function fetchConsumption(): Promise<ConsumptionData> {
  try {
    if (hasRealApi) {
      const data = await fetchJson<{ success: boolean; data: ConsumptionData }>("/consumption/login", {
        method: "GET",
      });
      if (!data.success) throw new Error("API a répondu sans succès");
      return data.data;
    }
  } catch (err) {
    if (hasRealApi) {
      throw err;
    }
  }

  const response = await mockFetchConsumption();
  if (!response.success) {
    throw new Error("Impossible de récupérer la consommation");
  }
  return response.data;
}
