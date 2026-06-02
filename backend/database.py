import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

# Graceful checks for unconfigured templates
is_configured = True
if not url or not key or "your-project-id" in url or "your-service-role" in key:
    is_configured = False
    print("\n" + "!" * 80)
    print("  WARNING: Supabase Credentials are not configured in backend/.env yet!")
    print("  Please open backend/.env and replace the placeholders with your actual Project URL and Key.")
    print("!" * 80 + "\n")

supabase: Client = None

if is_configured:
    try:
        supabase = create_client(url, key)
        print("Supabase database client successfully initialized.")
    except Exception as e:
        print(f"ERROR: Failed to connect to Supabase: {e}")
else:
    print("Supabase client running in unconfigured fallback mode.")
