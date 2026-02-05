# Malleable

A quarterly micro-magazine. Things made, found, and thought about.

## Structure

```
malleable/
├── template/           # Shared CSS, JS, and logos
│   ├── malleable.css
│   ├── malleable.js
│   ├── MALLEABLE-Logo-wh.png   # White logo (for dark backgrounds)
│   └── MALLEABLE-Logo-bl.png   # Black logo (for light backgrounds)
├── tools/
│   └── cover-generator.html   # Browser-based cover composition tool
├── editions/
│   └── edition-XX/
│       ├── index.html
│       └── assets/
│           ├── cover.mp4          # Cover video (portrait, 1080×1920)
│           ├── cover-still.jpg    # Still frame for fallback
│           ├── cover-composed.jpg # Newsletter cover with overlay
│           └── page-XX.jpg        # Page images
├── candidates.json     # Inoreader items (n8n populated)
└── README.md
```

## Creating an edition

### 1. Gather content

Review `candidates.json` for Found section ideas.

Decide:
- **Made**: What completed work to feature
- **Found**: What discovery or link to share
- **Thinking**: What quote or idea to include

### 2. Create assets

**Cover video** (iPhone 15 Pro)
- Portrait orientation (9:16)
- 1080×1920 resolution
- 3-8 seconds, subtle motion
- MP4 format

**Cover still**
- Extract frame from video (QuickTime: Edit → Copy → Preview → Paste → Save)
- Save as cover-still.jpg

**Cover composed**
- Open `tools/cover-generator.html` in browser
- Load video, logo, set colour and text
- Switch to Preview mode, screenshot
- Save as cover-composed.jpg

**Page images**
- 1080×1920 minimum (portrait)
- JPG, 85% quality
- Name as page-01.jpg, page-02.jpg, etc.

### 3. Build edition

1. Copy previous edition folder
2. Rename to `edition-XX`
3. Replace assets
4. Edit `index.html`:
   - Update page count
   - Update text content
   - Update meta tags (title, OG image URL)
   - Update frame colour if different

### 4. Publish

1. Commit and push to main
2. GitHub Actions deploys automatically
3. Create Ghost newsletter draft
4. Send newsletter
5. Screenshot pages for Instagram Stories

## Frame colours by edition

| Edition | Colour | Hex |
|---------|--------|-----|
| 01 | Dusty Blue | #4A90A4 |
| 02 | Terracotta | #C4654A |
| 03 | Sage | #7A9A7E |
| 04 | Warm Grey | #8B8680 |

## Local testing

Open `editions/edition-XX/index.html` directly in browser.

For video autoplay to work, you may need to serve via local server:

```bash
cd malleable
python3 -m http.server 8000
# Open http://localhost:8000/editions/edition-01/
```

## n8n integration

The `candidates.json` file is populated by n8n workflow that pulls tagged items from Inoreader. See n8n workflow documentation separately.
