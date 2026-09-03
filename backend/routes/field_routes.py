from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import db_models
import schemas
from auth import get_current_farmer

router = APIRouter(prefix="/api/fields", tags=["Fields"])

@router.post("", response_model=schemas.FieldResponse)
@router.post("/", response_model=schemas.FieldResponse)
def create_field(
    field_in: schemas.FieldCreate,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    new_field = db_models.Field(
        farmer_id=current_farmer.id,
        field_name=field_in.field_name,
        area=field_in.area,
        area_unit=field_in.area_unit,
        crop=field_in.crop,
        sowing_date=field_in.sowing_date,
        latitude=field_in.latitude,
        longitude=field_in.longitude,
        soil_type=field_in.soil_type,
        irrigation_type=field_in.irrigation_type
    )
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
    return new_field


@router.get("", response_model=List[schemas.FieldResponse])
@router.get("/", response_model=List[schemas.FieldResponse])
def get_farmer_fields(
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    fields = db.query(db_models.Field).filter(db_models.Field.farmer_id == current_farmer.id).all()
    return fields


@router.get("/{field_id}", response_model=schemas.FieldResponse)
def get_field_by_id(
    field_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this field")

    return field


@router.put("/{field_id}", response_model=schemas.FieldResponse)
def update_field(
    field_id: int,
    field_in: schemas.FieldCreate,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this field")

    field.field_name = field_in.field_name
    field.area = field_in.area
    field.area_unit = field_in.area_unit
    field.crop = field_in.crop
    field.sowing_date = field_in.sowing_date
    field.latitude = field_in.latitude
    field.longitude = field_in.longitude
    field.soil_type = field_in.soil_type
    field.irrigation_type = field_in.irrigation_type

    db.commit()
    db.refresh(field)
    return field


@router.delete("/{field_id}")
def delete_field(
    field_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this field")

    db.delete(field)
    db.commit()
    return {"status": "success", "message": "Field deleted successfully"}
