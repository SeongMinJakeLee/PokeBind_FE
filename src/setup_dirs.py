import os

# Create directories
base_path = r"C:\Users\jake3\jake\pokemon-tcg-dex\frontend\src"
os.makedirs(os.path.join(base_path, "pages"), exist_ok=True)
os.makedirs(os.path.join(base_path, "styles"), exist_ok=True)
os.makedirs(os.path.join(base_path, "components"), exist_ok=True)
print("Directories created successfully")
