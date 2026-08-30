TOP PRIORITY:
Files be lazy loaded when a folder is open.

Sort by name/duration in each folder (preserved per device?) Should sort be done on frontend or backend?

Do not create first bookmark automaticaly when a file is added.




LESS PRIORITY:

Playback & listening experience

Resume position — File already has no lastPosition field, only lastInteraction. Store playback position per file (per user) so reopening a track resumes where you left off, not from zero. Natural pairing with the existing lastFileSeen on User.
Playback speed memory — persist last-used rate per file or globally (you already have PlaybackRateSelect.vue), so it doesn't reset to 1x every load.
Sleep timer — common for audio-library/podcast-style apps, cheap to add to AudioPlayer.vue.
Keyboard shortcuts (space=play/pause, arrows=seek/volume) — you already have forward/backward/volume icons, just needs bindings.
Bookmarks (already your most distinctive feature)

Export bookmarks (e.g. as text/CSV/timestamps list) — useful if these are lecture/podcast notes.
Bookmark search across all files — "find all bookmarks containing X" — trivial Mongo query since Bookmark.label already exists.
Jump-to-bookmark keyboard nav — you have BookmarkNavigation.vue already; could add prev/next-bookmark hotkeys.
Organization

Tags, separate from the existing folder tree — folders are exclusive (one location), tags aren't, useful for cross-cutting things like "lectures," "to-review."
Full-text/file-name search — I didn't see a search box in the tree navigation; even a simple client-side filter over the folder tree would help once the library grows.
Sort/filter by duration, upload date, last played.
Account/sharing

Public/shareable link for a single file (signed R2 URL you already generate for playback) — lets you send someone a track without giving them your account.
Storage quota display — you're on R2, presumably paying per GB; showing usage would be low-effort and useful.


