import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import db_models
import schemas

router = APIRouter(prefix="/api/survey", tags=["Survey"])


def encode_multi_select(val: Optional[Union[List[str], str]]) -> Optional[str]:
    """Safely encodes multi-select options into a JSON string for database storage."""
    if val is None:
        return None
    if isinstance(val, list):
        # Filter empty strings
        clean_list = [str(x).strip() for x in val if str(x).strip()]
        return json.dumps(clean_list, ensure_ascii=False)
    if isinstance(val, str):
        val_str = val.strip()
        if not val_str:
            return None
        if val_str.startswith("[") and val_str.endswith("]"):
            try:
                parsed = json.loads(val_str)
                if isinstance(parsed, list):
                    clean_list = [str(x).strip() for x in parsed if str(x).strip()]
                    return json.dumps(clean_list, ensure_ascii=False)
            except Exception:
                pass
        # Fallback for comma-separated values
        items = [x.strip() for x in val_str.split(",") if x.strip()]
        return json.dumps(items, ensure_ascii=False)
    return None


def decode_multi_select(db_val: Optional[str]) -> List[str]:
    """Safely decodes JSON string or text multi-select values into a list of strings."""
    if not db_val:
        return []
    try:
        parsed = json.loads(db_val)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
        if isinstance(parsed, str):
            return [parsed.strip()] if parsed.strip() else []
    except Exception:
        pass
    # Fallback to comma separation if not JSON
    return [x.strip() for x in db_val.split(",") if x.strip()]


def counter_to_chart_array(counter: Counter) -> List[Dict[str, Any]]:
    """Converts a Counter object to Recharts-friendly [{'name': key, 'value': count}] format."""
    return [{"name": str(key), "value": count} for key, count in counter.items()]


@router.post("/response")
def submit_survey_response(
    payload: schemas.SurveyResponseCreate,
    db: Session = Depends(get_db)
):
    """
    POST /api/survey/response
    Receives one survey response from Microsoft Forms / Power Automate.
    Validates data, prevents duplicates if response_id is supplied, and stores row in SQLite database.
    """
    # Prevent duplicate submissions if response_id is supplied
    if payload.response_id and payload.response_id.strip():
        resp_id_clean = payload.response_id.strip()
        existing = db.query(db_models.SurveyResponse).filter(
            db_models.SurveyResponse.response_id == resp_id_clean
        ).first()
        if existing:
            return {
                "success": False,
                "message": f"Survey response with response_id '{resp_id_clean}' already exists."
            }

    # Process multi-select fields into JSON strings
    crops_encoded = encode_multi_select(payload.crops)
    challenges_encoded = encode_multi_select(payload.operational_challenges)
    pesticide_encoded = encode_multi_select(payload.pesticide_problems)
    features_encoded = encode_multi_select(payload.valuable_features)
    concerns_encoded = encode_multi_select(payload.adoption_concerns)

    # Process rating to integer safely
    rating_int = None
    if payload.early_warning_rating is not None:
        try:
            rating_int = int(payload.early_warning_rating)
        except (ValueError, TypeError):
            rating_int = None

    insp_diff_str = str(payload.inspection_difficulty).strip() if payload.inspection_difficulty is not None else None
    drone_val_str = str(payload.drone_spraying_value).strip() if payload.drone_spraying_value is not None else None

    submitted_dt = payload.submitted_at if payload.submitted_at else datetime.utcnow()

    new_response = db_models.SurveyResponse(
        response_id=payload.response_id.strip() if payload.response_id else None,
        submitted_at=submitted_dt,
        crops=crops_encoded,
        farmland_size=payload.farmland_size.strip() if payload.farmland_size else None,
        irrigation=payload.irrigation.strip() if payload.irrigation else None,
        operational_challenges=challenges_encoded,
        inspection_difficulty=insp_diff_str,
        late_discovery_frequency=payload.late_discovery_frequency.strip() if payload.late_discovery_frequency else None,
        advice_source=payload.advice_source.strip() if payload.advice_source else None,
        early_warning_rating=rating_int,
        pesticide_problems=pesticide_encoded,
        drone_spraying_value=drone_val_str,
        valuable_features=features_encoded,
        krishi_samvad_usefulness=payload.krishi_samvad_usefulness.strip() if payload.krishi_samvad_usefulness else None,
        preferred_alert_method=payload.preferred_alert_method.strip() if payload.preferred_alert_method else None,
        adoption_concerns=concerns_encoded,
        biggest_problem=payload.biggest_problem.strip() if payload.biggest_problem else None,
    )


    db.add(new_response)
    db.commit()
    db.refresh(new_response)

    return {
        "success": True,
        "message": "Survey response saved successfully"
    }


@router.get("/stats")
def get_survey_stats(db: Session = Depends(get_db)):
    """
    GET /api/survey/stats
    Reads survey_responses table and calculates aggregated statistics for the frontend Survey Results page.
    Returns Recharts-friendly array structures and handles empty database gracefully.
    """
    responses = db.query(db_models.SurveyResponse).all()
    total_responses = len(responses)

    if total_responses == 0:
        return {
            "total_responses": 0,
            "crop_distribution": [],
            "late_discovery_frequency": [],
            "early_warning_ratings": [],
            "drone_spraying_value": [],
            "valuable_features": [],
            "krishi_samvad_usefulness": [],
            "preferred_alert_method": [],
            "adoption_concerns": [],
            "farmer_responses": [],
            "average_early_warning_rating": 0
        }

    # Initialize counters for categorical & multi-select questions
    crop_counter = Counter()
    late_discovery_counter = Counter()
    rating_counter = Counter()
    drone_value_counter = Counter()
    features_counter = Counter()
    krishi_usefulness_counter = Counter()
    alert_method_counter = Counter()
    concerns_counter = Counter()

    ratings_list: List[int] = []
    farmer_responses: List[Dict[str, str]] = []

    for r in responses:
        # Q1: Crops (Multi-select)
        for crop in decode_multi_select(r.crops):
            crop_counter[crop] += 1

        # Q6: Late discovery frequency (Single-select)
        if r.late_discovery_frequency:
            late_discovery_counter[r.late_discovery_frequency] += 1

        # Q8: Early warning rating (Single-select int/rating)
        if r.early_warning_rating is not None:
            ratings_list.append(r.early_warning_rating)
            rating_counter[str(r.early_warning_rating)] += 1

        # Q10: Drone spraying value (Single-select)
        if r.drone_spraying_value:
            drone_value_counter[r.drone_spraying_value] += 1

        # Q11: Valuable features (Multi-select)
        for feature in decode_multi_select(r.valuable_features):
            features_counter[feature] += 1

        # Q12: Krishi Samvad usefulness (Single-select)
        if r.krishi_samvad_usefulness:
            krishi_usefulness_counter[r.krishi_samvad_usefulness] += 1

        # Q13: Preferred alert method (Single-select)
        if r.preferred_alert_method:
            alert_method_counter[r.preferred_alert_method] += 1

        # Q14: Adoption concerns (Multi-select)
        for concern in decode_multi_select(r.adoption_concerns):
            concerns_counter[concern] += 1

        # Q15: Biggest problem / Farmers' voice
        if r.biggest_problem and r.biggest_problem.strip():
            farmer_responses.append({"response": r.biggest_problem.strip()})

    # Calculate average early warning rating safely
    avg_rating = round(sum(ratings_list) / len(ratings_list), 2) if ratings_list else 0

    return {
        "total_responses": total_responses,
        "crop_distribution": counter_to_chart_array(crop_counter),
        "late_discovery_frequency": counter_to_chart_array(late_discovery_counter),
        "early_warning_ratings": counter_to_chart_array(rating_counter),
        "drone_spraying_value": counter_to_chart_array(drone_value_counter),
        "valuable_features": counter_to_chart_array(features_counter),
        "krishi_samvad_usefulness": counter_to_chart_array(krishi_usefulness_counter),
        "preferred_alert_method": counter_to_chart_array(alert_method_counter),
        "adoption_concerns": counter_to_chart_array(concerns_counter),
        "farmer_responses": farmer_responses,
        "average_early_warning_rating": avg_rating
    }
