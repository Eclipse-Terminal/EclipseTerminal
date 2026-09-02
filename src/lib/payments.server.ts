/** Paymob (Egypt) integration helpers. Server-only. */

export type PlanCycle = "monthly" | "yearly";
export type PayChannel =
  "card" | "vodafone_cash" | "orange_cash" | "we_pay" | "etisalat_cash" | "fawry";

export const PRICES: Record<PlanCycle, number> = { monthly: 19900, yearly: 199000 };

const WALLET_CHANNELS: PayChannel[] = ["vodafone_cash", "orange_cash", "we_pay", "etisalat_cash"];
export const isWallet = (c: PayChannel) => WALLET_CHANNELS.includes(c);

const BASE = "https://accept.paymob.com/api";

export type PaymobConfig = {
  apiKey: string;
  iframeId: string;
  cardIntegrationId: string;
  walletIntegrationId: string;
  kioskIntegrationId: string;
};

export function readPaymobConfig(): PaymobConfig | null {
  const apiKey = process.env["PAYMOB_API_KEY"];
  if (!apiKey) return null;
  return {
    apiKey,
    iframeId: process.env["PAYMOB_IFRAME_ID"] ?? "",
    cardIntegrationId: process.env["PAYMOB_INTEGRATION_ID_CARD"] ?? "",
    walletIntegrationId: process.env["PAYMOB_INTEGRATION_ID_WALLET"] ?? "",
    kioskIntegrationId: process.env["PAYMOB_INTEGRATION_ID_KIOSK"] ?? "",
  };
}

export function integrationFor(cfg: PaymobConfig, channel: PayChannel) {
  if (channel === "fawry") return cfg.kioskIntegrationId;
  if (isWallet(channel)) return cfg.walletIntegrationId;
  return cfg.cardIntegrationId;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Paymob ${path} failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export type CheckoutResult =
  | { kind: "iframe"; url: string; orderId: string }
  | { kind: "redirect"; url: string; orderId: string }
  | { kind: "reference"; reference: string; orderId: string };

export async function createPaymobCheckout(opts: {
  cfg: PaymobConfig;
  channel: PayChannel;
  cycle: PlanCycle;
  email: string;
  phone: string;
  paymentId: string;
}): Promise<CheckoutResult> {
  const { cfg, channel, cycle, email, phone, paymentId } = opts;
  const amount = PRICES[cycle];

  const auth = await post<{ token: string }>("/auth/tokens", { api_key: cfg.apiKey });

  const order = await post<{ id: number }>("/ecommerce/orders", {
    auth_token: auth.token,
    delivery_needed: false,
    amount_cents: amount,
    currency: "EGP",
    merchant_order_id: paymentId,
    items: [
      {
        name: cycle === "yearly" ? "Nabd EGX Pro — Yearly" : "Nabd EGX Pro — Monthly",
        amount_cents: amount,
        quantity: 1,
      },
    ],
  });

  const billing = {
    apartment: "NA",
    email,
    floor: "NA",
    first_name: email.split("@")[0] ?? "EGX",
    street: "NA",
    building: "NA",
    phone_number: phone,
    shipping_method: "NA",
    postal_code: "NA",
    city: "Cairo",
    country: "EG",
    last_name: "Trader",
    state: "Cairo",
  };

  const key = await post<{ token: string }>("/acceptance/payment_keys", {
    auth_token: auth.token,
    amount_cents: amount,
    expiration: 3600,
    order_id: order.id,
    billing_data: billing,
    currency: "EGP",
    integration_id: Number(integrationFor(cfg, channel)),
    lock_order_when_paid: true,
  });

  const orderId = String(order.id);

  if (channel === "card") {
    return {
      kind: "iframe",
      orderId,
      url: `${BASE}/acceptance/iframes/${cfg.iframeId}?payment_token=${key.token}`,
    };
  }

  if (isWallet(channel)) {
    const pay = await post<{ redirect_url?: string; redirection_url?: string }>(
      "/acceptance/payments/pay",
      {
        source: { identifier: phone, subtype: "WALLET" },
        payment_token: key.token,
      },
    );
    const url = pay.redirect_url ?? pay.redirection_url;
    if (!url) throw new Error("Paymob wallet payment did not return a redirect URL");
    return { kind: "redirect", url, orderId };
  }

  const kiosk = await post<{ id?: number; data?: { bill_reference?: number | string } }>(
    "/acceptance/payments/pay",
    {
      source: { identifier: "AGGREGATOR", subtype: "AGGREGATOR" },
      payment_token: key.token,
    },
  );
  const reference = kiosk.data?.bill_reference ?? kiosk.id;
  if (!reference) throw new Error("Paymob did not return a Fawry reference code");
  return { kind: "reference", reference: String(reference), orderId };
}

/** Paymob HMAC field order for the transaction callback. */
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function pick(obj: Record<string, unknown>, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export async function verifyPaymobHmac(
  transaction: Record<string, unknown>,
  received: string,
  secret: string,
): Promise<boolean> {
  const concat = HMAC_FIELDS.map((field) => pick(transaction, field)).join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(concat));
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ received.toLowerCase().charCodeAt(i);
  }
  return diff === 0;
}
