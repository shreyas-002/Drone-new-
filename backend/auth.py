import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import db_models

SECRET_KEY = "farmhawk-precision-agri-key-super-secret-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_farmer(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> db_models.Farmer:
    if not token:
        # Fallback to default demo farmer if no token passed
        farmer = db.query(db_models.Farmer).filter(db_models.Farmer.email == "farmer1@farmhawk.com").first()
        if not farmer:
            farmer = db_models.Farmer(
                name="Anant",
                email="farmer1@farmhawk.com",
                phone="+91 98765 43210",
                password_hash=hash_password("password123")
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)
        return farmer

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid auth token")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    farmer = db.query(db_models.Farmer).filter(db_models.Farmer.email == email).first()
    if farmer is None:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer

