export function buildOmadaPayload(params: Record<string, string | undefined>) {
  // Pour le mode External Web Portal, Omada ne fournit pas toujours `site`,
  // on se contente donc des paramètres strictement nécessaires côté portail.
  if (!params.clientMac || !params.radioId) {
    return null;
  }
  const nowMicros = Date.now() * 1000;
  return {
    clientMac: params.clientMac,
    site: params.site,
    radioId: Number(params.radioId) || 0,
    time: Number(params.t) || nowMicros,
    authType: 4,
    redirectUrl: params.redirectUrl,
    apMac: params.apMac,
    gatewayMac: params.gatewayMac,
    ssidName: params.ssidName,
    vid: params.vid ? Number(params.vid) : undefined,
  };
}

export function formatUsername(username: string, suffix: string) {
  if (!suffix) {
    return username;
  }
  return username.endsWith(suffix) ? username : `${username}${suffix}`;
}
