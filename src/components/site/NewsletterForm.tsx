import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { submitWebsiteForm } from "@/lib/form-submissions.functions";
import { submissionSchema } from "@/lib/form-submissions";
import { toast } from "sonner";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const send = useServerFn(submitWebsiteForm);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Please enter a valid email"); return; }
    setLoading(true);
    try {
      const input = submissionSchema.parse({ type: "subscription", email });
      const result = await send({ data: input });
      if ("alreadySubscribed" in result && result.alreadySubscribed) toast.success("You're already subscribed!");
      else {
      toast.success("Thanks — you're on the list.");
      setEmail("");
      }
    } catch { toast.error("Could not subscribe. Check your email and try again."); }
    finally { setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="bg-card"
        required
      />
      <Button type="submit" disabled={loading} className="bg-gold text-primary-foreground hover:opacity-90">
        {loading ? "..." : "Subscribe"}
      </Button>
    </form>
  );
}
