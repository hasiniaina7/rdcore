const Api = (() => {
  // Use relative paths so the UI works on the same host where the Flask app is running.
  const base = "";

  const getSessionId = () => localStorage.getItem("maintenance_session_id");
  const setSessionId = (id) => localStorage.setItem("maintenance_session_id", id);

  const request = async (url, payload = null, method = "POST") => {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (payload) {
      options.body = JSON.stringify(payload);
    }
    const response = await fetch(`${base}${url}`, options);
    const data = await response.json();
    if (data.session && data.session.id) {
      setSessionId(data.session.id);
    }
    return data;
  };

  const detectMikrotik = (ip_client) =>
    request("/api/detect-mikrotik", { ip_client, session_id: getSessionId() });

  const getClientInfo = (payload) =>
    request("/api/get-client-info", { ...payload, session_id: getSessionId() });

  const activateBypass = (payload) =>
    request("/api/activate-bypass", { ...payload, session_id: getSessionId() });

  const deactivateBypass = (payload) =>
    request("/api/deactivate-bypass", { ...payload, session_id: getSessionId() });

  const finishMaintenance = (payload) =>
    request("/api/finish-maintenance", { ...payload, session_id: getSessionId() });

  const getStatus = () => {
    const session_id = getSessionId();
    return request(`/api/maintenance-status?session_id=${session_id || ""}`, null, "GET");
  };

  const getLogs = () => request("/api/logs", null, "GET");

  return {
    detectMikrotik,
    getClientInfo,
    activateBypass,
    deactivateBypass,
    finishMaintenance,
    getStatus,
    getLogs,
    getSessionId,
  };
})();
