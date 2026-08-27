# First-release Hero Restoration Verification

The original first-release Hero background remains available at `/manus-storage/niter-eee-alumni-hero_08acf207.png`. Its confirmed original composition uses a dark navy text area on the left and a detailed EEE circuit-network image on the right.

The global stylesheet had been loading after the Hero stylesheet and overriding the restored artwork with a stale `/niter-eee-hero.png` rule. The Hero stylesheet is now imported after `index.css`; browser computed styles confirm the original managed Hero image is the active background source.

## Published-hostname check

On 27 August 2026, the screenshot hostname `nzc.manus.space` returned a platform maintenance page and is not mapped to this project’s deployment. The active NITER EEE Alumni deployment hostname is `nitalumni-bpznsmzc.manus.space`. A browser cached page or an older session using `nzc.manus.space` cannot reflect source changes published to the active project hostname.

The active deployment’s computed Hero background points to `/manus-storage/niter-eee-alumni-hero_08acf207.png`, and a no-cache browser request to that same active-domain path returned `200 image/webp`.

## Production rendering investigation

The published CSS now resolves the selected detailed first-release artwork as the computed `.hero__image` background. However, an active-domain visual capture still painted the old flat Hero field, indicating that resolving a redirect-backed storage URL in CSS is unreliable for the first paint despite a valid `200 image/webp` response. The next repair will use a production-safe immutable Hero asset reference rather than relying on the redirect-backed CSS background at render time.

## Latest checkpoint deployment state

The production page inspected after checkpoint `8e23a043` did not yet contain the new `.hero__artwork` element, while the local preview did. This demonstrates that the active public deployment is still serving an older published checkpoint; saving a checkpoint alone does not replace the live release. The latest checkpoint contains the explicit Hero artwork layer that renders correctly in the preview.
