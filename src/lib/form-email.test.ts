import { afterEach, describe, expect, it, vi } from "vitest";
import { sendFormEmail } from "./form-email.server";

const message = { name: "Test Reader", email: "reader@example.com", subject: "Test", body: "Test message", kind: "contact" };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("form email host routing", () => {
  it("uses the linked gateway on Lovable", async () => {
    vi.stubEnv("BREVO_DIRECT_API_KEY", "");
    vi.stubEnv("LOVABLE_API_KEY", "test-gateway");
    vi.stubEnv("BREVO_API_KEY", "test-connection");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ messageId: "test-id" }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await sendFormEmail("test", message)).sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://connector-gateway.lovable.dev/brevo/smtp/email", expect.objectContaining({ headers: expect.objectContaining({ "X-Connection-Api-Key": "test-connection" }) }));
  });
  it("uses a separately configured direct key on external hosting", async () => {
    vi.stubEnv("BREVO_DIRECT_API_KEY", "test-direct-provider");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ messageId: "test-id" }));
    vi.stubGlobal("fetch", fetchMock);
    await sendFormEmail("test", message);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(request.headers).toEqual({ "Content-Type": "application/json", "api-key": "test-direct-provider" });
    expect(JSON.parse(request.body).to).toEqual([{ email: "melchizedeckkakese@gmail.com" }]);
  });
  it("does not fall back to the provider after a gateway failure", async () => {
    vi.stubEnv("BREVO_DIRECT_API_KEY", "");
    vi.stubEnv("LOVABLE_API_KEY", "test-gateway");
    vi.stubEnv("BREVO_API_KEY", "test-connection");
    const fetchMock = vi.fn().mockResolvedValue(new Response("test rejection", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await sendFormEmail("test", message)).sent).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});