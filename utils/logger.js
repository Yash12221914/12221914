export function logEvent(eventName, payload) {
  if (typeof window !== "undefined" && window.__MY_CUSTOM_LOGGER__) {
    window.__MY_CUSTOM_LOGGER__.log(eventName, payload);
  } else {
    const log = document.createElement("div");
    log.dataset.event = eventName;
    log.dataset.payload = JSON.stringify(payload);
    document.body.appendChild(log);
  }
}
