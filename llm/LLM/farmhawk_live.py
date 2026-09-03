import cv2
import csv
from datetime import datetime
from ultralytics import YOLO

# 1. Initialize the Local Database (CSV Log)
# This creates a fresh file and writes the header row every time the script starts
with open('farmhawk_logs.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["Timestamp", "Type", "Name", "Latitude", "Longitude", "Confidence"])

# 2. Load BOTH YOLOv8 models
print("Loading AI Models into memory (This may take a moment)...")
disease_model = YOLO('models/disease_model.pt')
insect_model = YOLO('models/insect_model.pt')

# 3. Open the iPhone camera (Index 1)
cap = cv2.VideoCapture(1)

# Starting GPS Coordinates (e.g., a field in Rajasthan)
simulated_lat = 26.827000
simulated_long = 75.565000

print("Starting FarmHawk Dual-Scanner... Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Simulate drone movement: slightly increment GPS coords every frame
    # This ensures your map pins won't all stack on top of each other during the demo
    simulated_lat += 0.000002
    simulated_long += 0.000002

    # 4. Run BOTH models on the same frame
    disease_results = disease_model.predict(source=frame, conf=0.4, verbose=False)
    insect_results = insect_model.predict(source=frame, conf=0.4, verbose=False)

    # 5. Process Disease Detections (RED)
    for result in disease_results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            class_id = int(box.cls[0])
            name = disease_model.names[class_id]
            conf = float(box.conf[0])
            
            # Draw Box and Label
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(frame, f"DISEASE: {name} ({conf:.2f})", (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            
            # Log to terminal and CSV
            print(f"[LOG] DISEASE: {name} at [{simulated_lat:.6f}, {simulated_long:.6f}]")
            with open('farmhawk_logs.csv', mode='a', newline='') as file:
                writer = csv.writer(file)
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                writer.writerow([timestamp, "DISEASE", name, simulated_lat, simulated_long, round(conf, 2)])

    # 6. Process Insect Detections (BLUE)
    for result in insect_results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            class_id = int(box.cls[0])
            name = insect_model.names[class_id]
            conf = float(box.conf[0])
            
            # Draw Box and Label
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(frame, f"PEST: {name} ({conf:.2f})", (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
            
            # Log to terminal and CSV
            print(f"[LOG] PEST: {name} at [{simulated_lat:.6f}, {simulated_long:.6f}]")
            with open('farmhawk_logs.csv', mode='a', newline='') as file:
                writer = csv.writer(file)
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                writer.writerow([timestamp, "PEST", name, simulated_lat, simulated_long, round(conf, 2)])

    # 7. Display the unified live feed
    cv2.imshow('FarmHawk - Unified Threat Detection', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()