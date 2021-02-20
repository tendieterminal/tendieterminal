export const clientInfo = {
  userAgent: "TendieTerminal",
  clientId: "VRvIgSI5lyHa4w",
};

export const fetchAnonymousToken = () => {
  const form = new FormData();
  const now = new Date().getTime();
  const inThirtyMinutes = now + 1000 * 60 * 30;
  const expires = new Date(inThirtyMinutes);

  form.set("grant_type", "https://oauth.reddit.com/grants/installed_client");
  form.set("device_id", "DO_NOT_TRACK_THIS_DEVICE");

  return fetch("https://www.reddit.com/api/v1/access_token", {
    method: "post",
    body: form,
    headers: { authorization: `Basic ${btoa(clientInfo.clientId + ":")}` },
    credentials: "omit",
  })
    .then((response) => response.text())
    .then(JSON.parse)
    .then((tokenInfo) => tokenInfo.access_token)
    .then((anonymousToken) => {
      return { accessToken: anonymousToken, expiryTime: expires };
    });
};
