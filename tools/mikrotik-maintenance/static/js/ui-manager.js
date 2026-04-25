const UI = (() => {
  const elements = {
    statusBadge: document.getElementById("statusBadge"),
    progressBar: document.getElementById("progressBar"),
    globalSpinner: document.getElementById("globalSpinner"),
    detectResult: document.getElementById("detectResult"),
    clientInfo: document.getElementById("clientInfo"),
    logOutput: document.getElementById("logOutput"),
    maintenanceBadge: document.getElementById("maintenanceBadge"),
    maintenanceTimer: document.getElementById("maintenanceTimer"),
    errorBanner: document.getElementById("errorBanner"),
  };

  const toastEl = document.getElementById("actionToast");
  const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

  const showToast = (title, message) => {
    if (!toast) return;
    document.getElementById("toastTitle").textContent = title;
    document.getElementById("toastBody").textContent = message;
    toast.show();
  };

  const setStatus = (label, type = "light") => {
    elements.statusBadge.textContent = label;
    elements.statusBadge.className = `badge rounded-pill text-bg-${type}`;
  };

  const setProgress = (percent) => {
    elements.progressBar.style.width = `${percent}%`;
  };

  const setSpinner = (active) => {
    elements.globalSpinner.classList.toggle("d-none", !active);
  };

  const updateDetectResult = (data) => {
    if (!data) return;
    elements.detectResult.innerHTML = `
      <div class="alert alert-success mb-0">
        <div><strong>MikroTik:</strong> ${data.mikrotik_ip || "-"}</div>
        <div><strong>Name:</strong> ${data.mikrotik_name || "-"}</div>
        <div><strong>Type:</strong> ${data.connection_type || "-"}</div>
      </div>
    `;
  };

  const updateClientInfo = (client) => {
    if (!client) return;
    elements.clientInfo.innerHTML = `
      <div class="alert alert-info mb-0">
        <div><strong>Client IP:</strong> ${client.ip || "-"}</div>
        <div><strong>MAC:</strong> ${client.mac || "-"}</div>
        <div><strong>Name:</strong> ${client.name || "-"}</div>
        <div><strong>Source:</strong> ${client.source || "-"}</div>
      </div>
    `;

    const macField = document.getElementById("clientMac");
    const nameField = document.getElementById("clientName");
    const manualMode = localStorage.getItem("manual_mode") === "1";
    if (!manualMode) {
      if (macField && client.mac) {
        macField.value = client.mac;
        localStorage.setItem("field_clientMac", client.mac);
      }
      if (nameField && client.name) {
        nameField.value = client.name;
        localStorage.setItem("field_clientName", client.name);
      }
    }
  };

  const updateLogs = (logs) => {
    elements.logOutput.innerHTML = logs.map((line) => `<div>${line}</div>`).join("");
    elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
  };

  const setMaintenanceState = (active) => {
    if (active) {
      elements.maintenanceBadge.className = "badge text-bg-success";
      elements.maintenanceBadge.textContent = "Active";
    } else {
      elements.maintenanceBadge.className = "badge text-bg-warning";
      elements.maintenanceBadge.textContent = "Inactive";
    }
  };

  const updateTimer = (startIso) => {
    if (!startIso) {
      elements.maintenanceTimer.textContent = "00:00:00";
      return;
    }
    const start = new Date(startIso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - start);
    const totalSeconds = Math.floor(diff / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    elements.maintenanceTimer.textContent = `${hours}:${minutes}:${seconds}`;
  };

  const updateFromSession = (session) => {
    if (!session) return;
    setMaintenanceState(session.maintenance_active);
    updateTimer(session.maintenance_started_at);

    if (elements.errorBanner) {
      if (session.error) {
        let message = session.error;
        if (session.error.toLowerCase().includes("client not found")) {
          message += " — Passez en saisie manuelle si nécessaire.";
        }
        elements.errorBanner.textContent = message;
        elements.errorBanner.classList.remove("d-none");
      } else {
        elements.errorBanner.classList.add("d-none");
        elements.errorBanner.textContent = "";
      }
    }

    if (session.data && session.data.client) {
      updateClientInfo(session.data.client);
    }
    if (session.data && session.data.mikrotik_ip) {
      updateDetectResult(session.data);
    }

    const stateMap = {
      idle: { label: "Idle", progress: 0 },
      detecting: { label: "Detecting", progress: 20 },
      detected: { label: "Detected", progress: 30 },
      fetching_client: { label: "Fetching Client", progress: 45 },
      client_ready: { label: "Client Ready", progress: 60 },
      activating: { label: "Activating", progress: 75 },
      active: { label: "Active", progress: 85 },
      deactivating: { label: "Deactivating", progress: 90 },
      completed: { label: "Completed", progress: 100 },
      error: { label: "Error", progress: 100, type: "danger" },
    };

    const state = stateMap[session.state] || stateMap.idle;
    setStatus(state.label, state.type || "light");
    setProgress(state.progress);
    setSpinner(["detecting", "fetching_client", "activating", "deactivating"].includes(session.state));

    if (session.state === "error" && session.error) {
      const lastError = localStorage.getItem("last_error");
      if (lastError !== session.error) {
        localStorage.setItem("last_error", session.error);
        showToast("Erreur", session.error);
      }
    }
  };

  return {
    showToast,
    updateDetectResult,
    updateClientInfo,
    updateLogs,
    updateFromSession,
    setSpinner,
  };
})();
