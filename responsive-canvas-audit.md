# Fixed Desktop-Canvas Responsive Audit

## Scope

The public NITER EEE Alumni website intentionally uses a fixed `width=1280` document viewport. This is the approved behavior for the project: phones and tablets render the same 1280px desktop canvas at a proportional scale rather than activating a distinct stacked mobile layout.

| Stylesheet layer | Responsive rules audited | Result under the fixed canvas |
|---|---|---|
| `index.css` | `1100px`, `780px`, and `470px` layout changes for navigation, hero, cards, grids, profiles, and footer | The rendered layout viewport is 1280px, so these max-width rules do not activate on physical phones or tablets. |
| `thesis-library-header.css` | `1000px`, `780px`, and `440px` masthead and navigation changes | The desktop institutional masthead remains active at the 1280px canvas width. |
| `thesis-mobile-identity.css` | `780px` and `440px` mobile identity positioning | These rules are bypassed by the 1280px canvas. |
| `desktop-consistent-mobile.css` | `780px` and `440px` presentation adjustments | These rules are retained for compatibility but do not alter the fixed desktop canvas. |
| `homepage-mobile.css` and `mobile-layout-repair.css` | `780px` and `440px` homepage stacking and compact controls | They remain available in source history but are not triggered on a fixed 1280px canvas. |
| `official-brand.css` and `archive-refinement.css` | `1100px`, `780px`, and `470px` brand and directory changes | The desktop brand and directory layouts remain active. |
| `compact-reference-mobile.css` | `520px` compact-reference layer | Not imported into the active application stylesheet cascade. |
| `admin.css` | `950px` and `620px` administration-grid changes | The secure dashboard also retains a desktop-composition canvas on phones, consistent with the approved site-wide behavior. |

## Verification Result

The project retains its existing desktop composition, including the institutional masthead, navigation row, hero, cards, directory, profile, footer, and new secured administration interface. The `width=1280` viewport strategy makes the browser scale that composition to the physical screen while preserving normal user zoom.
