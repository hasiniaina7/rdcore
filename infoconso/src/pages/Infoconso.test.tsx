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
      if (!username || !password) throw new Error("Username et mot de passe requis.");
      return consumptionMockData.data;
    }),
    fetchConsumption: vi.fn(async () => consumptionMockData.data),
  };
});

describe("InfoconsoPage login flows", () => {
  it("accepts a voucher code and reaches dashboard", async () => {
    render(<InfoconsoPage />);

    const codeInput = await screen.findByLabelText(/Code voucher/i);
    fireEvent.change(codeInput, { target: { value: "ableexperience" } });

    fireEvent.click(screen.getByRole("button", { name: /Consulter ma consommation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sessions actives/i)).toBeInTheDocument();
    });
  });

  it("rejects user password not starting with username", async () => {
    render(<InfoconsoPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /Utilisateur/i })[0]);

    fireEvent.change(await screen.findByLabelText(/Nom d'utilisateur/i), { target: { value: "hasina" } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: "wrong" } });

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Mot de passe incorrecte/i)).toBeInTheDocument();
    });
  });

  it("accepts user credentials when password starts with username", async () => {
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
