# ImageMate AdMob Placement Policy Checklist

Last reviewed: 2026-10-20

This implementation follows Google's published AdMob banner-placement guidance. It is a technical checklist, not a guarantee of account or policy approval; review the current Google policy pages before release.

## Official references
- Banner guidance: https://support.google.com/admob/answer/6128877
- Discouraged placements: https://support.google.com/admob/answer/6275345
- Recommended placements: https://support.google.com/admob/answer/6275335
- Android banner setup and test ads: https://developers.google.com/admob/android/banner

## ImageMate placement rules
- Android banner is anchored at the bottom and kept above the fixed mobile navigation.
- Maintain a visible, non-clickable gap between the banner and app navigation/content.
- Reserve enough bottom layout space so the native banner and navigation do not cover app controls or results.
- Never put the banner beside file pickers, conversion/download buttons, image previews, or other high-frequency interactive controls.
- Do not float the banner over scrolling content or move it with content while scrolling.
- Keep the banner clearly identifiable as an advertisement; do not imitate app controls or encourage ad clicks.
- Use Google's dedicated test ad unit IDs during development. Replace them with the app's own configured IDs only for production after validation.
- Interstitial ads must only be shown at natural breaks, never while selecting files, editing, processing, or downloading.
- Rewarded ads must be clearly user-initiated, and rewards must follow the rewarded-ad format rules.

## Release validation
- Test on small and large Android screens, portrait and landscape, and with system gesture/navigation bars.
- Verify the banner never overlaps bottom navigation, controls, file previews, or results.
- Verify failed/no-fill ad requests do not leave a blank interactive-looking ad panel.
- Check AdMob policy center and Google Play policy status before production release.
