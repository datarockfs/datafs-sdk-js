import { eventPayload, pagePayload } from "./payload.js";

// Datafs sends cookieless pageviews and custom events to a self-hosted install.
// Pageviews are not retried. A failed send throws with status set to the HTTP code.
export class Datafs {
  constructor({ domain, endpoint, fetchImpl }) {
    if (!domain) throw Object.assign(new Error("domain"), { code: "domain" });
    if (!endpoint) throw Object.assign(new Error("endpoint"), { code: "endpoint" });
    this.domain = domain;
    this.endpoint = endpoint.replace(/\/$/, "");
    this.fetchImpl = fetchImpl || globalThis.fetch;
  }

  pageview(input = {}) {
    const url = input.url || (typeof location !== "undefined" ? location.href : undefined);
    if (!url) throw Object.assign(new Error("url"), { code: "url" });
    const referrer = input.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined);
    const body = pagePayload({
      domain: this.domain,
      url,
      referrer,
      idempotencyKey: input.idempotencyKey,
    });
    return this.#send(body);
  }

  event(name, props, input = {}) {
    const url = input.url || (typeof location !== "undefined" ? location.href : undefined);
    if (!url) throw Object.assign(new Error("url"), { code: "url" });
    const referrer = input.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined);
    const body = eventPayload({
      domain: this.domain,
      name,
      url,
      referrer,
      props,
      idempotencyKey: input.idempotencyKey,
    });
    return this.#send(body);
  }

  async #send(body) {
    const res = await this.fetchImpl(this.endpoint + "/api/event", {
      method: "POST",
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(body),
    });
    if (res.status !== 202) {
      throw Object.assign(new Error("event_rejected"), { code: "event_rejected", status: res.status });
    }
  }
}

export { campaign, eventPayload, pagePayload, stripURL } from "./payload.js";
