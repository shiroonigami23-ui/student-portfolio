import os
import re
import requests
from base64 import b64encode
from nacl import encoding, public # Requires: pip install pynacl

# --- CONFIGURATION ---
REPO_OWNER = os.getenv('GITHUB_REPOSITORY_OWNER')
REPO_NAME = os.getenv('GITHUB_REPOSITORY').split('/')[-1]
AUTH_TOKEN = os.getenv('ADMIN_TOKEN') # The Master Key you just saved
HEADERS = {
    "Authorization": f"token {AUTH_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

PATTERNS = [
    # Firebase / Google
    (r'[\"\'](AIza[0-9A-Za-z\-_]{35})[\"\']', "FIREBASE_KEY"),
    # AWS
    (r'[\"\'](AKIA[0-9A-Z]{16})[\"\']', "AWS_KEY"),
    # Generic (Variable assignment)
    (r'(?:key|token|secret|password)\s*[:=]\s*[\"\']([a-zA-Z0-9\-_]{30,})[\"\']', "AUTO_SECRET")
]

def encrypt_secret(public_key, secret_value):
    """Encrypts value using LibSodium (Required by GitHub API)"""
    public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
    sealed_box = public.SealedBox(public_key)
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return b64encode(encrypted).decode("utf-8")

def upload_to_github(secret_name, secret_value):
    """Uploads the secret to Repo Settings automatically"""
    print(f"☁️  Uploading {secret_name} to GitHub Secrets...")
    
    # 1. Get Repo Public Key
    key_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/actions/secrets/public-key"
    r = requests.get(key_url, headers=HEADERS)
    if r.status_code != 200:
        print(f"❌ Failed to get key: {r.text}")
        return False
    
    key_data = r.json()
    key_id = key_data['key_id']
    pk = key_data['key']
    
    # 2. Encrypt
    encrypted_value = encrypt_secret(pk, secret_value)
    
    # 3. Upload
    secret_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/actions/secrets/{secret_name}"
    payload = {
        "encrypted_value": encrypted_value,
        "key_id": key_id
    }
    r = requests.put(secret_url, json=payload, headers=HEADERS)
    
    if r.status_code in [201, 204]:
        print(f"✅ Success! {secret_name} is now live in Settings.")
        return True
    else:
        print(f"❌ Upload failed: {r.text}")
        return False

def process_files():
    files_changed = False
    
    # Walk through files
    for root, dirs, files in os.walk("."):
        if ".git" in dirs: dirs.remove(".git")
        
        for file in files:
            if file in ["lazy_fix.py", "workflow.yml"]: continue
            if not file.endswith(('.js', '.ts', '.py', '.php', '.html', '.json')): continue
            
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            original_content = content
            file_ext = os.path.splitext(file)[1].lower()

            for pattern, var_base in PATTERNS:
                matches = list(re.finditer(pattern, content))
                for i, match in enumerate(matches):
                    full_str = match.group(0)
                    secret_val = match.group(1)
                    
                    # Create Name: FIREBASE_KEY_AUTO_1
                    secret_name = f"{var_base}_AUTO_{i+1}"
                    
                    # UPLOAD FIRST
                    if upload_to_github(secret_name, secret_val):
                        # IF UPLOAD SUCCESS, REPLACE IN CODE
                        if file_ext in ['.js', '.ts']: replace = f"process.env.{secret_name}"
                        elif file_ext == '.py': replace = f"os.getenv('{secret_name}')"
                        elif file_ext == '.php': replace = f"getenv('{secret_name}')"
                        else: replace = '"__SECRET_MOVED_TO_SETTINGS__"'
                        
                        content = content.replace(full_str, replace)
                        files_changed = True
            
            if content != original_content:
                if file_ext == '.py' and 'import os' not in content:
                    content = "import os\n" + content
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
    return files_changed

if __name__ == "__main__":
    if process_files():
        print("DISABLE_GIT_JOB=false")
    else:
        print("DISABLE_GIT_JOB=true")
