# ✅ Testing & Validation Report

**Project:** Holidaze  
**Live:** https://fed2-exam.netlify.app/  
**Last tested:** 2025-09-23  
**Environment:** Chrome (latest) on Windows 11 + iPhone 14 Pro (emulated)

---

## 🧪 Manual Testing (User Stories)

### All users
- [x] View list of venues (handles empty state/paging gracefully)
- [x] Search venues (query + price/amenities/country; URL-synced)
- [x] View venue page by ID (gallery, map fallback, amenities)
- [x] Calendar disables past & booked dates

### Customers
- [x] Register → Login → Logout (@stud.noroff.no / @noroff.no)
- [x] Create a booking (valid range, ≤ `maxGuests`)
- [x] View upcoming bookings
- [x] Update avatar & banner

### Venue managers
- [x] Route guard for manager-only pages
- [x] Create venue (validation + multiple images)
- [x] Edit venue
- [x] Delete venue (confirm)
- [x] **Upcoming bookings per managed venue** (Profile → “My venues” shows “_n_ upcoming” + next range)

_Notes:_ Overlap bookings are blocked; invalid date ranges are cleared; calendar treats `dateTo` as checkout (exclusive).

---

## 🌐 HTML Validator (W3C)

Tool: https://validator.w3.org/  
Date: 2025-09-23

- **Home** — ✅  
- **Venue detail** — ✅  
- **Login / Register** — ✅  
- **Profile / Manage** — ✅  

_Key fixes:_ added missing labels, removed legacy self-closing slashes on void elements.

---

## 📊 Lighthouse (production URL)

Tool: Chrome DevTools → Lighthouse  
Date: 2025-09-23  
Full reports saved in `docs/lighthouse/`. Preview PNGs in `docs/lighthouse/screenshots/`.

### Desktop (example)
| Page         | Perf | A11y | BP | SEO |
|--------------|-----:|-----:|---:|----:|
| Home         | 100  | 100  | 100| 91-92 |
| Venue detail | 98-100  | 100  | 100| 91-92 |
| Profile      | 98-100  | 100  | 100| 91-92 |
| Manage       | 100  | 100  | 100|# ✅ Testing & Validation Report

**Project:** Holidaze  
**Live:** https://fed2-exam.netlify.app/  
**Last tested:** 2025-09-23  
**Environment:** Chrome (latest) on Windows 11 + iPhone 14 Pro (emulated)

---

## 🧪 Manual Testing (User Stories)

### All users
- [x] View list of venues (handles empty state/paging gracefully)
- [x] Search venues (query + price/amenities/country; URL-synced)
- [x] View venue page by ID (gallery, map fallback, amenities)
- [x] Calendar disables past & booked dates

### Customers
- [x] Register → Login → Logout (@stud.noroff.no / @noroff.no)
- [x] Create a booking (valid range, ≤ `maxGuests`)
- [x] View upcoming bookings
- [x] Update avatar & banner

### Venue managers
- [x] Route guard for manager-only pages
- [x] Create venue (validation + multiple images)
- [x] Edit venue
- [x] Delete venue (confirm)
- [x] **Upcoming bookings per managed venue** (Profile → “My venues” shows “_n_ upcoming” + next range)

_Notes:_ Overlap bookings are blocked; invalid date ranges are cleared; calendar treats `dateTo` as checkout (exclusive).

---

## 🌐 HTML Validator (W3C)

Tool: https://validator.w3.org/  
Date: 2025-09-23

- **Home** — ✅  
- **Venue detail** — ✅  
- **Login / Register** — ✅  
- **Profile / Manage** — ✅  

_Key fixes:_ added missing labels, removed legacy self-closing slashes on void elements.

---

## 📊 Lighthouse (production URL)

Tool: Chrome DevTools → Lighthouse  
Date: 2025-09-23  
Full reports saved in `docs/lighthouse/`. Preview PNGs in `docs/lighthouse/screenshots/`.

### Desktop (example)
| Page         | Perf | A11y | BP | SEO |
|--------------|-----:|-----:|---:|----:|
| Home         | 100  | 100  | 100| 91 |
| Venue detail | 98-100  | 100  | 100| 91 |
| Profile      | 98-100  | 100  | 100| 91 |
| Manage       | 100  | 100  | 100| 91 |

### Mobile (example)
| Page         | Perf | A11y | BP | SEO |
|--------------|-----:|-----:|---:|----:|
| Home         | 93–100 | 100 | 100 | 91 |
| Venue detail | 92–100 | 100 | 100 | 91 |
| Profile      | ~94   | 100 | 100 | 91 |
| Manage       | 100 | 100 | 100 | 91 |

_Notes:_ Removed Google Fonts preconnects to improve LCP on Profile. All pages lazy-load routes; images use intrinsic size + `aspect-ratio` to avoid CLS.

---

## ♿ Accessibility (WAVE)

Tool: https://wave.webaim.org/  
Date: 2025-09-23

**Result:** 0 errors on Home / Venue / Profile / Manage / Bookings.  
Actions verified:
- [x] Alt text for non-decorative images
- [x] Explicit labels for form fields
- [x] Visible focus styles + skip link
- [x] Mobile drawer: Esc to close, focus returns to trigger, backdrop non-interactive
- [x] WCAG-compliant contrast via theme tokens |

### Mobile (example)
| Page         | Perf | A11y | BP | SEO |
|--------------|-----:|-----:|---:|----:|
| Home         | 98–100 | 100 | 100 | 100 |
| Venue detail | 98–100 | 100 | 100 | 100 |
| Profile      | ~94   | 100 | 100 | 100 |
| Manage       | 98–100 | 100 | 100 | 100 |

_Notes:_ Removed Google Fonts preconnects to improve LCP on Profile. All pages lazy-load routes; images use intrinsic size + `aspect-ratio` to avoid CLS.

---

## ♿ Accessibility (WAVE)

Tool: https://wave.webaim.org/  
Date: 2025-09-23

**Result:** 0 errors on Home / Venue / Profile / Manage / Bookings.  
Actions verified:
- [x] Alt text for non-decorative images
- [x] Explicit labels for form fields
- [x] Visible focus styles + skip link
- [x] Mobile drawer: Esc to close, focus returns to trigger, backdrop non-interactive
- [x] WCAG-compliant contrast via theme tokens

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
