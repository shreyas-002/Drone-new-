import os
import sys
import time
import base64
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Generator

import cv2
import numpy as np
import yaml

# Ultralytics config cache
os.environ["YOLO_CONFIG_DIR"] = "/Users/harshitkushwaha/.gemini/antigravity/scratch/crop-disease-pest-detector/.ultralytics"

logger = logging.getLogger("live_feed_service")

# Path constants for the trained model
BASE_DETECTOR_DIR = Path("/Users/harshitkushwaha/.gemini/antigravity/scratch/crop-disease-pest-detector")
MODEL_PATH = BASE_DETECTOR_DIR / "best_model.pt"
DATA_YAML_PATH = BASE_DETECTOR_DIR / "combined_dataset/combined_data.yaml"

# Visual Color Scheme:
# OpenCV BGR Format:
COLOR_INSECT_BGR = (255, 0, 0)   # Blue
COLOR_PEST_BGR   = (0, 0, 255)   # Red
COLOR_TEXT       = (255, 255, 255) # White
COLOR_HUD_BG     = (25, 25, 25)    # Dark Charcoal

# Known insect class names from IP102 / dataset
INSECT_NAMES = {
    "legume blister beetle",
    "lytta polita",
    "rice leaf roller",
    "tarnished plant bug"
}

_yolo_model = None
_model_names = {}
_last_saved_detections = {} # Key: (field_id, class_name) -> timestamp

def get_yolo_model():
    """Lazily load the YOLO model singleton."""
    global _yolo_model, _model_names
    if _yolo_model is None:
        from ultralytics import YOLO
        target_path = MODEL_PATH if MODEL_PATH.exists() else Path("best_model.pt")
        if not target_path.exists():
            target_path = Path("yolov8n.pt")
        logger.info(f"Loading YOLO weights from: {target_path}")
        _yolo_model = YOLO(str(target_path))
        if hasattr(_yolo_model, "names") and _yolo_model.names:
            _model_names = _yolo_model.names
        else:
            # Fallback to YAML names
            if DATA_YAML_PATH.exists():
                with open(DATA_YAML_PATH, "r") as f:
                    yd = yaml.safe_load(f)
                    names = yd.get("names", {})
                    if isinstance(names, list):
                        _model_names = {i: name for i, name in enumerate(names)}
                    elif isinstance(names, dict):
                        _model_names = names
    return _yolo_model


def classify_detection_type(class_name: str, class_id: int) -> str:
    """
    Returns 'INSECT' (Blue) or 'PEST' (Red).
    User requirement:
      - Insect: Blue colour row
      - Pest (crop disease/blight/mites/pest): Red colour row
    """
    clean_name = class_name.lower().strip()
    if clean_name in INSECT_NAMES or class_id in {31, 32, 33, 34}:
        return "INSECT"
    if any(k in clean_name for k in ["beetle", "roller", "bug", "insect", "caterpillar", "moth"]):
        return "INSECT"
    return "PEST"


def draw_styled_box(frame, x1, y1, x2, y2, label_text, color, thickness=2):
    """Draws sleek bounding box with header tab."""
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.55
    font_thickness = 2
    (tw, th), baseline = cv2.getTextSize(label_text, font, font_scale, font_thickness)
    tab_y1 = max(0, y1 - th - baseline - 8)
    tab_y2 = y1
    tab_x1 = x1
    tab_x2 = min(frame.shape[1], x1 + tw + 10)

    cv2.rectangle(frame, (tab_x1, tab_y1), (tab_x2, tab_y2), color, -1)
    cv2.putText(
        frame,
        label_text,
        (tab_x1 + 5, tab_y2 - baseline - 3),
        font,
        font_scale,
        COLOR_TEXT,
        font_thickness,
        cv2.LINE_AA,
    )


def draw_hud(frame, fps, num_insects, num_pests, cam_label):
    """Draws top status dashboard overlay on the frame."""
    h, w, _ = frame.shape
    hud_h = 42
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, hud_h), COLOR_HUD_BG, -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

    font = cv2.FONT_HERSHEY_SIMPLEX
    # Camera indicator
    cv2.rectangle(frame, (10, 8), (145, 34), (16, 140, 60), -1)
    cv2.putText(frame, cam_label, (16, 26), font, 0.45, COLOR_TEXT, 1, cv2.LINE_AA)

    # FPS
    cv2.putText(frame, f"FPS: {fps:.1f}", (155, 26), font, 0.50, (0, 255, 0), 2, cv2.LINE_AA)

    # Insect badge (Blue)
    badge_ins = f"Insects: {num_insects}"
    cv2.rectangle(frame, (250, 8), (380, 34), COLOR_INSECT_BGR, -1)
    cv2.putText(frame, badge_ins, (258, 26), font, 0.48, COLOR_TEXT, 2, cv2.LINE_AA)

    # Pest badge (Red)
    badge_pest = f"Pests: {num_pests}"
    cv2.rectangle(frame, (390, 8), (520, 34), COLOR_PEST_BGR, -1)
    cv2.putText(frame, badge_pest, (398, 26), font, 0.48, COLOR_TEXT, 2, cv2.LINE_AA)


def maybe_save_detection_to_db(field_id: int, det_type: str, class_name: str, confidence: float, db_session_factory):
    """
    Saves detected threat to database.
    Throttled: records at most once every 3 seconds for the same field + class to prevent DB flood.
    """
    if not db_session_factory or not field_id:
        return

    now = time.time()
    key = (field_id, class_name)
    last_time = _last_saved_detections.get(key, 0)
    if (now - last_time) < 3.0:
        return # Skip within throttle window

    _last_saved_detections[key] = now

    try:
        from database import SessionLocal
        import db_models
        with SessionLocal() as db:
            field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
            if not field:
                return

            new_det = db_models.Detection(
                field_id=field_id,
                detection_type=det_type, # 'INSECT' or 'PEST'
                disease_or_pest_name=class_name,
                confidence=round(confidence, 4),
                latitude=field.latitude,
                longitude=field.longitude,
                timestamp=datetime.utcnow()
            )
            db.add(new_det)
            db.commit()
            logger.info(f"Logged detection for field {field_id}: [{det_type}] {class_name} ({confidence*100:.1f}%)")
    except Exception as e:
        logger.error(f"Failed to auto-save detection: {e}")


def generate_live_feed_stream(
    field_id: int,
    camera_idx: int = 0,
    conf_thresh: float = 0.35,
    db_session_factory=None
) -> Generator[bytes, None, None]:
    """
    Streams MJPEG video feed with real-time YOLO bounding boxes.
    Blue box -> Insect
    Red box  -> Pest / Disease
    """
    model = get_yolo_model()
    names = _model_names

    # Try opening requested camera; fallback to 0 if 1 fails
    cap = cv2.VideoCapture(camera_idx)
    if (cap is None or not cap.isOpened()) and camera_idx == 1:
        logger.warning("Camera 1 not accessible, falling back to Mac camera 0")
        camera_idx = 0
        cap = cv2.VideoCapture(0)

    if cap is None or not cap.isOpened():
        logger.error(f"Cannot open webcam on index {camera_idx}")
        # Yield a blank warning frame
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(blank, "Camera Unavailable / Permission Denied", (60, 240),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        _, buffer = cv2.imencode(".jpg", blank)
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")
        return

    cam_label = "iPhone (1)" if camera_idx == 1 else "Mac Cam (0)"
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    prev_time = time.time()
    fps_smooth = 24.0

    try:
        while True:
            success, frame = cap.read()
            if not success:
                time.sleep(0.05)
                continue

            current_time = time.time()
            dt = max(1e-5, current_time - prev_time)
            fps_smooth = 0.85 * fps_smooth + 0.15 * (1.0 / dt)
            prev_time = current_time

            # Run YOLO inference
            results = model.predict(frame, conf=conf_thresh, verbose=False)
            boxes = results[0].boxes if len(results) > 0 else []

            num_insects = 0
            num_pests = 0

            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())
                    acc_pct = int(confidence * 100)
                    coords = box.xyxy[0].cpu().numpy().astype(int)
                    x1, y1, x2, y2 = coords
                    cls_name = names.get(cls_id, f"Class {cls_id}")

                    det_type = classify_detection_type(cls_name, cls_id)

                    if det_type == "INSECT":
                        num_insects += 1
                        label = f"[INSECT] {cls_name} {acc_pct}%"
                        draw_styled_box(frame, x1, y1, x2, y2, label, COLOR_INSECT_BGR)
                    else:
                        num_pests += 1
                        label = f"[PEST] {cls_name} {acc_pct}%"
                        draw_styled_box(frame, x1, y1, x2, y2, label, COLOR_PEST_BGR)

                    # Persist to database (throttled)
                    maybe_save_detection_to_db(field_id, det_type, cls_name, confidence, db_session_factory)

            # Draw HUD
            draw_hud(frame, fps_smooth, num_insects, num_pests, cam_label)

            # Encode frame to JPEG
            ret, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if not ret:
                continue

            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
            # Maintain ~25-30 FPS pacing
            time.sleep(0.01)

    finally:
        cap.release()
        logger.info("Live feed camera released.")


def analyze_image_frame(
    image_bytes: bytes,
    field_id: int,
    conf_thresh: float = 0.35,
    db_session=None
) -> Dict[str, Any]:
    """
    Runs YOLO inference on a single image frame (from snapshot or file upload).
    Saves detections to database and returns annotated frame + telemetry items.
    """
    model = get_yolo_model()
    names = _model_names

    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Invalid image content")

    results = model.predict(frame, conf=conf_thresh, verbose=False)
    boxes = results[0].boxes if len(results) > 0 else []

    detected_items = []

    if boxes is not None and len(boxes) > 0:
        for box in boxes:
            cls_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            acc_pct = int(confidence * 100)
            coords = box.xyxy[0].cpu().numpy().astype(int)
            x1, y1, x2, y2 = coords
            cls_name = names.get(cls_id, f"Class {cls_id}")

            det_type = classify_detection_type(cls_name, cls_id)

            if det_type == "INSECT":
                label = f"[INSECT] {cls_name} {acc_pct}%"
                draw_styled_box(frame, x1, y1, x2, y2, label, COLOR_INSECT_BGR)
            else:
                label = f"[PEST] {cls_name} {acc_pct}%"
                draw_styled_box(frame, x1, y1, x2, y2, label, COLOR_PEST_BGR)

            det_obj = {
                "detection_type": det_type,
                "disease_or_pest_name": cls_name,
                "confidence": round(confidence, 4),
                "accuracy_pct": acc_pct,
                "bbox": [int(x1), int(y1), int(x2), int(y2)],
                "timestamp": datetime.utcnow().isoformat()
            }
            detected_items.append(det_obj)

            # Save to DB if session provided
            if db_session and field_id:
                try:
                    import db_models
                    field = db_session.query(db_models.Field).filter(db_models.Field.id == field_id).first()
                    lat = field.latitude if field else None
                    lng = field.longitude if field else None

                    new_det = db_models.Detection(
                        field_id=field_id,
                        detection_type=det_type,
                        disease_or_pest_name=cls_name,
                        confidence=round(confidence, 4),
                        latitude=lat,
                        longitude=lng,
                        timestamp=datetime.utcnow()
                    )
                    db_session.add(new_det)
                    db_session.commit()
                except Exception as e:
                    logger.error(f"Error saving detection to DB: {e}")

    # Encode annotated frame to base64
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

    return {
        "detections": detected_items,
        "count": len(detected_items),
        "annotated_image": annotated_b64
    }

