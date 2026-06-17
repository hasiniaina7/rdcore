import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import InfoconsoPage from "./Infoconso";

vi.mock("../modules/usage/api/consumption.api", () => {
  return (async () => {
    const { consumptionMockData } = await import("../modules/usage/mock/consumption.mock");
    const permanentData = {
      ...consumptionMockData.data,
      summary: {
        ...consumptionMockData.data.summary,
        accountType: "permanent",
        dataCap: { raw: 858993459200, formatted: "800.0", unit: "GB" },
        dataUsed: { raw: 123, formatted: "0.0", unit: "GB" },
        dataRemaining: { raw: 858993459077, formatted: "799.9", unit: "GB" },
        percDataUsed: 0,
      },
      insights: {
        ...consumptionMockData.data.insights,
        periods: [
          { period: "hourly", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { period: "daily", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { period: "weekly", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          {
            period: "monthly",
            totalBytes: 452689552998,
            totalTimeSeconds: 128783,
            sessionCount: 9,
          },
        ],
      },
    };
    return {
      login: vi.fn(async ({ type, code, username, password }) => {
      if (type === "voucher") {
        if (!code) throw new Error("Veuillez saisir un code.");
        return consumptionMockData.data;
      }
      if (type === "user") {
        if (username === "baduser") {
          throw new Error("Nom d'utilisateur ou mot de passe incorrect.");
        }
        if (username === "tsou") {
          return permanentData;
        }
        return consumptionMockData.data;
      }
      return consumptionMockData.data;
    }),
      fetchConsumption: vi.fn(async () => consumptionMockData.data),
    };
  })();
});

beforeEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe("InfoconsoPage login flows", () => {
  it("accepts a voucher code and reaches dashboard", async () => {
    render(<InfoconsoPage />);

    const codeInput = await screen.findByLabelText(/Code voucher/i);
    fireEvent.change(codeInput, { target: { value: "demo-voucher" } });

    fireEvent.click(screen.getByRole("button", { name: /Consulter ma consommation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sessions actives/i)).toBeInTheDocument();
    });
  });

  it("rejects user login with empty credentials", async () => {
    render(<InfoconsoPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /Utilisateur/i })[0]);
    await screen.findByLabelText(/Nom d'utilisateur/i);

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Username et mot de passe requis\./i)).toBeInTheDocument();
    });
  });

  it("shows backend invalid-credentials message for user login", async () => {
    render(<InfoconsoPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /Utilisateur/i })[0]);

    fireEvent.change(await screen.findByLabelText(/Nom d'utilisateur/i), { target: { value: "baduser" } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: "wrong-password" } });

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Nom d'utilisateur ou mot de passe incorrect\./i).length).toBeGreaterThan(0);
    });
  });

  it("accepts user credentials and reaches dashboard", async () => {
    render(<InfoconsoPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /Utilisateur/i })[0]);

    fireEvent.change(await screen.findByLabelText(/Nom d'utilisateur/i), { target: { value: "tsou" } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: "hasina123" } });

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sessions actives/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/421\.6 GB/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("progressbar")[0]).toHaveAttribute("aria-valuenow", "53");
  });
});
