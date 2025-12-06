import React from "react";

type Props = {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string;
};

export function UserLoginForm({ username, password, onUsernameChange, onPasswordChange, onSubmit, loading, error }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="ic-form" onSubmit={handleSubmit}>
      <div className="ic-field">
        <label className="ic-label" htmlFor="ic-username">Nom d'utilisateur</label>
        <input
          id="ic-username"
          name="username"
          className="ic-input"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="ex: hasina"
          autoComplete="username"
        />
      </div>

      <div className="ic-field">
        <label className="ic-label" htmlFor="ic-password">Mot de passe</label>
        <input
          id="ic-password"
          name="password"
          type="password"
          className="ic-input"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      {error && <div className="ic-helper" style={{ color: "var(--ic-danger)" }}>{error}</div>}

      <button className="ic-button" type="submit" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
