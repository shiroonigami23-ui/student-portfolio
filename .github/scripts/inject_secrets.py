import os
import glob

# 1. Identify all secrets you stored (Starts with FIREBASE, AWS, or AUTO)
# We read them from the Environment Variables available during the action
secrets = {k: v for k, v in os.environ.items() if k.startswith(("FIREBASE_", "AWS_", "AUTO_"))}

print(f"💉 Injector: Found {len(secrets)} secrets to inject.")

# 2. Scan all JavaScript and HTML files
files = glob.glob("**/*.js", recursive=True) + glob.glob("**/*.html", recursive=True)

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False

        # 3. Replace 'process.env.SECRET_NAME' with '"ACTUAL_VALUE"'
        for key, val in secrets.items():
            placeholder = f"process.env.{key}"
            
            # Check if this file uses this secret
            if placeholder in content:
                # We inject the value as a string
                content = content.replace(placeholder, f'"{val}"')
                modified = True
                print(f"   ✅ Injected {key} into {filepath}")

        # 4. Save the file (Only for the build, doesn't affect your repo)
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

    except Exception as e:
        print(f"   ⚠️ Error processing {filepath}: {e}")

print("🚀 Injection Complete. Site is ready for deployment.")
