import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUnlocks } from "./payments.functions";

const EMAIL_KEY = "mk_unlock_email";
const PAYMENT_REF_KEY = "mk_payment_reference";

export function storePaymentReference(reference: string) {
  window.localStorage.setItem(PAYMENT_REF_KEY, reference);
  window.dispatchEvent(new Event("mk-payment-reference"));
}

export function usePaymentReference() {
  const [reference, setReference] = useState("");
  useEffect(() => {
    const update = () => setReference(window.localStorage.getItem(PAYMENT_REF_KEY) ?? "");
    update();
    window.addEventListener("mk-payment-reference", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("mk-payment-reference", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return reference;
}

export function getStoredEmail(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(EMAIL_KEY) ?? "";
}
export function setStoredEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}
export function clearStoredEmail() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EMAIL_KEY);
}

export function useUnlockEmail() {
  const [email, setEmail] = useState<string>("");
  useEffect(() => { setEmail(getStoredEmail()); }, []);
  return [email, (e: string) => { setStoredEmail(e); setEmail(e.trim().toLowerCase()); }] as const;
}

export function useUnlocks(email: string) {
  const list = useServerFn(listUnlocks);
  return useQuery({
    queryKey: ["unlocks", email],
    enabled: !!email && email.includes("@"),
    queryFn: async () => list({ data: { email } }),
    refetchInterval: (q) => (q.state.data && !q.state.data.bundleExpiresAt ? false : 15000),
    staleTime: 5000,
  });
}

export function isItemLocked(meta: Record<string, unknown> | null | undefined): boolean {
  if (!meta) return false;
  return meta.locked === true || meta.locked === "true";
}
