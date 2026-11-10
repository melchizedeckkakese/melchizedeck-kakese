<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Derive homepage focus and event ordering with the shared journey sorter from published CMS events; do not persist a separate event copy that can become stale.
- Preload homepage journey collections in its route loader and share collection query keys with admin invalidation; road stories reuse the advocacy collection so existing editing controls remain authoritative.
- Homepage archive highlights reuse preloaded published CMS book, script, and blog collections with shared query keys; existing admin edits remain authoritative without duplicating content.
- Admin JSON list fields are read through `parseList` so slightly malformed saved text still renders instead of silently falling back to defaults.
- Edit homepage work areas through individual title and description inputs stored in the canonical home/pillars section; read back saved sections into shared query caches so Admin and the homepage reflect the same saved content.
- Store About gallery and paragraph photos in the existing About section; reuse the block photo editor to keep admin uploads authoritative.
- Store each project's catalogue in that content item's metadata and reuse the block photo editor and gallery viewer; existing admin permissions and collection invalidation remain authoritative.
- Reflow prose through shared reading styles and ExpandableText; preserve verse line breaks explicitly based on the content's poetry genre/category.
- Keep screenplay synopses in the admin-only script_synopses table and read them through read_script_synopsis with a confirmed purchase reference; public CMS metadata must not leak paid text.
- Submit contact, treatment and subscription forms through a validated server function using anonymous insert permissions, then notify the fixed owner through a server-only Brevo helper; retain saved submissions when delivery fails to avoid lost enquiries.
