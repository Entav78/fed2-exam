# ✅ Testing & Validation Report

Project: **Holidaze**  
Live URL: https://fed2-exam.netlify.app/  
Date of last test: **[YYYY-MM-DD]**  
Environment: Chrome [version], Windows/macOS; iPhone 14 Pro (emulated)

---

## 🧪 Manual Testing (User Stories)

### All Users

- [ ] View list of venues (pagination/empty state)
- [ ] Search venues (query + filters + URL sync)
- [ ] View a venue page by ID (gallery, map fallback, amenities)
- [ ] View calendar with past/booked dates disabled

### Customers

- [ ] Register → Login → Logout
- [ ] Create a booking (valid range, ≤ maxGuests)
- [ ] See upcoming bookings
- [ ] Update avatar/profile picture

### Venue Managers

- [ ] Role guard (manager only routes)
- [ ] Create venue (validation + multi image)
- [ ] Edit venue
- [ ] Delete venue (confirm)
- [ ] See upcoming bookings per managed venue

Notes: _Put any edge cases you tried here (e.g., overlap booking blocked, invalid dates cleared)._

---

## 🌐 HTML Validator (W3C)

Tool: https://validator.w3.org/  
Date: **[YYYY-MM-DD]**

- **Home** — ✅ / ❌ (see `docs/screenshots/html-home.png`)
- **Venue detail** — ✅ / ❌
- **Login / Register** — ✅ / ❌
- **Profile / Manage** — ✅ / ❌

Key fixes/notes: _e.g., added missing `alt`, fixed duplicate IDs._

---

## 📊 Lighthouse (Production URL)

Tool: Chrome DevTools → Lighthouse  
Date: **[YYYY-MM-DD]**  
Full HTML reports are saved in `docs/lighthouse/`.

### Desktop

| Page         | Perf | A11y | Best-Practices | SEO | LCP | CLS |
| ------------ | ---: | ---: | -------------: | --: | --: | --: |
| Home         |      |      |                |     |     |     |
| Venue detail |      |      |                |     |     |     |
| Profile      |      |      |                |     |     |     |
| Manage       |      |      |                |     |     |     |

HTML reports:

- Home: [`home-desktop.html`](docs/lighthouse/home-desktop.html)
- Venue: [`venue-desktop.html`](docs/lighthouse/venue-desktop.html)
- Profile: [`profile-desktop.html`](docs/lighthouse/profile-desktop.html)
- Manage: [`manage-desktop.html`](docs/lighthouse/manage-desktop.html)

### Mobile

| Page         | Perf | A11y | Best-Practices | SEO | LCP | CLS |
| ------------ | ---: | ---: | -------------: | --: | --: | --: |
| Home         |      |      |                |     |     |     |
| Venue detail |      |      |                |     |     |     |
| Profile      |      |      |                |     |     |     |
| Manage       |      |      |                |     |     |     |

HTML reports:

- Home: [`home-mobile.html`](docs/lighthouse/home-mobile.html)
- Venue: [`venue-mobile.html`](docs/lighthouse/venue-mobile.html)
- Profile: [`profile-mobile.html`](docs/lighthouse/profile-mobile.html)
- Manage: [`manage-mobile.html`](docs/lighthouse/manage-mobile.html)

Preview screenshots are in `docs/screenshots/` (e.g., `venue-mobile.png`, `home-desktop.png`).

---

## ♿ Accessibility (WAVE)

Tool: https://wave.webaim.org/  
Date: **[YYYY-MM-DD]**

Results summary:

- Errors: **[#]**
- Contrast: **[#]**
- Alerts: **[#]**

Actions taken:

- [ ] Added `alt` for all non-decorative images
- [ ] Ensured label/aria-label for form fields
- [ ] Verified focus states and skip-link
- [ ] Contrast OK for all themes (tokens in `/styles/themes.css`)

Screenshots: `docs/screenshots/wave-*.png`

---

## 🔁 Repro Steps (how to run these locally)

1. `npm run build && npm run preview`
2. Open http://localhost:4173 (or shown preview port)
3. Run Lighthouse (Desktop + Mobile), save HTML to `docs/lighthouse/`
4. Run WAVE and W3C Validator against the **production** URL

---

## 🐛 Known Issues / Limitations

- Calendar time zones: selection uses local time; cross-TZ edge cases may differ
- Map fallback precision depends on venue address quality
- SPA only (no SSR)

---

## 📸 Evidence

- Lighthouse HTML: `docs/lighthouse/*`
- Screenshots (Lighthouse/WAVE/Validator): `docs/screenshots/*`
- Commit tested: **[`<hash>`](https://github.com/Entav78/fed2-exam/commit/<hash>)**
