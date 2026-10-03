# Production deployment

The live site is https://c171017.com, served by the Cloudflare Pages project
`staircelestial` (`staircelestial.pages.dev`). Its GitHub source is
`C171017/StairCelestial`, production branch `main`, build command `npm run build`,
and output directory `out`.

Before publishing, run `npm test`, `npm run lint`, and `npm run build`, and inspect
the exported site in a browser. Publish the tested source to `main`, then verify
the Cloudflare production deployment and the custom domain. Never force-push a
release over new remote changes.

`public/_headers` gives content-hashed Next.js JavaScript/CSS assets one-year
immutable browser caching. HTML and unversioned models, artwork, and audio retain
Cloudflare's default revalidation behavior. Do not apply immutable caching to
unversioned assets without changing their URLs when their contents change.

For rollback, use a previous successful production deployment in Cloudflare
Pages. The deployment immediately preceding the glass-ribbon release was
`41f1ee4a-2350-455b-bc67-9c4f57cf7c6f`, source commit `55907ea`.
Also reconcile the Git source after rollback so the next deployment is intentional.

The October 3, 2026 release includes the latest glass ribbon, layered clouds,
pearl/gold doors, direct door-to-ribbon placement without raised sills, and the
hashed-asset caching improvement. All 75 tests, lint, and the production build
passed locally before publishing. Browser verification is not a physical-phone
performance benchmark.
