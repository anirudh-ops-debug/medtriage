

## Plan: Remove Accessibility Module + Add Hindi Language

### 1. Remove Accessibility Module

**Files to modify:**
- `src/components/AppSidebar.tsx` — Remove the `{ path: "/accessibility", ... }` entry from `navKeys` array and remove the `Accessibility` import from lucide-react.
- `src/App.tsx` — Remove the `AccessibilityPage` import and the `/accessibility` route.
- `src/i18n/en.json` — Remove the `"accessibility"` section and `"nav.accessibility"` key.
- `src/i18n/ta.json` — Same removals.

**File to delete:**
- `src/pages/AccessibilityPage.tsx`

### 2. Add Hindi Language Support

**New file:**
- `src/i18n/hi.json` — Full Hindi translation file mirroring en.json structure, using proper Hindi Unicode (e.g., "डैशबोर्ड", "लॉगिन", "मरीज़", etc.). Will not include the removed `accessibility` section.

**Files to modify:**
- `src/i18n/LanguageContext.tsx` — Add `"hi"` to the `Language` type, import `hi.json`, add to `translations` map, update localStorage logic to accept `"hi"`.
- `src/components/LanguageToggle.tsx` — Add a third button for "हिन्दी".
- `src/i18n/en.json` — Add `"lang.hi": "हिन्दी"`.
- `src/i18n/ta.json` — Add `"lang.hi": "हிन्दी"`.

### Constraints respected
- No backend, database, auth, env, or package.json changes.
- No structural changes beyond the two tasks above.

