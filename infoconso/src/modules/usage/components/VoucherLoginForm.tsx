import React from "react";

type Props = {
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string;
};

export function VoucherLoginForm({ code, onCodeChange, onSubmit, loading, error }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="ic-form" onSubmit={handleSubmit}>
      <div className="ic-field">
        <label className="ic-label" htmlFor="voucher-code">Code voucher</label>
        <input
          id="voucher-code"
          name="voucher-code"
          className="ic-input"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="Saisissez votre code"
          autoComplete="username"
        />
        <div className="ic-helper">Pour un voucher, le mot de passe est identique.</div>
      </div>

      {error && <div className="ic-helper" style={{ color: "var(--ic-danger)" }}>{error}</div>}

      <button className="ic-button" type="submit" disabled={loading}>
        {loading ? "Connexion..." : "Consulter ma consommation"}
      </button>
    </form>
  );
}
