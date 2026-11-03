import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PALETTE_KEYS = [
  "gold", "cream", "background", "foreground", "card", "muted",
  "mutedForeground", "primary", "primaryForeground", "border", "destructive",
] as const;

export type PaletteSuggestion = { colors: Record<string, string>; rationale: string };

export const suggestPalette = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { goals: string; imageUrl?: string }) => {
    const goals = String(input.goals ?? "").slice(0, 2000);
    const imageUrl = input.imageUrl && /^https:\/\//.test(input.imageUrl) ? input.imageUrl : undefined;
    if (!goals.trim() && !imageUrl) throw new Error("Describe your brand goals or add a reference image.");
    return { goals, imageUrl };
  })
  .handler(async ({ data, context }): Promise<PaletteSuggestion | { error: string }> => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) return { error: "Only admins can use this." };

    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const props = Object.fromEntries(PALETTE_KEYS.map((k) => [k, { type: "string", pattern: "^#[0-9a-fA-F]{6}$" }]));
    const prompt = `Return JSON. Suggest a coordinated website colour palette as 6-digit hex values.
Roles: gold = accent for highlights/links/logo; cream = headline text; background = page background; foreground = body text; card = card/panel background; muted = soft panel; mutedForeground = secondary text; primary = button background; primaryForeground = button text; border = dividers; destructive = warning/delete.
Accessibility (WCAG AA) is required: foreground/background, mutedForeground/background, foreground/card and primaryForeground/primary at least 4.5:1; cream/background and gold/background at least 3:1.
Site: personal website of an author, screenwriter and youth advocate.
Brand goals: ${data.goals || "(none given — derive from the reference image)"}
${data.imageUrl ? "Draw the palette from the attached reference image." : ""}
Give a short rationale (2-3 sentences, plain language).`;

    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            ...(data.imageUrl ? [{ type: "input_image" as const, image_url: data.imageUrl, detail: "auto" as const }] : []),
          ],
        }],
        text: {
          format: {
            type: "json_schema",
            name: "palette",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["colors", "rationale"],
              properties: {
                colors: { type: "object", additionalProperties: false, required: [...PALETTE_KEYS], properties: props },
                rationale: { type: "string" },
              },
            },
          },
        },
      });
      const r = res as unknown as { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] };
      const text = r.output_text ?? r.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text ?? "";
      const parsed = JSON.parse(text) as PaletteSuggestion;
      const colors: Record<string, string> = {};
      for (const k of PALETTE_KEYS) {
        const v = parsed.colors?.[k];
        if (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)) colors[k] = v.toLowerCase();
      }
      return { colors, rationale: String(parsed.rationale ?? "") };
    } catch (e) {
      console.error("suggestPalette failed", e);
      if (e instanceof GatewayError && e.httpStatus === 402) return { error: "AI credits have run out. Please top up and try again." };
      if (e instanceof GatewayError && e.httpStatus === 429) return { error: "Too many requests right now. Please wait a moment and try again." };
      return { error: "Couldn't create a palette this time. Please try again." };
    }
  });
