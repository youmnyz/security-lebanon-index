# Automated Bluehost Reverse Proxy Configuration

I've created an automated Python script that will configure your reverse proxy on Bluehost. This is the fastest way to set up the path-based URL routing.

## Quick Start

### Option 1: Run from Windows Command Prompt (Easiest)

1. **Open Command Prompt** (Win+R, type `cmd`, press Enter)

2. **Navigate to the project folder:**
   ```
   cd C:\Users\youmna.zod\Desktop\Security Index
   ```

3. **Run the configuration script:**
   ```
   python configure-bluehost-proxy.py
   ```

4. **Follow the prompts:**
   - Enter your domain: `zodsecurity.com`
   - Enter your cPanel username
   - Enter your cPanel password (won't be displayed)

5. **Wait for completion** - the script will:
   - ✅ Authenticate with your cPanel
   - ✅ Retrieve your current .htaccess file
   - ✅ Add reverse proxy configuration
   - ✅ Save the updated file
   - ✅ Verify the proxy is working

### Option 2: Run from PowerShell

1. **Open PowerShell** (Win+R, type `powershell`, press Enter)

2. **Navigate to the project folder:**
   ```
   cd "C:\Users\youmna.zod\Desktop\Security Index"
   ```

3. **Run the script:**
   ```
   python configure-bluehost-proxy.py
   ```

4. **Follow the same prompts as Option 1**

## What the Script Does

The Python script will:

1. **Connect to your cPanel** using the credentials you provide
2. **Fetch your current .htaccess file** to understand your configuration
3. **Generate reverse proxy rules** that route `/lebanon-security-index/*` to Render
4. **Update .htaccess** with the new configuration
5. **Verify the setup** by testing if the route works

## What You Need

- Python 3.x installed on your computer
- Your cPanel username
- Your cPanel password
- An internet connection

## Install Python (if needed)

If you get an error "python is not recognized":

1. Download Python from https://www.python.org/downloads/
2. Run the installer
3. **IMPORTANT**: Check "Add Python to PATH" during installation
4. Restart your computer
5. Try running the script again

## After Configuration

Once the script completes successfully:

1. **Wait 5-10 minutes** for changes to propagate through Bluehost

2. **Test it's working:**
   ```
   curl -I https://zodsecurity.com/lebanon-security-index/
   # Should return: HTTP/1.1 200 OK
   ```

   Or visit in your browser:
   ```
   https://zodsecurity.com/lebanon-security-index/
   ```

3. **Check all routes:**
   - Homepage: `https://zodsecurity.com/lebanon-security-index/`
   - Archive: `https://zodsecurity.com/lebanon-security-index/archive`
   - Sitemap: `https://zodsecurity.com/lebanon-security-index/sitemap.xml`
   - Robots: `https://zodsecurity.com/lebanon-security-index/robots.txt`

4. **Update Google Search Console:**
   - Add property: `https://zodsecurity.com/lebanon-security-index`
   - Submit sitemap

## Troubleshooting

### "ModuleNotFoundError: No module named 'requests'"

The script needs the `requests` library. Install it:

```
pip install requests
```

Then run the script again.

### "SSL: CERTIFICATE_VERIFY_FAILED"

This is normal for cPanel's self-signed certificate. The script handles this automatically.

### "Authentication failed"

Double-check:
- Domain name is correct
- cPanel username is correct (sometimes different from account email)
- Password is correct
- You haven't exceeded login attempts (wait 15 min if locked out)

### "Failed to retrieve .htaccess file"

If the file doesn't exist, the script will create it. This is fine.

### "Reverse proxy is not working"

After running the script:
1. Wait 10-15 minutes for Bluehost to apply changes
2. Clear your browser cache (Ctrl+Shift+Delete)
3. Try accessing the URL again
4. Check your cPanel logs for errors

If still not working:
- Verify Apache modules are enabled (contact Bluehost support)
- Run the script again to ensure file was saved

## Manual Alternative (if script fails)

If the script doesn't work, you can manually configure it:

1. Log into cPanel directly at: `https://zodsecurity.com:2083`
2. Find "File Manager"
3. Navigate to home directory (/)
4. Look for or create `.htaccess`
5. Edit the file and add the configuration from `IMPLEMENTATION_STEPS.md`
6. Save and test

## Need Help?

If you encounter issues:

1. **Check the logs** in the Command Prompt/PowerShell window
2. **See IMPLEMENTATION_STEPS.md** for manual configuration
3. **Contact Bluehost Support**:
   - Phone: 1-888-401-4678
   - Chat: 24/7 at bluehost.com
   - Mention: "Reverse proxy for path-based routing"

## Security Note

⚠️ This script handles your cPanel credentials. It:
- ✅ Only connects to your own cPanel server
- ✅ Doesn't store credentials anywhere
- ✅ Only modifies .htaccess file
- ✅ Runs locally on your computer (no external servers)

Your credentials are never sent to any external service except your own Bluehost cPanel.

---

**Ready?** Open Command Prompt and run:
```
python configure-bluehost-proxy.py
```

The setup should complete in under 2 minutes! 🚀
