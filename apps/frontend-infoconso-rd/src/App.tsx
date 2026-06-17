import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import InfoconsoPage from "./pages/Infoconso";
import Support from "./pages/Support";
import Terms from "./pages/Terms";

export default function App() {
  const basename = import.meta.env.VITE_APP_BASENAME || "/";
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<InfoconsoPage />} />
        <Route path="support" element={<Support />} />
        <Route path="terms" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
