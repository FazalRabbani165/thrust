THRUST STUDY UPGRADE
====================

This combined patch adds:
- PDF Lab -> Import PDF -> local text extraction -> Important Slides
- Quick / Standard / Deep Important Slides
- Daily Statistics with focus, completed tasks, cards reviewed, 7-day charts and streak
- Task creation date/time shown as "Added ..."
- Dashboard Focused value uses actual daily focus instead of a hard-coded 0m

No npm dependency is added by this patch.

Apply over the current working ~/Desktop/thrust2 project:
  tar -xzf /path/to/thrust-study-upgrade.tar.gz -C ~/Desktop/thrust2

Then run:
  cd ~/Desktop/thrust2
  npm run build

Do NOT run `tauri android init` again.
Do NOT delete src-tauri/gen/android.
Do NOT commit until the build succeeds and the changed files have been reviewed.

PDF limitation:
The local extractor supports common text-based PDFs and Flate-compressed text streams. Scanned/image-only PDFs are reported as unsupported rather than silently inventing content.
