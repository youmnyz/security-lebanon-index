#!/usr/bin/env python3
"""
Bluehost Reverse Proxy Configuration Script
Automates the setup of reverse proxy for path-based URL migration
"""

import requests
import json
import sys
from getpass import getpass
from urllib.parse import urljoin

class BluehostProxyConfigurator:
    def __init__(self, cpanel_host, username, password):
        self.cpanel_host = cpanel_host
        self.username = username
        self.password = password
        self.base_url = f"https://{cpanel_host}:2083"
        self.session = requests.Session()
        self.session.verify = False  # Note: Bluehost uses self-signed certs

    def login(self):
        """Authenticate with cPanel"""
        print("🔐 Authenticating with cPanel...")
        login_url = f"{self.base_url}/login/?login_only=1"

        try:
            response = self.session.post(
                login_url,
                data={
                    'user': self.username,
                    'pass': self.password,
                    'login_only': '1'
                }
            )

            if response.status_code == 200:
                print("✅ Successfully authenticated!")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error during authentication: {e}")
            return False

    def get_htaccess_file(self):
        """Retrieve current .htaccess file"""
        print("📄 Retrieving .htaccess file...")

        # cPanel API endpoint for file manager
        api_url = f"{self.base_url}/json-api/cpanel"
        params = {
            'cpanel_jsonapi_user': self.username,
            'cpanel_jsonapi_apiversion': '2',
            'cpanel_jsonapi_module': 'Fileman',
            'cpanel_jsonapi_func': 'fetch_file',
            'dir': '/',
            'file': '.htaccess'
        }

        try:
            response = self.session.get(api_url, params=params)
            if response.status_code == 200:
                data = response.json()
                if data.get('cpanelresult', {}).get('status') == 1:
                    content = data.get('cpanelresult', {}).get('data', {}).get('file', '')
                    print(f"✅ Retrieved .htaccess ({len(content)} bytes)")
                    return content
                else:
                    print("⚠️  .htaccess not found (will be created)")
                    return ""
            else:
                print(f"❌ Error: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error retrieving .htaccess: {e}")
            return None

    def generate_proxy_config(self):
        """Generate the reverse proxy configuration"""
        config = """# Lebanon Security Index - Reverse Proxy Configuration
# Generated: 2026-04-15
# Purpose: Route /lebanon-security-index/* to Render service

<IfModule mod_rewrite.c>
    RewriteEngine On

    # Route lebanon-security-index path to Render
    RewriteCond %{REQUEST_PATH} ^/lebanon-security-index(/|$)
    RewriteRule ^lebanon-security-index(/.*)?$ https://security-lebanon-index.onrender.com/lebanon-security-index$1 [P,L]
</IfModule>

<IfModule mod_proxy.c>
    # Proxy settings for Render service
    ProxyPreserveHost Off
    ProxyRequests Off

    # Allow proxy for our specific path
    <Proxy https://security-lebanon-index.onrender.com/lebanon-security-index/*>
        Order allow,deny
        Allow from all
    </Proxy>
</IfModule>
"""
        return config

    def update_htaccess(self, current_content, new_proxy_config):
        """Update .htaccess with reverse proxy configuration"""
        print("✏️  Updating .htaccess...")

        # Check if config already exists
        if "lebanon-security-index" in current_content:
            print("⚠️  Reverse proxy config already present in .htaccess")
            return current_content

        # Add new config before any existing WordPress/other rules
        updated_content = new_proxy_config + "\n\n" + current_content

        return updated_content

    def save_htaccess_file(self, content):
        """Save updated .htaccess file"""
        print("💾 Saving .htaccess file...")

        api_url = f"{self.base_url}/json-api/cpanel"
        params = {
            'cpanel_jsonapi_user': self.username,
            'cpanel_jsonapi_apiversion': '2',
            'cpanel_jsonapi_module': 'Fileman',
            'cpanel_jsonapi_func': 'save_file',
            'dir': '/',
            'file': '.htaccess',
            'file_contents': content
        }

        try:
            response = self.session.post(api_url, params=params)
            if response.status_code == 200:
                data = response.json()
                if data.get('cpanelresult', {}).get('status') == 1:
                    print("✅ .htaccess updated successfully!")
                    return True
                else:
                    print("❌ Failed to save .htaccess")
                    return False
            else:
                print(f"❌ Error: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error saving file: {e}")
            return False

    def verify_proxy(self):
        """Verify proxy is working"""
        print("🧪 Verifying reverse proxy configuration...")

        try:
            # Give it a moment to take effect
            import time
            time.sleep(2)

            response = requests.get(
                'https://zodsecurity.com/lebanon-security-index/',
                allow_redirects=False,
                timeout=10
            )

            if response.status_code == 200:
                print("✅ Reverse proxy is working! (Status: 200)")
                return True
            elif response.status_code in [301, 302, 303, 307, 308]:
                print(f"⚠️  Got redirect (Status: {response.status_code}) - might be working")
                return True
            else:
                print(f"❌ Got status code: {response.status_code}")
                return False
        except Exception as e:
            print(f"⚠️  Verification inconclusive: {e}")
            print("    Check manually at: https://zodsecurity.com/lebanon-security-index/")
            return False

    def run(self):
        """Execute the configuration"""
        print("╔════════════════════════════════════════════════════════════╗")
        print("║  Bluehost Reverse Proxy Configuration for Lebanon Index   ║")
        print("╚════════════════════════════════════════════════════════════╝\n")

        # Step 1: Authenticate
        if not self.login():
            print("\n❌ Failed to authenticate. Please check your credentials.")
            return False

        # Step 2: Get current .htaccess
        current_htaccess = self.get_htaccess_file()
        if current_htaccess is None:
            print("\n❌ Failed to retrieve .htaccess file.")
            return False

        # Step 3: Generate new config
        proxy_config = self.generate_proxy_config()
        print("✅ Generated reverse proxy configuration")

        # Step 4: Update content
        updated_htaccess = self.update_htaccess(current_htaccess, proxy_config)

        # Step 5: Save updated file
        if not self.save_htaccess_file(updated_htaccess):
            print("\n❌ Failed to save configuration.")
            return False

        # Step 6: Verify
        print()
        self.verify_proxy()

        print("\n" + "="*60)
        print("✨ Configuration complete!")
        print("="*60)
        print("\nNext steps:")
        print("1. Wait 5-10 minutes for changes to propagate")
        print("2. Test: curl -I https://zodsecurity.com/lebanon-security-index/")
        print("3. Update Google Search Console with new URL")
        print("4. Monitor Render logs at: https://dashboard.render.com")

        return True

def main():
    print("\n🚀 Bluehost Reverse Proxy Configuration Tool\n")

    # Get credentials
    domain = input("Enter your domain (e.g., zodsecurity.com): ").strip()
    if not domain:
        print("❌ Domain is required")
        return False

    username = input("Enter your cPanel username: ").strip()
    if not username:
        print("❌ Username is required")
        return False

    password = getpass("Enter your cPanel password (will not be shown): ")
    if not password:
        print("❌ Password is required")
        return False

    print()

    # Create configurator and run
    configurator = BluehostProxyConfigurator(domain, username, password)
    return configurator.run()

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Configuration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
