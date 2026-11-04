import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDeleteEngagement } from "@/lib/engagement";
import { Stars } from "@/components/site/Stars";

type Row = {
  id: string;
  item_id: string;
  name: string;
  body: string | null;
  rating?: number;
  created_at: string;
  admin_reply?: string | null;
};

function useModerationFeed() {
  return useQuery({
    queryKey: ["moderation-feed"],
    queryFn: async () => {
      const [comments, reviews, items] = await Promise.all([
        supabase
          .from("content_comments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("content_reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("content_items").select("id,title,collection"),
      ]);

      if (comments.error) throw comments.error;
      if (reviews.error) throw reviews.error;

      const titles: Record<string, string> = {};
      (items.data ?? []).forEach((i) => {
        titles[i.id] = i.title;
      });

      return {
        comments: (comments.data ?? []) as Row[],
        reviews: (reviews.data ?? []) as Row[],
        titles,
      };
    },
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Moderation() {
  const { data, isLoading, refetch } = useModerationFeed();
  const delComment = useDeleteEngagement("content_comments");
  const delReview = useDeleteEngagement("content_reviews");

  const remove = (
    mutation: typeof delComment,
    id: string,
    label: string,
  ) => {
    mutation.mutate(id, {
      onSuccess: () => {
        toast.success(`${label} deleted.`);
        refetch();
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading moderation feed…
      </p>
    );
  }

  const titleFor = (id: string) => data?.titles?.[id] ?? "Untitled item";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur">
        <h2 className="font-serif text-xl text-cream">
          Comments{" "}
          <span className="text-sm text-muted-foreground">
            ({data?.comments.length ?? 0})
          </span>
        </h2>

        <div className="mt-4 space-y-4">
          {data?.comments.map((c) => (
            <div key={c.id} className="border-t border-border/40 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cream">{c.name}</p>
                  <p className="text-[11px] uppercase tracking-widest text-gold/80">
                    {titleFor(c.item_id)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-muted-foreground/70">
                    {formatDate(c.created_at)}
                  </span>
                  <button
                    aria-label="Delete comment"
                    disabled={delComment.isPending}
                    onClick={() => remove(delComment, c.id, "Comment")}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {c.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {c.body}
                </p>
              )}
              <ReplyBox id={c.id} initial={c.admin_reply ?? ""} onSaved={refetch} />
            </div>
          ))}

          {data?.comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur">
        <h2 className="font-serif text-xl text-cream">
          Reviews{" "}
          <span className="text-sm text-muted-foreground">
            ({data?.reviews.length ?? 0})
          </span>
        </h2>

        <div className="mt-4 space-y-4">
          {data?.reviews.map((r) => (
            <div key={r.id} className="border-t border-border/40 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cream">{r.name}</p>
                  <p className="text-[11px] uppercase tracking-widest text-gold/80">
                    {titleFor(r.item_id)}
                  </p>
                  <div className="mt-1">
                    <Stars value={r.rating ?? 0} size={14} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-muted-foreground/70">
                    {formatDate(r.created_at)}
                  </span>
                  <button
                    aria-label="Delete review"
                    disabled={delReview.isPending}
                    onClick={() => remove(delReview, r.id, "Review")}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {r.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {r.body}
                </p>
              )}
            </div>
          ))}

          {data?.reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyBox({ id, initial, onSaved }: { id: string; initial: string; onSaved: () => void }) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const save = async (value: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("content_comments")
      .update({ admin_reply: value.trim() || null, replied_at: value.trim() ? new Date().toISOString() : null })
      .eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(value.trim() ? "Reply posted." : "Reply removed.");
    qc.invalidateQueries({ queryKey: ["comments"] });
    onSaved();
  };
  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Write a public reply…"
        className="w-full rounded-md border border-border bg-background/60 p-2 text-sm text-foreground"
      />
      <div className="flex gap-2">
        <button disabled={saving} onClick={() => save(text)} className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50">
          {saving ? "Saving…" : initial ? "Update reply" : "Reply"}
        </button>
        {initial && <button disabled={saving} onClick={() => { setText(""); save(""); }} className="text-xs text-muted-foreground hover:text-destructive">Remove reply</button>}
      </div>
    </div>
  );
}
