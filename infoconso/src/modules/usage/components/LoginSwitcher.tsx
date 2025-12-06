import React from "react";
import { LoginType } from "../types";

type Props = {
  value: LoginType;
  onChange: (value: LoginType) => void;
};

export function LoginSwitcher({ value, onChange }: Props) {
  return (
    <div className="ic-tabs" role="tablist" aria-label="Choix du mode de connexion">
      {[
        { value: "voucher" as const, label: "Voucher" },
        { value: "user" as const, label: "Utilisateur" },
      ].map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={`ic-tab ${value === tab.value ? "active" : ""}`}
          aria-pressed={value === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
