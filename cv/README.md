# CV hosting

This standalone Cloudflare Worker serves the canonical two-page PDF at
`https://cv.c171017.com`, with a full-height embedded viewer. The browser's
PDF toolbar provides download controls; browsers without inline PDF support
receive a fallback link. There is no site header above the viewer.
It deploys separately from the portfolio homepage.

Published on October 2, 2026 through Cloudflare's static-file upload.
Worker: `howie-cv`; account: `77f7dd1a18d1a32952458fceba7281a0`.
The production custom domain and HTTPS were verified, and the live PDF's
SHA-256 matches the supplied original.

Updated to `Howie-CV-canonical-2026-10-02.pdf` from
`/Users/17c1710/Project/Academic:Career/output/pdf/`, as designated by that
project's `docs/resume-canonical.md`. The stable public URL remains
`/howie-cv.pdf`.

Latest published revision: October 2, 2026, 2:10 PM source update (larger,
bold contact details). SHA-256:
`6f342fad73af31c85c02e707ead8ec2cc9a35ac62915696aa448f9ab38c9adb8`.

For dashboard updates, open **Workers & Pages → howie-cv → New deployment**
and upload only the contents of `public/`.

Deploy from this directory using an authenticated Cloudflare account:

```sh
npx wrangler deploy
```

The custom-domain route automatically configures Cloudflare DNS and HTTPS
for the account's `c171017.com` zone. To update the CV, replace
`public/howie-cv.pdf` and deploy again.
Update the `?v=` value in `public/index.html` to the new PDF's SHA-256 prefix
so returning visitors immediately load the latest file.
