const State = {
  pollInterval: null,
  logInterval: null,
  timerInterval: null,
  pendingAction: null,
};

const saveField = (id) => {
  const el = document.getElementById(id);
  if (el) localStorage.setItem(`field_${id}`, el.value);
};

const loadField = (id) => {
  const el = document.getElementById(id);
  if (el) el.value = localStorage.getItem(`field_${id}`) || "";
};

const initFields = () => {
  [
    "ipClient",
    "clientIpConfirmed",
    "clientMac",
    "clientName",
  ].forEach((id) => {
    loadField(id);
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => saveField(id));
    }
  });
};

const setManualMode = (enabled) => {
  const macField = document.getElementById("clientMac");
  const nameField = document.getElementById("clientName");
  const toggleBtn = document.getElementById("toggleManualBtn");
  if (macField) macField.readOnly = !enabled;
  if (nameField) nameField.readOnly = !enabled;
  if (toggleBtn) {
    toggleBtn.classList.toggle("btn-outline-secondary", !enabled);
    toggleBtn.classList.toggle("btn-warning", enabled);
    toggleBtn.textContent = enabled ? "Saisie automatique" : "Saisie manuelle";
  }
  localStorage.setItem("manual_mode", enabled ? "1" : "0");
};

const initManualMode = () => {
  const enabled = localStorage.getItem("manual_mode") === "1";
  setManualMode(enabled);
};

const validateIp = (ip) => {
  const regex = /^\d{1,3}(\.\d{1,3}){3}$/;
  if (!regex.test(ip)) return false;
  return ip.split(".").every((part) => Number(part) >= 0 && Number(part) <= 255);
};

const setButtonLoading = (button, loading) => {
  if (!button) return;
  const spinner = button.querySelector(".spinner-border");
  const label = button.querySelector(".btn-label");
  button.disabled = loading;
  if (spinner) spinner.classList.toggle("d-none", !loading);
  if (label) label.classList.toggle("opacity-75", loading);
};

const setPendingAction = (action) => {
  State.pendingAction = action;
  if (action) {
    localStorage.setItem("pending_action", action);
  } else {
    localStorage.removeItem("pending_action");
  }
};

const loadPendingAction = () => {
  State.pendingAction = localStorage.getItem("pending_action");
};

const updateLoadingFromSession = (session, buttons) => {
  if (!session) return;
  const pending = State.pendingAction;

  const stopIfDone = (targetStates) => {
    if (targetStates.includes(session.state) || session.state === "error") {
      setPendingAction(null);
    }
  };

  if (pending === "detecting") {
    stopIfDone(["detected"]);
  } else if (pending === "fetching_client") {
    stopIfDone(["client_ready"]);
  } else if (pending === "activating") {
    stopIfDone(["active"]);
  } else if (pending === "deactivating") {
    stopIfDone(["completed"]);
  }

  setButtonLoading(buttons.detectBtn, pending === "detecting");
  setButtonLoading(buttons.clientInfoBtn, pending === "fetching_client");
  setButtonLoading(buttons.activateBtn, pending === "activating");
  setButtonLoading(buttons.deactivateBtn, pending === "deactivating");
  setButtonLoading(buttons.finishBtn, pending === "deactivating");
};

const wireEvents = () => {
  const ipForm = document.getElementById("ipForm");
  const detectBtn = document.getElementById("detectBtn");
  const clientForm = document.getElementById("clientForm");
  const activateBtn = document.getElementById("activateBtn");
  const deactivateBtn = document.getElementById("deactivateBtn");
  const finishBtn = document.getElementById("finishBtn");
  const toggleManualBtn = document.getElementById("toggleManualBtn");
  const ipValidateBtn = document.getElementById("ipValidateBtn");
  const clientInfoBtn = document.getElementById("clientInfoBtn");

  const buttons = { detectBtn, clientInfoBtn, activateBtn, deactivateBtn, finishBtn };

  ipForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const ipClient = document.getElementById("ipClient").value.trim();
    setButtonLoading(ipValidateBtn, true);
    if (!validateIp(ipClient)) {
      ipForm.classList.add("was-validated");
      UI.showToast("Validation", "Invalid IP format");
      setButtonLoading(ipValidateBtn, false);
      return;
    }
    document.getElementById("clientIpConfirmed").value = ipClient;
    saveField("clientIpConfirmed");
    UI.showToast("Validation", "IP validated");
    setButtonLoading(ipValidateBtn, false);
  });

  detectBtn.addEventListener("click", async () => {
    const ipClient = document.getElementById("ipClient").value.trim();
    setButtonLoading(detectBtn, true);
    if (!validateIp(ipClient)) {
      UI.showToast("Validation", "Invalid IP format");
      setButtonLoading(detectBtn, false);
      return;
    }
    setPendingAction("detecting");
    UI.setSpinner(true);
    const data = await Api.detectMikrotik(ipClient);
    UI.setSpinner(false);
    if (data.status === "error") {
      setPendingAction(null);
      setButtonLoading(detectBtn, false);
      UI.showToast("Error", data.message || "Detection failed");
      return;
    }
    UI.updateFromSession(data.session);
    UI.showToast("Detection", data.message || "Detection started");
  });

  clientForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      ip_client: document.getElementById("clientIpConfirmed").value.trim(),
    };
    setButtonLoading(clientInfoBtn, true);
    if (!validateIp(payload.ip_client)) {
      UI.showToast("Validation", "Invalid IP format");
      setButtonLoading(clientInfoBtn, false);
      return;
    }
    setPendingAction("fetching_client");
    UI.setSpinner(true);
    const data = await Api.getClientInfo(payload);
    UI.setSpinner(false);
    if (data.status === "error") {
      setPendingAction(null);
      setButtonLoading(clientInfoBtn, false);
      UI.showToast("Error", data.message || "Client lookup failed");
      return;
    }
    UI.updateFromSession(data.session);
    UI.showToast("Client", data.message || "Client lookup started");
  });

  toggleManualBtn.addEventListener("click", () => {
    const current = localStorage.getItem("manual_mode") === "1";
    setManualMode(!current);
    UI.showToast("Mode", !current ? "Saisie manuelle activée" : "Saisie automatique activée");
  });

  activateBtn.addEventListener("click", () => {
    const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
    modal.show();
  });

  document.getElementById("confirmActionBtn").addEventListener("click", async () => {
    const modalEl = document.getElementById("confirmModal");
    const modalInstance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    const payload = {
      mac: document.getElementById("clientMac").value.trim(),
      client_name: document.getElementById("clientName").value.trim() || "Client",
    };
    setButtonLoading(activateBtn, true);
    setPendingAction("activating");
    UI.setSpinner(true);
    const data = await Api.activateBypass(payload);
    UI.setSpinner(false);
    if (modalInstance) {
      modalInstance.hide();
    }
    if (data.status === "error") {
      setPendingAction(null);
      setButtonLoading(activateBtn, false);
      UI.showToast("Error", data.message || "Activation failed");
      return;
    }
    UI.updateFromSession(data.session);
    UI.showToast("Bypass", data.message || "Activation started");
  });

  deactivateBtn.addEventListener("click", async () => {
    const payload = {
      mac: document.getElementById("clientMac").value.trim(),
    };
    setButtonLoading(deactivateBtn, true);
    setPendingAction("deactivating");
    UI.setSpinner(true);
    const data = await Api.deactivateBypass(payload);
    UI.setSpinner(false);
    if (data.status === "error") {
      setPendingAction(null);
      setButtonLoading(deactivateBtn, false);
      UI.showToast("Error", data.message || "Deactivation failed");
      return;
    }
    UI.updateFromSession(data.session);
    UI.showToast("Bypass", data.message || "Deactivation started");
  });

  finishBtn.addEventListener("click", async () => {
    const payload = {
      mac: document.getElementById("clientMac").value.trim(),
    };
    setButtonLoading(finishBtn, true);
    setPendingAction("deactivating");
    UI.setSpinner(true);
    const data = await Api.finishMaintenance(payload);
    UI.setSpinner(false);
    if (data.status === "error") {
      setPendingAction(null);
      setButtonLoading(finishBtn, false);
      UI.showToast("Error", data.message || "Finish failed");
      return;
    }
    UI.updateFromSession(data.session);
    UI.showToast("Maintenance", data.message || "Finish started");
  });

  return buttons;
};

const startPolling = (buttons) => {
  if (State.pollInterval) clearInterval(State.pollInterval);
  State.pollInterval = setInterval(async () => {
    const data = await Api.getStatus();
    if (data.session) {
      UI.updateFromSession(data.session);
      updateLoadingFromSession(data.session, buttons);
    }
  }, 4000);

  if (State.logInterval) clearInterval(State.logInterval);
  State.logInterval = setInterval(async () => {
    const data = await Api.getLogs();
    if (data.logs) UI.updateLogs(data.logs);
  }, 5000);

  if (State.timerInterval) clearInterval(State.timerInterval);
  State.timerInterval = setInterval(async () => {
    const data = await Api.getStatus();
    if (data.session) {
      UI.updateFromSession(data.session);
      updateLoadingFromSession(data.session, buttons);
    }
  }, 1000);
};

const initTooltips = () => {
  const triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  triggers.forEach((trigger) => new bootstrap.Tooltip(trigger));
};

const init = () => {
  initFields();
  initManualMode();
  loadPendingAction();
  const buttons = wireEvents();
  startPolling(buttons);
  initTooltips();
};

document.addEventListener("DOMContentLoaded", init);

