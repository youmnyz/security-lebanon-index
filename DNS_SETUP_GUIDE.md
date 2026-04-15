# DNS Configuration Guide: Move to Path-Based URL

## Current Setup
- **Service Name**: security-lebanon-index
- **Render URL**: https://security-lebanon-index.onrender.com
- **Current Domain**: https://lebanon-security-index.zodsecurity.com (subdomain)

## Target Setup
- **New URL**: https://zodsecurity.com/lebanon-security-index (path-based)
- **SEO Benefit**: Consolidates all authority under main domain

---

## Option 1: Using Render Custom Domain (Recommended)

### Step 1: Go to Render Dashboard
1. Open https://dashboard.render.com
2. Select your "security-lebanon-index" service
3. Click on "Settings" tab

### Step 2: Add Custom Domain
1. Scroll to "Custom Domain" section
2. Click "Add Custom Domain"
3. Enter: `zodsecurity.com` (just the main domain, NOT a subdomain)
4. Click "Add"

### Step 3: Update DNS Records
Render will show you DNS configuration needed. You have two options:

#### Option A: Using CNAME (Easier)
If zodsecurity.com uses a registrar like Namecheap, GoDaddy, etc:
1. Go to your domain registrar's DNS settings
2. Find your DNS records
3. **For the root domain (@)**, you may need to use ALIAS or ANAME record (not all registrars support CNAME for root)
4. Point to: `cname.onrender.com.` or whatever Render specifies
5. Wait 24-48 hours for DNS propagation

#### Option B: Using A Record (Most Reliable)
1. Go to your domain registrar's DNS settings
2. Update the **A record** for `@` (root domain)
3. Point to the IP address that Render provides
4. TTL: 3600 (1 hour)

### Step 4: Verify Setup
Once DNS propagates, test:
```bash
# Check if domain resolves
nslookup zodsecurity.com

# Test the service
curl https://zodsecurity.com/lebanon-security-index/
```

---

## Option 2: Using Render Native Subdomain with Path Routing

If you want to keep the subdomain approach but route to a path:

1. In Render Dashboard → Settings → "Custom Domain"
2. Add: `lebanon-security-index.zodsecurity.com` (the subdomain)
3. Update DNS to point this subdomain to Render
4. Render handles path routing automatically

**⚠️ SEO Note**: This keeps the subdomain, so SEO authority stays separate. Not recommended for your goal.

---

## Option 3: Main Domain with Subdirectory via Reverse Proxy

If zodsecurity.com is hosted elsewhere (not Render):

1. Keep zodsecurity.com on current host
2. Configure reverse proxy at `/lebanon-security-index/*`
3. Route to: `https://security-lebanon-index.onrender.com`

**Example nginx configuration**:
```nginx
location /lebanon-security-index/ {
    proxy_pass https://security-lebanon-index.onrender.com/;
    proxy_set_header Host security-lebanon-index.onrender.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## Render Environment Variables (Already Configured)

The following has been set in `render.yaml`:
```yaml
APP_URL=https://zodsecurity.com/lebanon-security-index
```

This ensures:
- Sitemap appears at `/lebanon-security-index/sitemap.xml`
- Robots.txt appears at `/lebanon-security-index/robots.txt`
- Schema.org URLs are correct
- Canonical tags point to correct URL

---

## After DNS is Live: Test Everything

### 1. Test Main URL
```bash
curl -I https://zodsecurity.com/lebanon-security-index/
# Should return 200 OK
```

### 2. Test Specific Routes
```bash
# Archive page
curl -I https://zodsecurity.com/lebanon-security-index/archive

# Risk assessment
curl -I https://zodsecurity.com/lebanon-security-index/risk-assessment/2026-04-05

# Sitemap
curl https://zodsecurity.com/lebanon-security-index/sitemap.xml

# Robots.txt
curl https://zodsecurity.com/lebanon-security-index/robots.txt
```

### 3. Check Search Console
1. Add new URL to Google Search Console: https://zodsecurity.com/lebanon-security-index
2. Verify site ownership
3. Submit sitemap at: https://zodsecurity.com/lebanon-security-index/sitemap.xml
4. Check for indexing issues

### 4. Setup 301 Redirects (Optional)
To preserve backlinks from the old subdomain, add redirect middleware in server.ts:
```typescript
app.all('*', (req, res, next) => {
  if (req.hostname === 'lebanon-security-index.zodsecurity.com') {
    return res.redirect(301, `https://zodsecurity.com/lebanon-security-index${req.path}`);
  }
  next();
});
```

---

## Troubleshooting

### "Page not found" after DNS setup
- Clear browser cache (Ctrl+Shift+Delete)
- Wait for DNS propagation (can take up to 48 hours)
- Check DNS with: `dig zodsecurity.com`

### Sitemap not accessible
- Verify you're visiting: https://zodsecurity.com/lebanon-security-index/sitemap.xml
- Not: https://zodsecurity.com/sitemap.xml

### SSL certificate error
- Render provides free SSL certificates
- May take 15-30 minutes to provision
- Check Render Dashboard for certificate status

---

## Timeline

- **Immediately**: Code deployed, API updated ✅
- **Within 1 hour**: Update DNS records (you do this)
- **Within 24 hours**: DNS propagates
- **Within 48 hours**: Full propagation, all users see new URL
- **Within 1-2 weeks**: Google crawls and indexes new URL

---

## Questions?

If you need help with any step, let me know the specific issue and I can assist further!
