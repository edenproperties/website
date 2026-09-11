# Eden Properties

A static, responsive landing page built with HTML, CSS, and vanilla JavaScript. No build step, application server, analytics, cookies, or paid runtime dependencies.

## Local preview

```sh
cd /home/decoder/edenproperties
npm start
```

Open http://127.0.0.1:4173/. The Python server binds to loopback only. Stop it with Ctrl+C when started in your own terminal.

## Tests

Requires Python 3, Node.js, and Google Chrome for browser tests.

```sh
npm ci
npm run test:static
npm test
```

The browser suite checks desktop/mobile collection navigation, scroll transitions, video pause/play, reduced-motion preferences, wordmark bounds, and progressive enhancement without JavaScript.

## Editing

- `index.html`: branding, copy, contact email, metadata, and sections.
- `styles.css`: responsive layout, forest/ivory palette, typography.
- `app.js`: native-scroll photo dissolves, accessibility, video playback.
- `assets/`: all production photography, video, fonts, and favicon; nothing is hotlinked.
- `assets/manifest.json`: download provenance, byte sizes, and SHA-256 hashes.
- `scripts/download_assets.py`: downloads the original reference media and open-license fonts again if needed.

The email link uses `edenproperties.tn@gmail.com`, taken from this repository's configured Git identity. Confirm it is the intended public enquiry address before launch. The link opens an email client; it is not a form submission service. No contact form data is stored or transmitted automatically.

The imagery is illustrative and the copy intentionally makes no claims about project locations, availability, counts, amenities, pricing, or approvals. Replace it with verified business information when available.

## Asset rights

Reference: https://elyse-residence-dev.webflow.io/

The requested reference imagery and hero video have been downloaded. Downloadability does not establish commercial reuse rights: the site owner must confirm permission/licensing before public commercial use. No original Webflow code, logo, third-party trackers, or proprietary PP Fragment fonts are shipped. Cormorant Garamond is distributed under the included SIL Open Font License (`assets/OFL-Cormorant.txt`). The new page implementation is original.

## Free GitHub Pages hosting

Repository: https://github.com/edenproperties/website (public).

After GitHub CLI authentication with an account that has administration rights:

```sh
gh auth status
git push origin main
gh api --method POST repos/edenproperties/website/pages \
  -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/'
gh api repos/edenproperties/website/pages
gh api repos/edenproperties/website/pages/builds/latest
```

If Pages is already enabled, inspect it first; use PUT rather than POST only when settings need changing. Equivalent UI: repository Settings → Pages → Deploy from a branch → main → /(root) → Save.

Initial public URL: https://edenproperties.github.io/website/

Verify a successful Pages build AND fetch the deployed page before treating deployment as complete. Root-relative links are avoided so the same page works under the repository path and a custom domain.

## Custom domain: edenproperties.co.in

Do not add `CNAME` to the root before the GitHub site exists and domain access is confirmed: it will redirect the working GitHub URL to a potentially unconfigured domain.

### 1. Domain status and delegation

In GoDaddy, confirm the exact domain `edenproperties.co.in` is active, registration is complete, and nameservers are assigned. No nameservers were returned by public DNS during initial setup. If there are custom nameservers, manage DNS at that provider; do not reset nameservers blindly because it can disrupt email and other services.

### 2. Claim the custom domain in GitHub Pages

Set `edenproperties.co.in` in repository Settings → Pages → Custom domain. For a branch-based site this creates a root `CNAME` file containing only that hostname. Pull the GitHub-created commit before subsequent local pushes, or create that file locally, commit it, push it, and set the Pages API `cname` field to the same domain.

For additional takeover protection, verify domain ownership in the GitHub account/organization Pages settings using its generated TXT challenge before changing DNS. Obtain the actual challenge from GitHub; never invent it.

### 3. Configure DNS in GoDaddy

Review and preserve existing MX/TXT and unrelated records. Replace conflicting website A/AAAA records at the apex only, and remove conflicting `www` website records only if present. Never use a wildcard record.

| Type  | Name | Value                    |
| ----- | ---- | ------------------------ |
| A     | @    | 185.199.108.153          |
| A     | @    | 185.199.109.153          |
| A     | @    | 185.199.110.153          |
| A     | @    | 185.199.111.153          |
| CNAME | www  | edenproperties.github.io |

Use GoDaddy's default TTL. The CNAME target is the GitHub account hostname, **not** the repository URL or `/website` path.

Official reference: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

### 4. Verify DNS and HTTPS

Read the saved DNS records back in GoDaddy. Check public A and CNAME responses. Wait for GitHub's DNS check and certificate issuance, then turn on **Enforce HTTPS** in Pages settings. Do not declare the domain live until `https://edenproperties.co.in/` returns this page with a valid certificate. Also verify `www` redirects correctly.

GitHub Pages hosting and its HTTPS certificate are free for this public repository. Domain renewal remains payable to the registrar. DNS propagation and certificate issuance are asynchronous and may take up to 24 hours.
