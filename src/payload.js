const NAME = /^[A-Za-z0-9_:\-]{1,64}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED = new Set(["pageview", "engagement"]);

export function stripURL(raw) {
  const url = new URL(raw, "https://placeholder.invalid");
  url.search = "";
  url.hash = "";
  if (url.origin === "https://placeholder.invalid") {
    return url.pathname || "/";
  }
  return url.toString();
}

export function campaign(raw) {
  if (!raw) return {};
  const url = new URL(raw, "https://placeholder.invalid");
  const cut = (key) => {
    const value = url.searchParams.get(key);
    if (!value) return undefined;
    return value.slice(0, 64);
  };
  const out = {};
  const source = cut("utm_source");
  const medium = cut("utm_medium");
  const name = cut("utm_campaign");
  if (source) out.s = source;
  if (medium) out.m = medium;
  if (name) out.c = name;
  return out;
}

export function assertProps(props) {
  if (props == null) return;
  const keys = Object.keys(props);
  if (keys.length > 10) throw Object.assign(new Error("invalid_props"), { code: "invalid_props" });
  for (const key of keys) {
    const value = props[key];
    if (key.length < 1 || key.length > 32 || typeof value !== "string" || value.length > 64 || EMAIL.test(value)) {
      throw Object.assign(new Error("invalid_props"), { code: "invalid_props" });
    }
  }
}

function withID(body, idempotencyKey) {
  if (!idempotencyKey) return body;
  if (!ID.test(idempotencyKey)) {
    throw Object.assign(new Error("idempotency_key"), { code: "idempotency_key" });
  }
  body.id = idempotencyKey;
  return body;
}

export function pagePayload({ domain, url, referrer, idempotencyKey }) {
  if (!domain) throw Object.assign(new Error("domain"), { code: "domain" });
  const body = { n: "pageview", u: stripURL(url), d: domain, ...campaign(url) };
  if (referrer) body.r = stripURL(referrer);
  return withID(body, idempotencyKey);
}

export function eventPayload({ domain, name, url, referrer, props, idempotencyKey }) {
  if (!NAME.test(name) || RESERVED.has(name)) {
    throw Object.assign(new Error("invalid_name"), { code: "invalid_name" });
  }
  assertProps(props);
  const body = { n: name, u: stripURL(url), d: domain, ...campaign(url) };
  if (referrer) body.r = stripURL(referrer);
  if (props && Object.keys(props).length > 0) body.p = props;
  return withID(body, idempotencyKey);
}
