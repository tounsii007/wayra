# Mobile assets

Branding assets live here. Until proper artwork lands, Expo's built-in
default icon + splash are used (no `icon` / `image` paths in `app.json`).

When ready, drop the following PNGs in this folder and re-add the
references in `app.json`:

| File                 | Size              | Purpose                        |
| -------------------- | ----------------- | ------------------------------ |
| `icon.png`           | 1024 × 1024       | App icon                       |
| `splash.png`         | 1242 × 2436+      | Splash screen image            |
| `adaptive-icon.png`  | 1024 × 1024       | Android adaptive icon foreground |
| `favicon.png`        | 48 × 48           | Web favicon                    |

The `<WayraLogo />` SVG in the web app
(`apps/web/src/components/wayra-logo.tsx`) is the canonical brand mark
and can be exported to PNG at the sizes above.
