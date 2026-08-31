TOP PRIORITY:

Sort by name/duration in each folder (preserved per device?) Should sort be done on frontend or backend?



LESS PRIORITY:


Playback & listening experience:

Keyboard shortcuts (space=play/pause, arrows=seek/volume) — you already have forward/backward/volume icons, just needs bindings.

"Continue listening" / recently played row — File.lastInteraction is already tracked per file but only used for the "last seen" highlight in the tree; a small recently-played strip at the top would be nearly free.

Verify resume-position sync across devices — updateMetadata already persists currentTime per file; worth double-checking this is actually driving cross-device resume, since the plumbing looks already there.


Bookmarks (already your most distinctive feature):

Export bookmarks (e.g. as text/CSV/timestamps list) — useful if these are lecture/podcast notes.

Jump-to-bookmark keyboard nav — you have BookmarkNavigation.vue already; could add prev/next-bookmark hotkeys.


Organization:

Sort/filter by duration, upload date, last played.

Folder-level completion badge (e.g. "3/12 complete") — pure frontend computed off File.completed, no backend change needed.

Bulk untag — bulk add-tags already exists (addTagsToMultipleFiles); mirror it with a remove version ($pull instead of $addToSet).

Duplicate-upload detection — warn when a file with the same name+size already exists in the target folder, before it re-uploads to R2.


Account/sharing:

File/Folder public sharing (not only between accounts)

Storage quota display — you're on R2, presumably paying per GB; showing usage would be low-effort and useful.

Notify/badge when something is newly shared with you — the Share model and SharedWithMe.vue already exist, but nothing currently surfaces "you have a new share" to the recipient.


