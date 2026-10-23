# Domain Setup Guide

Connect the restaurant's own domain (e.g. `www.thelittlebistro.co.uk`) to the
deployed site.

## 1. Add the domain in Vercel

Project → **Settings → Domains → Add**:

- Add the **www** host: `www.example.co.uk`
- Add the **apex**: `example.co.uk` and set it to *Redirect to www*
  (or choose the apex as primary — just be consistent; the platform uses
  `NEXT_PUBLIC_SITE_URL` as the canonical base).

Vercel shows the exact DNS records to create and issues HTTPS certificates
automatically once DNS resolves.

## 2. DNS records (at the domain registrar)

Typical values Vercel asks for:

| Type | Name | Value |
|---|---|---|
| `A` | `@` (apex) | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Always copy the values shown in *your* Vercel project — they can vary.
Propagation usually takes 5–30 minutes (occasionally up to 48h).

**Don't touch existing `MX` records** if the restaurant receives email on the
domain — web DNS changes above don't affect email delivery.

## 3. Point the app at the domain

1. Vercel → Environment Variables → set
   `NEXT_PUBLIC_SITE_URL=https://www.example.co.uk` (match the primary host
   you chose, no trailing slash).
2. **Redeploy** so canonical tags, Open Graph URLs, `sitemap.xml` and
   `robots.txt` are generated with the new domain.
3. Verify:
   - `https://www.example.co.uk/sitemap.xml` lists the new domain
   - View-source on the homepage: `rel="canonical"` and `og:url` use it
   - The apex redirects to the primary host

## 4. Google

1. Add the property in **Google Search Console** (Domain property via DNS
   TXT is easiest) and submit `sitemap.xml`.
2. Update the restaurant's **Google Business Profile** website link.
3. In admin → *Business settings*, paste the Google Place ID / review link
   so "review us" prompts and structured data are complete.

## 5. Email sending from the domain (optional but recommended)

If notification emails should come *from* the restaurant's domain:

- **Resend:** add the domain in Resend and create the SPF/DKIM DNS records it
  provides, then set `RESEND_API_KEY` (+ `EMAIL_FROM`).
- **SMTP:** use the restaurant's existing mailbox provider credentials.

Without this, emails still send from your platform account's verified
address with the restaurant's name as the display name.
