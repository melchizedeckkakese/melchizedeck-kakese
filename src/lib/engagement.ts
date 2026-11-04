import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KEY_STORAGE = "mk_visitor_key";

/** Stable per-device id used to make likes one-per-visitor (client-side only). */
export function getVisitorKey(): string {
  if (typeof window === "undefined") return "";
  try {
    let k = localStorage.getItem(KEY_STORAGE);
    if (!k) {
      k = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(KEY_STORAGE, k);
    }
    return k;
  } catch {
    return "";
  }
}

export type Comment = {
  id: string;
  item_id: string;
  name: string;
  body: string;
  created_at: string;
  admin_reply?: string | null;
  replied_at?: string | null;
};

export type Review = {
  id: string;
  item_id: string;
  name: string;
  rating: number;
  body: string | null;
  created_at: string;
};

/* ---------------------------------- likes --------------------------------- */

export function useLikes(itemIds: string[]) {
  const ids = [...itemIds].sort();
  return useQuery({
    queryKey: ["likes", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_likes")
        .select("item_id,visitor_key")
        .in("item_id", ids);
      if (error) throw error;
      const me = getVisitorKey();
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      (data ?? []).forEach((row) => {
        counts[row.item_id] = (counts[row.item_id] ?? 0) + 1;
        if (me && row.visitor_key === me) mine.add(row.item_id);
      });
      return { counts, mine };
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, liked }: { itemId: string; liked: boolean }) => {
      const visitor_key = getVisitorKey();
      if (!visitor_key) throw new Error("Likes need browser storage enabled.");
      if (liked) {
        const { error } = await supabase
          .from("content_likes")
          .delete()
          .eq("item_id", itemId)
          .eq("visitor_key", visitor_key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("content_likes")
          .insert({ item_id: itemId, visitor_key });
        if (error && error.code !== "23505") throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["likes"] }),
  });
}

/* -------------------------------- comments -------------------------------- */

export function useComments(itemId: string) {
  return useQuery({
    queryKey: ["comments", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_comments")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });
}

export function useAddComment(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, body }: { name: string; body: string }) => {
      const { error } = await supabase
        .from("content_comments")
        .insert({ item_id: itemId, name: name.trim(), body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", itemId] }),
  });
}

/* --------------------------------- reviews -------------------------------- */

export function useReviews(itemId: string) {
  return useQuery({
    queryKey: ["reviews", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reviews")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

export function useReviewSummaries(itemIds: string[]) {
  const ids = [...itemIds].sort();
  return useQuery({
    queryKey: ["review-summaries", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reviews")
        .select("item_id,rating")
        .in("item_id", ids);
      if (error) throw error;
      const acc: Record<string, { count: number; total: number }> = {};
      (data ?? []).forEach((r) => {
        const a = (acc[r.item_id] ??= { count: 0, total: 0 });
        a.count += 1;
        a.total += r.rating;
      });
      const out: Record<string, { count: number; average: number }> = {};
      Object.entries(acc).forEach(([id, a]) => {
        out[id] = { count: a.count, average: a.total / a.count };
      });
      return out;
    },
  });
}

export function useAddReview(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, rating, body }: { name: string; rating: number; body: string }) => {
      const { error } = await supabase.from("content_reviews").insert({
        item_id: itemId,
        name: name.trim(),
        rating,
        body: body.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", itemId] });
      qc.invalidateQueries({ queryKey: ["review-summaries"] });
    },
  });
}

/* ------------------------------- moderation ------------------------------- */

export function useDeleteEngagement(table: "content_comments" | "content_reviews") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["review-summaries"] });
    },
  });
}
