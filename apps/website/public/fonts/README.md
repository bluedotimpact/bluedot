# BlueDot Fonts

## ⚠️ IMPORTANT: Do Not Delete Any Fonts

These fonts are used across multiple applications in the monorepo. The Roobert and Reckless Neue fonts are served from this directory via HTTPS URLs defined in the shared UI library.

## Font Strategy

### Monorepo Context
This directory serves fonts for both:
1. **The website app** (Inter fonts via next/font/local)
2. **8+ other apps** (Roobert/Reckless fonts via HTTPS URLs)

### Why We Keep All Fonts
- The shared UI library (`/libraries/ui/`) defines font URLs pointing to `https://bluedot.org/fonts/*`
- Other apps (Storybook, Meet, Room, Editor, etc.) load fonts from these URLs
- Deleting the legacy fonts would break typography in all other apps
- The website overrides these fonts locally while preserving them for others

## Current Fonts

### Shared UI Library Fonts (Used by 8+ apps)
- **Roobert**: Default sans-serif font (weights: 300, 400, 600, 700)
  - Note: Roobert uses weight 650 for SemiBold, which is non-standard
- **Reckless Neue**: Serif font for special text (weights: 300, 300i, 700)

### Website-Only Fonts (As of August 2025)
The website app uses Inter fonts via Next.js font optimization:
- **Inter**: Default font for all body text and UI elements
- **Inter Display**: Used exclusively for headlines and headings

## Font Files in This Directory

**Legacy fonts (DO NOT DELETE - used by other apps):**
- `RecklessNeue-*.woff2`
- `Roobert-*.woff2`

**Website-specific fonts:**
- `Inter-*.woff2`
- `InterDisplay-*.woff2`

## Licensing

### Legacy Fonts (Displaay Type Foundry License)
We have a license from Displaay Type Foundry for:

- Reckless Neue: Uprights + Italics (Thin, Thin Italic, Light, Light Italic, Book, Book Italic, Regular, Regular Italic, Medium, Medium Italic, SemiBold, SemiBold Italic, Bold, Bold Italic, Heavy, Heavy Italic)
- Roobert: Uprights + Italics (Light, Light Italic, Regular, Regular Italic, Medium, Medium Italic, SemiBold, SemiBold Italic, Bold, Bold Italic, Heavy, Heavy Italic)

You can find a copy of the license details in the team 'BlueDot Branding' Google Drive.

### Inter Fonts (Open Source)
Inter fonts are open source and available under the SIL Open Font License 1.1:
- Inter: https://github.com/rsms/inter
- License: https://github.com/rsms/inter/blob/master/LICENSE.txt
