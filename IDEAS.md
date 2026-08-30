TOP PRIORITY:

Sort by name/duration in each folder (preserved per device?) Should sort be done on frontend or backend?

multiple-file-actions some times doesn't unfold all the way and you can see only a small part of the upper border, making it unusable because the action butons are not visible

LESS PRIORITY:

Playback & listening experience

Playback speed memory — persist last-used rate per file or globally (you already have PlaybackRateSelect.vue), so it doesn't reset to 1x every load.

Keyboard shortcuts (space=play/pause, arrows=seek/volume) — you already have forward/backward/volume icons, just needs bindings.


Bookmarks (already your most distinctive feature)

Export bookmarks (e.g. as text/CSV/timestamps list) — useful if these are lecture/podcast notes.

Jump-to-bookmark keyboard nav — you have BookmarkNavigation.vue already; could add prev/next-bookmark hotkeys.


Organization

Full-text/file-name search — I didn't see a search box in the tree navigation; even a simple client-side filter over the folder tree would help once the library grows.
Sort/filter by duration, upload date, last played.


Account/sharing

Public/shareable link for a single file (signed R2 URL you already generate for playback) — lets you send someone a track without giving them your account.
Storage quota display — you're on R2, presumably paying per GB; showing usage would be low-effort and useful.


