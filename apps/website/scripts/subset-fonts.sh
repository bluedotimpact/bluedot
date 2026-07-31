#!/usr/bin/env bash
# Regenerates the subsetted InterDisplay woff2 in public/fonts/.
#
# These files are served at https://bluedot.org/fonts/ and consumed two ways:
#   1. next/font build input for this app (src/lib/fonts.ts)
#   2. @font-face in libraries/ui/src/default-config/tailwind.css, which every
#      other app in the monorepo loads over HTTPS
# so a change here affects all apps, not just the website.
#
# Subsetting to latin + latin-ext takes each weight from ~106kB to ~42kB. Glyphs
# outside the range fall back to Inter, which is full-coverage and already loaded
# everywhere (.bluedot-h1/h2 resolve to `InterDisplay, var(--font-sans)`), so the
# degradation is a same-typeface optical-size shift rather than a system font.
#
# `--layout-features+=` is required: ss04 is used by the homepage/lander section
# headings, and the default subsetter feature set drops ss01-ss20 silently.
#
# The pre-subset originals are recoverable from git history:
#   git show 28b8c9fd9:apps/website/public/fonts/InterDisplay-Regular.woff2
# Re-run this against those, not against already-subsetted files, if the range
# ever needs widening.
#
# Requires: python3 with fonttools + brotli (pip install 'fonttools[woff]').

set -euo pipefail

cd "$(dirname "$0")/.."

LATIN='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
LATIN_EXT='U+0100-02AF,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
FEATURES='ss01,ss02,ss03,ss04,cv01,cv02,tnum,case,zero'

for weight in Regular Medium SemiBold Bold; do
  src="public/fonts/InterDisplay-${weight}.woff2"
  tmp="$(mktemp -t "InterDisplay-${weight}.XXXXXX").woff2"

  python3 -m fontTools.subset "$src" \
    --output-file="$tmp" \
    --flavor=woff2 \
    --unicodes="${LATIN},${LATIN_EXT}" \
    --layout-features+="$FEATURES"

  python3 - "$tmp" <<'PY'
import sys
from fontTools.ttLib import TTFont

font = TTFont(sys.argv[1])
features = {
    record.FeatureTag
    for record in font['GSUB'].table.FeatureList.FeatureRecord
} if 'GSUB' in font else set()
if 'ss04' not in features:
    sys.exit('ss04 missing from subset output; headings using it would regress')
PY

  mv "$tmp" "$src"
  printf '%-34s %s\n' "$src" "$(du -h "$src" | cut -f1)"
done
