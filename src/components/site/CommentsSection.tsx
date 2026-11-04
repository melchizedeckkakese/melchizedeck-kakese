import { useState } from "react";
import { MessageCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAddComment, useComments, useDeleteEngagement } from "@/lib/engagement";
import { useIsAdmin } from "@/lib/cms";

export function CommentsSection({ itemId }: { itemId: string }) {
  const { data: comments } = useComments(itemId);
  const { data: isAdmin } = useIsAdmin();
  const add = useAddComment(itemId);
  const del = useDeleteEngagement("content_comments");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  const submit = () => {
    if (name.trim().length < 2) return toast.error("Please add your name.");
    if (body.trim().length < 2) return toast.error("Please write a comment.");
    add.mutate(
      { name, body },
      {
        onSuccess: () => {
          setBody("");
          toast.success("Comment posted — thank you!");
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-gold/60 hover:text-cream"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {comments?.length ? `${comments.length} comment${comments.length > 1 ? "s" : ""}` : "Comment"}
      </button>

      {open && (
        <div className="mt-5 rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            <Textarea
              placeholder="Share your thoughts…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              rows={3}
            />
          </div>
          <div className="mt-3">
            <Button size="sm" className="bg-gold text-primary-foreground hover:opacity-90" disabled={add.isPending} onClick={submit}>
              {add.isPending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />} Post comment
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {comments?.map((c) => (
              <div key={c.id} className="border-t border-border/40 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-cream">{c.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground/70">
                      {new Date(c.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                    {isAdmin && (
                      <button
                        aria-label="Delete comment"
                        onClick={() => del.mutate(c.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{c.body}</p>
                {c.admin_reply && (
                  <div className="ml-4 mt-3 border-l-2 border-gold/60 pl-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-gold">Melchizedeck replied</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{c.admin_reply}</p>
                  </div>
                )}
              </div>
            ))}
            {comments?.length === 0 && <p className="text-sm text-muted-foreground">Be the first to comment.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
