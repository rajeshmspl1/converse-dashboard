# Partner (white-label) hosts

A partner host shows its own landing page at `/`. Its J1–J4 buttons open the public Experience
Shop, and its own login lands on `/migrate`, where "My IVR" runs the partner's demo tenant.
Every other host (aiivrs.com, staging.aiivrs.com, …) is unchanged.

## How it works (code)

| Piece | File |
|---|---|
| Host registry (single source of truth): host → `id`, `apiEnv` | `public/partners/registry.json` |
| Typed, pure-data wrapper (no browser APIs) | `src/config/partners.ts` |
| `/` rewrite per partner host, before the default home-v2 rule | `next.config.ts` |
| Partner host → existing API environment (`staging` / `prod`) | `src/lib/env.ts` |
| Landing page (one template for all partners, `noindex`) | `public/partners/template.html`, `template.js` |
| Post-login path, demo display name, hide Reset | `src/lib/partner.ts` (login, `/migrate`, `/experience`) |

The landing page finds its partner by hostname via `registry.json` (a rewrite keeps `/` in the
browser, so `?p=<id>` only serves previews and must be a registry id). Colours, font, logo path and
all text are validated and rendered with `textContent`; anything invalid falls back to the default
home page.

## Add a partner

1. **Config** — `public/partners/<id>/partner.json` (`<id>` matches `^[a-z0-9-]+$`). Never name it
   `config.json`: the WAF (OWASP CRS rule 930130, restricted files) blocks any path containing it.
   - `name`, `logo` (must be under `/partners/<id>/`), `font` (Google Fonts family name)
   - optional: `heading_font` (Google Fonts family for headings; body keeps `font`), `favicon` (browser-tab icon,
     `.png`/`.svg`/`.ico` under `/partners/<id>/`; without it the tab shows the AiIVRs icon)
   - `colours`: `primary`, `accent`, `secondary`, `alert` — each `#RRGGBB`
   - `hero_title`, `hero_subtitle`, `cta_label`, `journeys_title`, `contact_title`, `contact_text`, `powered_by`
   - `journeys`: exactly 4 × `{ "label", "outcome" }` for J1–J4 (journey and routing mode are fixed by the platform)
   - `demo_tenant_key`, `demo_display_name`, `post_login` (same-site path, e.g. `/migrate`), `hide_reset`
   - Public copy states outcomes only — never how the product works. Write "and", not "&".
2. **Logo** — `public/partners/<id>/logo.svg` (or `.png`).
3. **Registry line** — add `{ "host": "<host>", "id": "<id>", "apiEnv": "staging" | "prod" }` to `registry.json`.
4. **Tests** — `node scripts/test_partners.mjs` (registry shape, template validation).
5. **DNS** — A record `<host>` → the ingress-nginx public IP.
6. **Ingress** — a separate Ingress for `<host>` → `frontend:80` with its own cert-manager certificate
   (`letsencrypt-prod`). Do not edit existing ingresses.
7. **CORS** — add `https://<host>` to service-b `CORS_ORIGINS` for that environment.
8. **Demo tenant** — copy an IVR into a new tenant (Service P register/provision + row copy), then
   load it into Service C/D with `scripts/push_tenant_to_cd.py` (converse-ai repo) and register it
   with Service F (`/crm/demo-profiles/register-tenant`).
9. **Seed login + migration row** — `reports/<round>/tools/seed_partner_login.py`: a `tester` user for
   the demo tenant (bcrypt inside the service-b pod; password only in a chmod-600 file) and ONE
   `migration_requests` row (`file_upload`, `complete`) so `/migrate` shows "My IVR".

## Known limits

- Hiding Reset is UI-only; `POST /migrate/reset` still accepts the call.
- `/dashboard` still shows the raw tenant key in its header.
