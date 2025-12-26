import os

# WARNING: This rewrites Git history.
print("☢️  NUKING SECRETS FROM GIT HISTORY...")

# 1. Install BFG Repo-Cleaner (We use a simple python wrapper alias here if java exists, 
#    but purely python implementation of filtering history is complex. 
#    Instead, we will use the native 'git filter-branch' which is built-in.)

commands = [
    # Replace the text 'AIza...' with 'REDACTED' in ALL history
    "git filter-branch --force --tree-filter \"find . -name '*.js' -exec sed -i 's/AIza[0-9A-Za-z\-_]\{35\}/REDACTED_KEY/g' {} +\" -- --all",
    "git filter-branch --force --tree-filter \"find . -name '*.html' -exec sed -i 's/AIza[0-9A-Za-z\-_]\{35\}/REDACTED_KEY/g' {} +\" -- --all",
    
    # Force push the clean history
    # "git push origin --force --all" # Uncomment this to actually push
]

print("⚠️  Run this command in your terminal manually to be safe:")
print(commands[0])
print(commands[1])
print("\nThen run: git push origin --force --all")
