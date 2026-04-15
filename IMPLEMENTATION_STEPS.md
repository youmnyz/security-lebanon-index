# Lebanon Security Index Migration - Implementation Steps

## Current Status ✅

- **Code**: Deployed to GitHub (main branch) - READY
- **Render Service**: Live at https://security-lebanon-index.onrender.com/lebanon-security-index/ - READY
- **Sitemap**: Generating correctly at path-based URL - READY
- **Backend Config**: APP_URL environment variable configured - READY
- **Build Config**: Vite and React Router configured for /lebanon-security-index/ path - READY

## Current Hosting Architecture

- `zodsecurity.com/` → Bluehost (WordPress hosting)
- `lebanon-security-index.zodsecurity.com/` → Vercel (old SPA deployment)
- `security-lebanon-index.onrender.com/lebanon-security-index/` → Render (NEW - ready for production)

## What's Needed to Go Live

You need to route traffic from `zodsecurity.com/lebanon-security-index/*` to the Render service.

### Recommended Option: Reverse Proxy (Keep current Bluehost hosting)

Since zodsecurity.com is on Bluehost, add a reverse proxy that forwards the `/lebanon-security-index` path to Render.

---

## Implementation: Bluehost Reverse Proxy Setup

### Step 1: Access Bluehost cPanel

1. Log into your Bluehost account at https://www.bluehost.com
2. Go to **cPanel** (usually at `yourdomain.com/cpanel` or via dashboard)
3. Look for **"Apache HTTP Server Directives"** or **".htaccess Manager"** (for Bluehost, this might be under Advanced)

### Step 2: Create/Edit .htaccess File

If using Apache (Bluehost typically uses Apache):

```apache
# Add this to your root .htaccess file (or create one in root directory)
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Route lebanon-security-index path to Render
    RewriteCond %{REQUEST_PATH} ^/lebanon-security-index(/|$)
    RewriteRule ^lebanon-security-index(/.*)?$ https://security-lebanon-index.onrender.com/lebanon-security-index$1 [P,L]
    
    # Standard WordPress rewriting (keep existing rules)
    # ... rest of your .htaccess
</IfModule>
```

### Step 3: Enable Required Apache Modules

In cPanel, ensure these modules are enabled:
- **mod_rewrite** ✅ (usually enabled)
- **mod_proxy** (may need to request from Bluehost support)
- **mod_proxy_http** (may need to request from Bluehost support)

### Alternative: Contact Bluehost Support

If you don't have access to .htaccess or Apache modules:

1. Open a Bluehost support ticket (https://www.bluehost.com/support)
2. Request: *"I need to set up a reverse proxy to route /lebanon-security-index/* to security-lebanon-index.onrender.com"*
3. Provide the .htaccess configuration above
4. They'll implement it or guide you through their interface

---

## Testing After Setup

Once reverse proxy is configured, test:

```bash
# Test main path
curl -I https://zodsecurity.com/lebanon-security-index/

# Test specific route
curl -I https://zodsecurity.com/lebanon-security-index/archive

# Test sitemap
curl https://zodsecurity.com/lebanon-security-index/sitemap.xml | head -20

# Test specific date
curl -I https://zodsecurity.com/lebanon-security-index/risk-assessment/2026-04-15
```

All should return **200 OK** (not 404).

---

## What About the Old Subdomain?

The old subdomain (`lebanon-security-index.zodsecurity.com`) is on Vercel. You can:

1. **Keep it running** - No additional changes needed
2. **Decommission it** - Remove DNS CNAME record pointing to Vercel (optional, for DNS cleanup)
3. **Add 301 redirect** - Set up permanent redirect from subdomain to new path (recommended for SEO)

To add a redirect on Vercel (if desired), Vercel provides a `vercel.json` configuration. Contact Vercel support or see their documentation.

---

## After Live: Google Search Console

1. Add property: `https://zodsecurity.com/lebanon-security-index`
2. Verify ownership
3. Submit sitemap: `https://zodsecurity.com/lebanon-security-index/sitemap.xml`
4. Monitor for indexing

---

## Troubleshooting

### "502 Bad Gateway" error
- Check Render service is running: https://security-lebanon-index.onrender.com/lebanon-security-index/
- Check mod_proxy is enabled on Bluehost
- Contact Bluehost support to verify proxy configuration

### "Sitemap not found" (404)
- Verify path is exactly `/lebanon-security-index/` (with trailing slash)
- Check that requests are reaching Render (not being served by WordPress)

### "Assets not loading" or "CSS broken"
- This means the proxy is working but rewriting is broken
- Verify RewriteCond and RewriteRule syntax in .htaccess
- Check that [P] flag (proxy flag) is enabled

---

## Timeline

- **Now**: Reverse proxy setup (Bluehost) - 1 hour
- **+1-2 hours**: DNS propagation (if any changes)
- **+24 hours**: Google crawls new URL
- **+1-2 weeks**: New URL ranks for keywords "security lebanon", "safety lebanon"

---

## What I've Already Done ✅

- ✅ Updated vite.config.ts: base path set to `/lebanon-security-index/`
- ✅ Updated src/main.tsx: BrowserRouter basename set to `/lebanon-security-index`
- ✅ Updated server.ts: All 50+ hardcoded URLs replaced from subdomain to path-based
- ✅ Updated src/App.tsx: Schema URLs updated
- ✅ Updated src/pages/*: All page-level schemas updated
- ✅ Updated render.yaml: APP_URL environment variable configured
- ✅ Verified Render deployment: Service is live and serving correct URLs
- ✅ Verified sitemap: Generating with correct path-based URLs

## What You Need to Do

1. **Bluehost reverse proxy setup** (2 options):
   - Option A: Use cPanel .htaccess editor (if available)
   - Option B: Contact Bluehost support with configuration

2. **Test the routing** once configured

3. **Update Google Search Console** (optional but recommended)

---

## Need Help?

The Render service is working correctly. The only remaining step is the reverse proxy configuration on Bluehost. If you get stuck:
- Bluehost has 24/7 support
- Share the .htaccess configuration from Step 2 above with their support team
- They can implement it for you
