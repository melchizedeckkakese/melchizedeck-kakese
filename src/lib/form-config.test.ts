import { describe, expect, it } from "vitest";
import { formStorageConfig } from "./form-config";

describe("external form storage configuration", () => {
  it("uses the existing build-time public config when server variables are absent", () => {
    expect(formStorageConfig({}, { VITE_SUPABASE_URL: "https://public.example.com", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" }))
      .toEqual({ url: "https://public.example.com", key: "sb_publishable_test" });
  });
  it("preserves server configuration precedence", () => {
    expect(formStorageConfig({ SUPABASE_URL: "https://server.example.com", SUPABASE_ANON_KEY: "server-test" }, { VITE_SUPABASE_URL: "https://public.example.com", VITE_SUPABASE_PUBLISHABLE_KEY: "public-test" }))
      .toEqual({ url: "https://server.example.com", key: "server-test" });
  });
  it("rejects missing configuration rather than sending to an invented destination", () => {
    expect(() => formStorageConfig({}, {})).toThrow("Submission storage is not configured");
  });
});