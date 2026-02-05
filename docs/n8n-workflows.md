# n8n Workflows for Malleable

## Overview

Two workflows support the Malleable production cycle:

1. **Inoreader → GitHub**: Pulls tagged articles into candidates.json
2. **Quarterly Reminder**: Sends reminder to start edition production

## Workflow 1: Inoreader to GitHub

### Purpose
Collects articles you flag in Inoreader and stores them in the malleable repo for later review.

### Trigger
- Schedule: Daily at 6am (or your preference)
- Or: Webhook (if Inoreader supports it on your plan)

### Setup requirements

**Inoreader API access**
1. Go to Inoreader Preferences → Developer
2. Create an application to get Client ID and Client Secret
3. Generate an OAuth token with read access

**GitHub Personal Access Token**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate token with `repo` scope
3. Save securely

### Workflow nodes

```
[Schedule Trigger]
       ↓
[HTTP Request: Get Inoreader items]
       ↓
[Filter: Items with "malleable" tag]
       ↓
[Code: Transform to candidates format]
       ↓
[HTTP Request: Get existing candidates.json]
       ↓
[Code: Merge and dedupe]
       ↓
[HTTP Request: Update candidates.json]
```

### Node configurations

#### 1. Schedule Trigger
- Trigger interval: Every day
- Hour: 6
- Minute: 0

#### 2. HTTP Request - Get Inoreader items
```
Method: GET
URL: https://www.inoreader.com/reader/api/0/stream/contents/user/-/label/malleable
Headers:
  Authorization: Bearer {{ $credentials.inoreaderToken }}
```

Note: Replace `malleable` with your actual tag name. 

To get starred items instead:
```
URL: https://www.inoreader.com/reader/api/0/stream/contents/user/-/state/com.google/starred
```

#### 3. Code - Transform items
```javascript
// Transform Inoreader items to candidates format
return items.map(item => {
  const data = item.json;
  return {
    json: {
      id: data.id,
      title: data.title || 'Untitled',
      url: data.canonical?.[0]?.href || data.alternate?.[0]?.href || '',
      summary: (data.summary?.content || '').replace(/<[^>]*>/g, '').substring(0, 300),
      source: data.origin?.title || '',
      saved_at: new Date(parseInt(data.crawlTimeMsec)).toISOString()
    }
  };
});
```

#### 4. HTTP Request - Get existing candidates.json
```
Method: GET
URL: https://api.github.com/repos/YOUR_USERNAME/malleable/contents/candidates.json
Headers:
  Authorization: Bearer {{ $credentials.githubToken }}
  Accept: application/vnd.github.v3+json
```

#### 5. Code - Merge and dedupe
```javascript
// Get existing candidates
let existing = [];
try {
  const content = $input.first().json.content;
  existing = JSON.parse(Buffer.from(content, 'base64').toString('utf8'));
} catch (e) {
  existing = [];
}

// Get new items from transform node
const newItems = $('Transform items').all().map(i => i.json);

// Dedupe by URL
const existingUrls = new Set(existing.map(e => e.url));
const toAdd = newItems.filter(n => n.url && !existingUrls.has(n.url));

// Combine
const combined = [...existing, ...toAdd];

// Return for next node
return [{
  json: {
    candidates: combined,
    sha: $input.first().json.sha,
    hasNewItems: toAdd.length > 0
  }
}];
```

#### 6. HTTP Request - Update candidates.json
Only run if there are new items (add IF node before this):

```
Method: PUT
URL: https://api.github.com/repos/YOUR_USERNAME/malleable/contents/candidates.json
Headers:
  Authorization: Bearer {{ $credentials.githubToken }}
  Accept: application/vnd.github.v3+json
Body (JSON):
{
  "message": "Add {{ $json.candidates.length - PREVIOUS_COUNT }} candidates from Inoreader",
  "content": "{{ Buffer.from(JSON.stringify($json.candidates, null, 2)).toString('base64') }}",
  "sha": "{{ $json.sha }}"
}
```

### Credentials to create in n8n

1. **inoreaderToken** (HTTP Header Auth)
   - Name: Authorization
   - Value: Bearer YOUR_OAUTH_TOKEN

2. **githubToken** (HTTP Header Auth)
   - Name: Authorization  
   - Value: Bearer YOUR_GITHUB_PAT

---

## Workflow 2: Quarterly Reminder

### Purpose
Reminds you to start working on the next edition.

### Trigger
Cron expression for first day of Jan, Apr, Jul, Oct:

```
0 9 1 1,4,7,10 *
```

(9am on the 1st of quarter-start months)

### Workflow nodes

```
[Cron Trigger]
       ↓
[Code: Calculate edition number]
       ↓
[Send notification]
```

### Node configurations

#### 1. Cron Trigger
```
Cron expression: 0 9 1 1,4,7,10 *
```

#### 2. Code - Calculate edition
```javascript
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;

// Calculate edition number (starting from 2026 Q1 = Edition 01)
const baseYear = 2026;
const quartersFromStart = ((year - baseYear) * 4) + Math.floor((month - 1) / 3) + 1;
const editionNumber = String(quartersFromStart).padStart(2, '0');

// Quarter name
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const currentQuarter = quarters[Math.floor((month - 1) / 3)];

return [{
  json: {
    edition: editionNumber,
    quarter: currentQuarter,
    year: year,
    message: `Time to start Malleable Edition ${editionNumber} (${currentQuarter} ${year}). Review candidates.json and gather your assets.`
  }
}];
```

#### 3. Notification options

**Option A: Email (Gmail or SMTP)**
- To: your@email.com
- Subject: Malleable Edition {{ $json.edition }} - Time to start
- Body: {{ $json.message }}

**Option B: Pushover**
- Title: Malleable
- Message: {{ $json.message }}

**Option C: Home Assistant**
- Service: notify.mobile_app_YOUR_PHONE
- Message: {{ $json.message }}

---

## Testing

### Test Inoreader workflow
1. Tag an article as "malleable" in Inoreader
2. Manually trigger the workflow
3. Check candidates.json in GitHub for the new item

### Test reminder workflow
1. Manually trigger the workflow
2. Verify notification arrives with correct edition number

---

## Troubleshooting

### Inoreader API not returning items
- Check OAuth token is valid
- Verify tag name matches exactly (case-sensitive)
- Try the starred items endpoint instead

### GitHub update fails
- Check PAT has `repo` scope
- Verify SHA matches current file (fetched in previous step)
- Check JSON encoding is valid

### Notifications not sending
- Test notification node independently
- Check credentials are configured correctly
- Verify n8n has network access to notification service
