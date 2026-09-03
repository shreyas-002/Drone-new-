from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class FarmerRegister(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str

class FarmerLogin(BaseModel):
    email: str
    password: str

class FarmerResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer: FarmerResponse


# --- Field Schemas ---
class FieldCreate(BaseModel):
    field_name: str
    area: float
    area_unit: str = "acres"
    crop: str
    sowing_date: str
    latitude: float
    longitude: float
    soil_type: Optional[str] = "Alluvial"
    irrigation_type: Optional[str] = "Canal / Tube Well"

class FieldResponse(BaseModel):
    id: int
    farmer_id: int
    field_name: str
    area: float
    area_unit: str
    crop: str
    sowing_date: str
    latitude: float
    longitude: float
    soil_type: str
    irrigation_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Detection Schemas ---
class DetectionResponse(BaseModel):
    id: int
    field_id: Optional[int] = None
    detection_type: str
    disease_or_pest_name: str
    confidence: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: datetime

    class Config:
        from_attributes = True

