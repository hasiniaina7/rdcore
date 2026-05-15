import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InfoconsoPage from "./Infoconso";
import { consumptionMockData } from "../modules/usage/mock/consumption.mock";

vi.mock("../modules/usage/api/consumption.api", () => {
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
        return consumptionMockData.data;
      }
      return consumptionMockData.data;
    }),
    fetchConsumption: vi.fn(async () => consumptionMockData.data),
  };
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
      expect(screen.getByText(/Nom d'utilisateur ou mot de passe incorrect\./i)).toBeInTheDocument();
    });
  });

  it("accepts user credentials and reaches dashboard", async () => {
    render(<InfoconsoPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /Utilisateur/i })[0]);

    fireEvent.change(await screen.findByLabelText(/Nom d'utilisateur/i), { target: { value: "hasina" } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: "hasina123" } });

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sessions actives/i)).toBeInTheDocument();
    });
  });
});
