# Image Loading Diagnostic — 2026-08-20

- The shared Header and Footer both currently render `/manus-storage/niter-official-logo_b5db41d0.jpg`.
- Direct requests to that source return HTTP 200 as `image/jpeg` from both the local preview and the published domain after the storage redirect.
- The single stored alumni photo currently uses `/manus-storage/alumni-claims/120006/1000048297_75988989.jpg`; it also returns HTTP 200 as `image/jpeg` from preview and production.
- Most current alumni records have no stored photo URL. The public pages fall back to an external Unsplash URL, which is not a managed production asset and is the likely source of the broken portrait/alt-text rendering for those records.
- The repair will retain uploaded profile images, normalize managed storage paths, and replace external fallback usage with a managed, production-safe project image.
