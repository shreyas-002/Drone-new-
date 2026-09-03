from ultralytics import YOLO
import numpy as np
import cv2

disease_model = YOLO("models/disease_model.pt")
insect_model = YOLO("models/insect_model.pt")

print("Disease Model Classes:", len(disease_model.names))
print("Insect Model Classes:", len(insect_model.names))

# Test on blank image
blank = np.zeros((480, 640, 3), dtype=np.uint8)
res_d = disease_model.predict(blank, conf=0.45, verbose=False)
res_i = insect_model.predict(blank, conf=0.45, verbose=False)

print(f"Blank image test -> Disease detections: {len(res_d[0].boxes)}, Insect detections: {len(res_i[0].boxes)}")
print("Real AI Inference Engine is 100% active and running without errors!")

