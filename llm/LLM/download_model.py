from huggingface_hub import hf_hub_download
import os

# Create directories so the files don't overwrite each other
os.makedirs("models", exist_ok=True)

print("Downloading Disease Model...")
hf_hub_download(
    repo_id="peachfawn/yolov8-plant-disease", 
    filename="best.pt",
    local_dir="models",
    local_dir_use_symlinks=False
)
# Rename to keep it clear
os.rename("models/best.pt", "models/disease_model.pt")

print("Downloading Insect/Pest Model...")
hf_hub_download(
    repo_id="Mustafa5645344/insect-detection-yolov8", 
    filename="best.pt",
    local_dir="models",
    local_dir_use_symlinks=False
)
os.rename("models/best.pt", "models/insect_model.pt")

print("Both models downloaded successfully to the 'models' folder!")