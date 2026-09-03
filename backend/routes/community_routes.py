import os
import uuid
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from pydantic import BaseModel

from database import get_db
import db_models
from auth import get_current_farmer

router = APIRouter(prefix="/api/community", tags=["Krishi Samvad Community"])

# Media uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "community")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ====================================================================
# SEEDING HELPER (Categories & Authentic Real Agriculture News)
# ====================================================================

DEFAULT_CATEGORIES = [
    {"slug": "disease", "name_en": "Disease", "name_hi": "रोग", "icon": "AlertTriangle", "description_en": "Plant diseases, fungal, bacterial & viral blights", "description_hi": "पौधों के रोग, कवक, जीवाणु और वायरस जनित समस्याएं", "display_order": 1},
    {"slug": "pest", "name_en": "Pest & Insects", "name_hi": "कीट प्रबंधन", "icon": "Bug", "description_en": "Harmful pests, caterpillars, aphids, stem borers", "description_hi": "हानिकारक कीट, इल्लियां, माहू, तना छेदक", "display_order": 2},
    {"slug": "irrigation", "name_en": "Irrigation & Water", "name_hi": "सिंचाई एवं जल", "icon": "Droplets", "description_en": "Drip, sprinkler, canal and borewell management", "description_hi": "ड्रिप, फव्वारा, नहर और नलकूप प्रबंधन", "display_order": 3},
    {"slug": "soil", "name_en": "Soil Health", "name_hi": "मिट्टी स्वास्थ्य", "icon": "Layers", "description_en": "Soil testing, organic matter and pH balance", "description_hi": "मृदा परीक्षण, जैविक कार्बन और पीएच संतुलन", "display_order": 4},
    {"slug": "fertilizer", "name_en": "Fertilizers & Nutrients", "name_hi": "उर्वरक एवं पोषण", "icon": "Sparkles", "description_en": "NPK balance, micronutrients, bio-fertilizers", "description_hi": "एनपीके संतुलन, सूक्ष्म पोषक तत्व, जैविक खाद", "display_order": 5},
    {"slug": "seeds", "name_en": "Seeds & Varieties", "name_hi": "बीज एवं किस्में", "icon": "Sprout", "description_en": "High-yield seeds, seed treatment and germination", "description_hi": "उन्नत बीज किस्में, बीज उपचार एवं अंकुरण", "display_order": 6},
    {"slug": "weather", "name_en": "Weather & Climate", "name_hi": "मौसम एवं जलवायु", "icon": "CloudRain", "description_en": "Monsoon forecasts, heatwaves, frost & rain warnings", "description_hi": "मानसून पूर्वानुमान, पाला, लू और बारिश चेतावनी", "display_order": 7},
    {"slug": "crop_management", "name_en": "Crop Management", "name_hi": "फसल प्रबंधन", "icon": "ClipboardList", "description_en": "Weed control, pruning, crop rotation techniques", "description_hi": "खरपतवार नियंत्रण, छंटाई, फसल चक्र तकनीक", "display_order": 8},
    {"slug": "harvest", "name_en": "Harvesting & Storage", "name_hi": "कटाई एवं भंडारण", "icon": "Archive", "description_en": "Post-harvest techniques, moisture control and silo storage", "description_hi": "कटाई उपरांत प्रबंधन, नमी नियंत्रण और गोदाम भंडारण", "display_order": 9},
    {"slug": "machinery", "name_en": "Farm Machinery", "name_hi": "कृषि मशीनरी", "icon": "Tractor", "description_en": "Tractors, rotavators, sprayers and drone technology", "description_hi": "ट्रैक्टर, रोटावेटर, स्प्रेयर और ड्रोन तकनीक", "display_order": 10},
    {"slug": "mandi_market", "name_en": "Mandi & Prices", "name_hi": "मंडी एवं भाव", "icon": "TrendingUp", "description_en": "APMC mandi rates, price forecasts, procurement", "description_hi": "मंडी भाव, उपज मूल्य और सरकारी खरीद", "display_order": 11},
    {"slug": "gov_schemes", "name_en": "Government Schemes", "name_hi": "सरकारी योजनाएं", "icon": "Landmark", "description_en": "PM-KISAN, PMFBY, KCC, Subsidies & Grants", "description_hi": "पीएम-किसान, फसल बीमा, किसान क्रेडिट कार्ड, सब्सिडी", "display_order": 12},
    {"slug": "general", "name_en": "General Farming", "name_hi": "सामान्य खेती", "icon": "MessageCircle", "description_en": "Open farmer discussions, ideas and experiences", "description_hi": "किसानों की खुली चर्चा, अनुभव और विचार", "display_order": 13},
]

AUTHENTIC_NEWS_SEEDS = [
    {
        "title_en": "ICAR Releases Advisory for Rabi Wheat Rust Prevention Across North India",
        "title_hi": "भाकृअनुप (ICAR) ने उत्तर भारत में रबी गेहूं रतुआ रोग रोकथाम के लिए सलाह जारी की",
        "summary_en": "Indian Council of Agricultural Research (ICAR) recommends farmers to inspect wheat crops for yellow rust symptoms and ensure field drainage during cloudy weather conditions.",
        "summary_hi": "भारतीय कृषि अनुसंधान परिषद (ICAR) ने किसानों को पीले रतुआ के लक्षणों की निगरानी करने और बादलों के मौसम में खेतों में जल निकासी सुनिश्चित करने की सलाह दी है।",
        "source_name": "ICAR — Indian Council of Agricultural Research",
        "source_url": "https://icar.org.in",
        "news_type": "national",
        "state": "All India",
        "tags": "Wheat, Rust, Advisory, Rabi",
        "is_verified": True
    },
    {
        "title_en": "Punjab Agriculture Department Issues Canal Water Roster for Cotton & Rice Belts",
        "title_hi": "पंजाब कृषि विभाग ने कपास और धान क्षेत्रों के लिए नहरी पानी का रोस्टर जारी किया",
        "summary_en": "Punjab Irrigation and Agriculture Departments have finalized equitable rotational canal water distribution for Malwa and Majha agrarian zones.",
        "summary_hi": "पंजाब सिंचाई एवं कृषि विभाग ने मालवा और माझा कृषि क्षेत्रों के लिए समान रूप से नहरी पानी के वितरण का रोटेशनल रोस्टर जारी किया है।",
        "source_name": "Punjab Dept of Agriculture & Farmers Welfare",
        "source_url": "https://agri.punjab.gov.in",
        "news_type": "regional",
        "state": "Punjab",
        "tags": "Punjab, Irrigation, Water, Rice, Cotton",
        "is_verified": True
    },
    {
        "title_en": "Rajasthan Mandis Announce MSP Procurement Schedule for Mustard and Gram",
        "title_hi": "राजस्थान की मंडियों में सरसों और चने की न्यूनतम समर्थन मूल्य (MSP) खरीद का समय घोषित",
        "summary_en": "Rajfed will commence online farmer registrations for minimum support price (MSP) procurement across 400+ primary procurement centres.",
        "summary_hi": "राजफेड (Rajfed) राज्य भर के 400 से अधिक केंद्रों पर सरसों और चने की समर्थन मूल्य खरीद हेतु ऑनलाइन किसान पंजीकरण शुरू करेगा।",
        "source_name": "Rajasthan State Agriculture Marketing Board",
        "source_url": "https://agriculture.rajasthan.gov.in",
        "news_type": "regional",
        "state": "Rajasthan",
        "tags": "Rajasthan, Mandi, MSP, Mustard, Gram",
        "is_verified": True
    },
    {
        "title_en": "Ministry of Agriculture Expands Digital Agri-Stack for Direct Scheme Subsidies",
        "title_hi": "कृषि मंत्रालय ने प्रत्यक्ष योजना सब्सिडी के लिए डिजिटल एग्री-स्टैक का विस्तार किया",
        "summary_en": "The central government has integrated crop registries and soil health records to enable paperless Kisan Credit Card (KCC) limit approvals and input subsidies.",
        "summary_hi": "केंद्र सरकार ने फसल पंजीयन और मृदा स्वास्थ्य कार्डों को जोड़कर पेपरलेस किसान क्रेडिट कार्ड (KCC) और इनपुट सब्सिडी को सुगम बनाया है।",
        "source_name": "Ministry of Agriculture & Farmers Welfare (Govt. of India)",
        "source_url": "https://agricoop.nic.in",
        "news_type": "national",
        "state": "All India",
        "tags": "Govt Scheme, KCC, Digital Agri, Subsidies",
        "is_verified": True
    }
]

def seed_community_defaults(db: Session):
    """Seed categories and verified news articles if table is empty."""
    # 1. Categories
    cat_count = db.query(db_models.CommunityCategory).count()
    if cat_count == 0:
        for c in DEFAULT_CATEGORIES:
            db.add(db_models.CommunityCategory(**c))
        db.commit()

    # 2. News
    news_count = db.query(db_models.AgricultureNews).count()
    if news_count == 0:
        for n in AUTHENTIC_NEWS_SEEDS:
            db.add(db_models.AgricultureNews(**n))
        db.commit()


# ====================================================================
# PYDANTIC SCHEMAS
# ====================================================================

class CreatePostRequest(BaseModel):
    title: str
    description: str
    category_id: int
    crop: Optional[str] = None
    tags: Optional[str] = None
    region: Optional[str] = "Punjab, India"
    post_type: Optional[str] = "question" # "question", "discussion", "experience", "solution"
    media_urls: Optional[List[str]] = []
    field_id: Optional[int] = None # Internal field reference (coords never exposed)

class CreateCommentRequest(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None

class VoteRequest(BaseModel):
    vote_type: int # +1 for upvote, -1 for downvote, 0 to remove vote

class ReportRequest(BaseModel):
    target_type: str # "post", "comment", "farmer"
    target_id: int
    reason: str
    details: Optional[str] = None


# ====================================================================
# API ENDPOINTS
# ====================================================================

# --- Categories & Crops List ---
@router.get("/categories")
def get_community_categories(db: Session = Depends(get_db)):
    seed_community_defaults(db)
    cats = db.query(db_models.CommunityCategory).order_by(db_models.CommunityCategory.display_order.asc()).all()
    return {
        "categories": [
            {
                "id": c.id,
                "slug": c.slug,
                "name_en": c.name_en,
                "name_hi": c.name_hi,
                "icon": c.icon,
                "description_en": c.description_en,
                "description_hi": c.description_hi,
                "posts_count": len(c.posts)
            }
            for c in cats
        ]
    }


@router.get("/crops")
def get_popular_community_crops():
    return {
        "crops": [
            {"name_en": "Wheat", "name_hi": "गेहूं"},
            {"name_en": "Rice / Paddy", "name_hi": "धान / चावल"},
            {"name_en": "Cotton", "name_hi": "कपास"},
            {"name_en": "Mustard", "name_hi": "सरसों"},
            {"name_en": "Tomato", "name_hi": "टमाटर"},
            {"name_en": "Potato", "name_hi": "आलू"},
            {"name_en": "Maize", "name_hi": "मक्का"},
            {"name_en": "Sugarcane", "name_hi": "गन्ना"},
            {"name_en": "Gram / Chana", "name_hi": "चना"},
            {"name_en": "Soybean", "name_hi": "सोयाबीन"},
            {"name_en": "Onion", "name_hi": "प्याज"},
            {"name_en": "Chilli", "name_hi": "मिर्च"},
        ]
    }


# --- Media File Upload ---
@router.post("/upload")
async def upload_community_media(
    file: UploadFile = File(...),
    current_farmer: db_models.Farmer = Depends(get_current_farmer)
):
    """Safely upload crop images for community posts (max 10MB, jpg/png/webp)."""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WebP images are supported")

    # Generate secure UUID filename
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        ext = "jpg"
    
    unique_name = f"crop_{uuid.uuid4().hex[:12]}.{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_name)

    # Save to disk
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    media_url = f"/uploads/community/{unique_name}"
    return {
        "status": "success",
        "url": media_url,
        "media_type": "image",
        "filename": unique_name
    }


# --- Posts Feed & Details ---
@router.get("/posts")
def get_community_posts(
    tab: str = Query("latest", pattern="^(latest|popular|unanswered|solved|following|saved)$"),
    crop: Optional[str] = None,
    category_id: Optional[int] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    seed_community_defaults(db)
    query = db.query(db_models.CommunityPost).filter(db_models.CommunityPost.status == "active")

    # Filter by crop
    if crop and crop.strip():
        query = query.filter(db_models.CommunityPost.crop.ilike(f"%{crop.strip()}%"))

    # Filter by category
    if category_id:
        query = query.filter(db_models.CommunityPost.category_id == category_id)

    # Filter by region
    if region and region.strip():
        query = query.filter(db_models.CommunityPost.region.ilike(f"%{region.strip()}%"))

    # Search query across title, description, crop, tags
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                db_models.CommunityPost.title.ilike(term),
                db_models.CommunityPost.description.ilike(term),
                db_models.CommunityPost.crop.ilike(term),
                db_models.CommunityPost.tags.ilike(term),
                db_models.CommunityPost.region.ilike(term),
            )
        )

    # Tab Filters
    if tab == "unanswered":
        query = query.filter(db_models.CommunityPost.comments_count == 0)
    elif tab == "solved":
        query = query.filter(db_models.CommunityPost.has_solution == True)
    elif tab == "following":
        # Posts from farmers followed by current user
        following_ids = [f.following_id for f in current_farmer.following]
        query = query.filter(db_models.CommunityPost.farmer_id.in_(following_ids))
    elif tab == "saved":
        # Posts bookmarked by current user
        bookmarked_post_ids = [b.post_id for b in current_farmer.community_bookmarks]
        query = query.filter(db_models.CommunityPost.id.in_(bookmarked_post_ids))

    # Ordering
    if tab == "popular":
        query = query.order_by((db_models.CommunityPost.upvotes_count - db_models.CommunityPost.downvotes_count).desc(), db_models.CommunityPost.created_at.desc())
    else:
        query = query.order_by(db_models.CommunityPost.created_at.desc())

    total_count = query.count()
    posts = query.offset(offset).limit(limit).all()

    # Pre-fetch user's votes and bookmarks for quick lookup
    user_votes = {v.post_id: v.vote_type for v in current_farmer.community_votes if v.target_type == "post"}
    user_bookmarks = {b.post_id for b in current_farmer.community_bookmarks}
    following_ids = {f.following_id for f in current_farmer.following}

    results = []
    for p in posts:
        author = p.author
        results.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "crop": p.crop,
            "tags": [t.strip() for t in (p.tags or "").split(",") if t.strip()],
            "region": p.region or "India", # Privacy-safe state/district
            "post_type": p.post_type,
            "upvotes_count": p.upvotes_count,
            "downvotes_count": p.downvotes_count,
            "score": p.upvotes_count - p.downvotes_count,
            "comments_count": p.comments_count,
            "has_solution": p.has_solution,
            "solution_comment_id": p.solution_comment_id,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "author": {
                "id": author.id,
                "name": author.name,
                "region": author.location_region or "India",
                "is_verified_expert": bool(author.is_verified_expert),
                "expert_title": author.expert_title,
                "role": author.role or "farmer",
                "reputation": author.reputation or 10,
                "is_following": author.id in following_ids,
                "is_me": author.id == current_farmer.id
            },
            "category": {
                "id": p.category.id,
                "slug": p.category.slug,
                "name_en": p.category.name_en,
                "name_hi": p.category.name_hi,
                "icon": p.category.icon
            } if p.category else None,
            "media": [
                {"id": m.id, "media_type": m.media_type, "media_url": m.media_url}
                for m in p.media
            ],
            "user_vote": user_votes.get(p.id, 0),
            "is_bookmarked": p.id in user_bookmarks
        })

    return {
        "status": "success",
        "total": total_count,
        "offset": offset,
        "limit": limit,
        "posts": results
    }


@router.post("/posts")
def create_community_post(
    req: CreatePostRequest,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    if not req.title or not req.description:
        raise HTTPException(status_code=400, detail="Title and description are required")

    category = db.query(db_models.CommunityCategory).filter(db_models.CommunityCategory.id == req.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Selected category does not exist")

    # Region: user's regional profile fallback
    region_str = req.region or current_farmer.location_region or "Punjab, India"

    new_post = db_models.CommunityPost(
        farmer_id=current_farmer.id,
        field_id=req.field_id, # Optional internal linking
        category_id=req.category_id,
        title=req.title.strip(),
        description=req.description.strip(),
        crop=req.crop.strip() if req.crop else None,
        tags=req.tags.strip() if req.tags else None,
        region=region_str,
        post_type=req.post_type or "question",
        created_at=datetime.utcnow()
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Attach Media
    if req.media_urls:
        for url in req.media_urls:
            if url and url.strip():
                media_item = db_models.CommunityPostMedia(
                    post_id=new_post.id,
                    media_type="image",
                    media_url=url.strip(),
                    created_at=datetime.utcnow()
                )
                db.add(media_item)
        db.commit()

    # Increase author reputation slightly for sharing community knowledge
    current_farmer.reputation = (current_farmer.reputation or 10) + 2
    db.commit()

    return {
        "status": "success",
        "message": "Post published to Krishi Samvad successfully",
        "post_id": new_post.id
    }


@router.get("/posts/{post_id}")
def get_single_post(
    post_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    post = db.query(db_models.CommunityPost).filter(db_models.CommunityPost.id == post_id, db_models.CommunityPost.status == "active").first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user_vote = db.query(db_models.CommunityVote).filter(
        db_models.CommunityVote.farmer_id == current_farmer.id,
        db_models.CommunityVote.target_type == "post",
        db_models.CommunityVote.post_id == post_id
    ).first()

    is_bookmarked = db.query(db_models.CommunityBookmark).filter(
        db_models.CommunityBookmark.farmer_id == current_farmer.id,
        db_models.CommunityBookmark.post_id == post_id
    ).first() is not None

    author = post.author
    return {
        "post": {
            "id": post.id,
            "title": post.title,
            "description": post.description,
            "crop": post.crop,
            "tags": [t.strip() for t in (post.tags or "").split(",") if t.strip()],
            "region": post.region,
            "post_type": post.post_type,
            "upvotes_count": post.upvotes_count,
            "downvotes_count": post.downvotes_count,
            "score": post.upvotes_count - post.downvotes_count,
            "comments_count": post.comments_count,
            "has_solution": post.has_solution,
            "solution_comment_id": post.solution_comment_id,
            "created_at": post.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "author": {
                "id": author.id,
                "name": author.name,
                "region": author.location_region or "India",
                "is_verified_expert": bool(author.is_verified_expert),
                "expert_title": author.expert_title,
                "role": author.role or "farmer",
                "reputation": author.reputation or 10,
                "is_me": author.id == current_farmer.id
            },
            "category": {
                "id": post.category.id,
                "slug": post.category.slug,
                "name_en": post.category.name_en,
                "name_hi": post.category.name_hi,
                "icon": post.category.icon
            } if post.category else None,
            "media": [
                {"id": m.id, "media_type": m.media_type, "media_url": m.media_url}
                for m in post.media
            ],
            "user_vote": user_vote.vote_type if user_vote else 0,
            "is_bookmarked": is_bookmarked
        }
    }


@router.delete("/posts/{post_id}")
def delete_community_post(
    post_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    post = db.query(db_models.CommunityPost).filter(db_models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Author or admin/moderator check
    if post.farmer_id != current_farmer.id and current_farmer.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    post.status = "deleted"
    db.commit()
    return {"status": "success", "message": "Post deleted"}


# --- Voting & Bookmarking ---
@router.post("/posts/{post_id}/vote")
def vote_community_post(
    post_id: int,
    req: VoteRequest,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    post = db.query(db_models.CommunityPost).filter(db_models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_vote = db.query(db_models.CommunityVote).filter(
        db_models.CommunityVote.farmer_id == current_farmer.id,
        db_models.CommunityVote.target_type == "post",
        db_models.CommunityVote.post_id == post_id
    ).first()

    old_vote_type = existing_vote.vote_type if existing_vote else 0
    new_vote_type = req.vote_type if req.vote_type in [-1, 1] else 0

    # If clicked same vote again, toggle off to 0
    if existing_vote and existing_vote.vote_type == req.vote_type:
        new_vote_type = 0

    if new_vote_type == 0:
        if existing_vote:
            if existing_vote.vote_type == 1:
                post.upvotes_count = max(0, post.upvotes_count - 1)
            elif existing_vote.vote_type == -1:
                post.downvotes_count = max(0, post.downvotes_count - 1)
            db.delete(existing_vote)
    else:
        if existing_vote:
            # Change vote
            if existing_vote.vote_type == 1 and new_vote_type == -1:
                post.upvotes_count = max(0, post.upvotes_count - 1)
                post.downvotes_count = post.downvotes_count + 1
            elif existing_vote.vote_type == -1 and new_vote_type == 1:
                post.downvotes_count = max(0, post.downvotes_count - 1)
                post.upvotes_count = post.upvotes_count + 1
            existing_vote.vote_type = new_vote_type
        else:
            # New vote
            if new_vote_type == 1:
                post.upvotes_count = post.upvotes_count + 1
            else:
                post.downvotes_count = post.downvotes_count + 1
            
            db_vote = db_models.CommunityVote(
                farmer_id=current_farmer.id,
                target_type="post",
                post_id=post_id,
                vote_type=new_vote_type
            )
            db.add(db_vote)

    # Adjust author reputation
    author = post.author
    if author and author.id != current_farmer.id:
        delta = (new_vote_type - old_vote_type) * 2
        author.reputation = max(0, (author.reputation or 10) + delta)

    db.commit()
    return {
        "status": "success",
        "upvotes_count": post.upvotes_count,
        "downvotes_count": post.downvotes_count,
        "score": post.upvotes_count - post.downvotes_count,
        "user_vote": new_vote_type
    }


@router.post("/posts/{post_id}/bookmark")
def toggle_bookmark_post(
    post_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    post = db.query(db_models.CommunityPost).filter(db_models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    bookmark = db.query(db_models.CommunityBookmark).filter(
        db_models.CommunityBookmark.farmer_id == current_farmer.id,
        db_models.CommunityBookmark.post_id == post_id
    ).first()

    if bookmark:
        db.delete(bookmark)
        db.commit()
        return {"status": "success", "is_bookmarked": False, "message": "Removed from saved posts"}
    else:
        new_bm = db_models.CommunityBookmark(farmer_id=current_farmer.id, post_id=post_id)
        db.add(new_bm)
        db.commit()
        return {"status": "success", "is_bookmarked": True, "message": "Post saved to your bookmarks"}


# --- Threaded Comments & Solution Found ---
@router.get("/posts/{post_id}/comments")
def get_post_comments(
    post_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    comments = (
        db.query(db_models.CommunityComment)
        .filter(db_models.CommunityComment.post_id == post_id, db_models.CommunityComment.status == "active")
        .order_by(db_models.CommunityComment.is_solution.desc(), db_models.CommunityComment.created_at.asc())
        .all()
    )

    user_comment_votes = {
        v.comment_id: v.vote_type
        for v in current_farmer.community_votes
        if v.target_type == "comment" and v.comment_id is not None
    }

    # Format into hierarchical thread tree
    comment_map = {}
    root_comments = []

    for c in comments:
        author = c.author
        item = {
            "id": c.id,
            "post_id": c.post_id,
            "parent_comment_id": c.parent_comment_id,
            "content": c.content,
            "is_solution": c.is_solution,
            "upvotes_count": c.upvotes_count,
            "downvotes_count": c.downvotes_count,
            "score": c.upvotes_count - c.downvotes_count,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "author": {
                "id": author.id,
                "name": author.name,
                "region": author.location_region or "India",
                "is_verified_expert": bool(author.is_verified_expert),
                "expert_title": author.expert_title,
                "role": author.role or "farmer",
                "reputation": author.reputation or 10,
                "is_me": author.id == current_farmer.id
            },
            "user_vote": user_comment_votes.get(c.id, 0),
            "replies": []
        }
        comment_map[c.id] = item

    for c in comments:
        if c.parent_comment_id and c.parent_comment_id in comment_map:
            comment_map[c.parent_comment_id]["replies"].append(comment_map[c.id])
        else:
            root_comments.append(comment_map[c.id])

    return {"status": "success", "comments": root_comments, "total": len(comments)}


@router.post("/posts/{post_id}/comments")
def add_post_comment(
    post_id: int,
    req: CreateCommentRequest,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    post = db.query(db_models.CommunityPost).filter(db_models.CommunityPost.id == post_id, db_models.CommunityPost.status == "active").first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if not req.content or not req.content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")

    new_comment = db_models.CommunityComment(
        post_id=post_id,
        farmer_id=current_farmer.id,
        parent_comment_id=req.parent_comment_id,
        content=req.content.strip(),
        created_at=datetime.utcnow()
    )
    db.add(new_comment)
    post.comments_count = post.comments_count + 1
    
    # Increase farmer reputation for answering
    current_farmer.reputation = (current_farmer.reputation or 10) + 1
    db.commit()
    db.refresh(new_comment)

    return {
        "status": "success",
        "message": "Comment posted successfully",
        "comment_id": new_comment.id
    }


@router.post("/posts/{post_id}/solution/{comment_id}")
def mark_solution_found(
    post_id: int,
    comment_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Mark an answer as accepted 'समाधान मिला (Solution Found)'. Only post author can mark."""
    post = db.query(db_models.CommunityPost).filter(db_models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.farmer_id != current_farmer.id and current_farmer.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Only the post author can mark a solution")

    comment = db.query(db_models.CommunityComment).filter(db_models.CommunityComment.id == comment_id, db_models.CommunityComment.post_id == post_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found on this post")

    # Unmark previous solutions on this post if any
    db.query(db_models.CommunityComment).filter(db_models.CommunityComment.post_id == post_id).update({"is_solution": False})

    # Mark new solution
    comment.is_solution = True
    post.has_solution = True
    post.solution_comment_id = comment.id

    # Award large reputation bonus to the solution provider
    comment_author = comment.author
    if comment_author and comment_author.id != current_farmer.id:
        comment_author.reputation = (comment_author.reputation or 10) + 15

    db.commit()
    return {
        "status": "success",
        "message": "Answer successfully marked as accepted solution (समाधान मिला)",
        "solution_comment_id": comment.id
    }


# --- Public Farmer Profile & Follow System ---
@router.get("/profile/{farmer_id}")
def get_farmer_public_profile(
    farmer_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    farmer = db.query(db_models.Farmer).filter(db_models.Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    posts_count = db.query(db_models.CommunityPost).filter(db_models.CommunityPost.farmer_id == farmer_id, db_models.CommunityPost.status == "active").count()
    solutions_count = db.query(db_models.CommunityComment).filter(db_models.CommunityComment.farmer_id == farmer_id, db_models.CommunityComment.is_solution == True).count()
    followers_count = db.query(db_models.CommunityFollow).filter(db_models.CommunityFollow.following_id == farmer_id).count()
    following_count = db.query(db_models.CommunityFollow).filter(db_models.CommunityFollow.follower_id == farmer_id).count()

    is_following = db.query(db_models.CommunityFollow).filter(
        db_models.CommunityFollow.follower_id == current_farmer.id,
        db_models.CommunityFollow.following_id == farmer_id
    ).first() is not None

    return {
        "profile": {
            "id": farmer.id,
            "name": farmer.name,
            "region": farmer.location_region or "India", # Privacy safe: NO GPS, NO Phone, NO Email
            "role": farmer.role or "farmer",
            "is_verified_expert": bool(farmer.is_verified_expert),
            "expert_title": farmer.expert_title,
            "reputation": farmer.reputation or 10,
            "posts_count": posts_count,
            "solutions_count": solutions_count,
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following": is_following,
            "is_me": farmer.id == current_farmer.id,
            "joined_at": farmer.created_at.strftime("%B %Y")
        }
    }


@router.post("/users/{farmer_id}/follow")
def toggle_follow_farmer(
    farmer_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    if farmer_id == current_farmer.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target_farmer = db.query(db_models.Farmer).filter(db_models.Farmer.id == farmer_id).first()
    if not target_farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    follow = db.query(db_models.CommunityFollow).filter(
        db_models.CommunityFollow.follower_id == current_farmer.id,
        db_models.CommunityFollow.following_id == farmer_id
    ).first()

    if follow:
        db.delete(follow)
        db.commit()
        return {"status": "success", "is_following": False, "message": f"Unfollowed {target_farmer.name}"}
    else:
        new_follow = db_models.CommunityFollow(follower_id=current_farmer.id, following_id=farmer_id)
        db.add(new_follow)
        db.commit()
        return {"status": "success", "is_following": True, "message": f"Now following {target_farmer.name}"}


# --- News Feed (Regional & National with Live Daily Sync) ---
@router.get("/news/all")
def get_all_agriculture_news(
    news_type: Optional[str] = None, # 'all', 'regional', 'national'
    state: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    import services.news_service as news_service
    news_service.sync_daily_agriculture_news(db)

    query = db.query(db_models.AgricultureNews)
    if news_type and news_type != "all":
        query = query.filter(db_models.AgricultureNews.news_type == news_type)
    if state and state.strip() and state.strip() != "All India":
        query = query.filter(db_models.AgricultureNews.state.ilike(f"%{state.strip()}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                db_models.AgricultureNews.title_en.ilike(term),
                db_models.AgricultureNews.title_hi.ilike(term),
                db_models.AgricultureNews.summary_en.ilike(term),
                db_models.AgricultureNews.summary_hi.ilike(term),
                db_models.AgricultureNews.tags.ilike(term),
            )
        )

    total = query.count()
    news = query.order_by(db_models.AgricultureNews.published_at.desc()).offset(offset).limit(limit).all()

    return {
        "status": "success",
        "total": total,
        "news": [
            {
                "id": n.id,
                "title_en": n.title_en,
                "title_hi": n.title_hi,
                "summary_en": n.summary_en,
                "summary_hi": n.summary_hi,
                "source_name": n.source_name,
                "source_url": n.source_url,
                "news_type": n.news_type,
                "state": n.state,
                "published_at": n.published_at.strftime("%d %b %Y"),
                "is_verified": n.is_verified
            }
            for n in news
        ]
    }


@router.post("/news/refresh")
def refresh_daily_agriculture_news(
    db: Session = Depends(get_db)
):
    """Force refresh latest live RSS and curated news."""
    import services.news_service as news_service
    total = news_service.sync_daily_agriculture_news(db, force_live_fetch=True)
    return {
        "status": "success",
        "message": "Daily agriculture news refreshed successfully.",
        "total_news_articles": total
    }


@router.get("/news/regional")
def get_regional_agriculture_news(
    state: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    import services.news_service as news_service
    news_service.sync_daily_agriculture_news(db)

    query = db.query(db_models.AgricultureNews).filter(db_models.AgricultureNews.news_type == "regional")
    if state and state.strip() and state.strip() != "All India":
        query = query.filter(db_models.AgricultureNews.state.ilike(f"%{state.strip()}%"))
    
    news = query.order_by(db_models.AgricultureNews.published_at.desc()).limit(limit).all()
    return {
        "status": "success",
        "news": [
            {
                "id": n.id,
                "title_en": n.title_en,
                "title_hi": n.title_hi,
                "summary_en": n.summary_en,
                "summary_hi": n.summary_hi,
                "source_name": n.source_name,
                "source_url": n.source_url,
                "state": n.state,
                "published_at": n.published_at.strftime("%d %b %Y"),
                "is_verified": n.is_verified
            }
            for n in news
        ]
    }


@router.get("/news/national")
def get_national_agriculture_news(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    import services.news_service as news_service
    news_service.sync_daily_agriculture_news(db)

    news = (
        db.query(db_models.AgricultureNews)
        .filter(db_models.AgricultureNews.news_type == "national")
        .order_by(db_models.AgricultureNews.published_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "status": "success",
        "news": [
            {
                "id": n.id,
                "title_en": n.title_en,
                "title_hi": n.title_hi,
                "summary_en": n.summary_en,
                "summary_hi": n.summary_hi,
                "source_name": n.source_name,
                "source_url": n.source_url,
                "state": n.state,
                "published_at": n.published_at.strftime("%d %b %Y"),
                "is_verified": n.is_verified
            }
            for n in news
        ]
    }


# --- Moderation & Content Reporting ---
@router.post("/report")
def report_community_content(
    req: ReportRequest,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    new_report = db_models.CommunityReport(
        reporter_id=current_farmer.id,
        target_type=req.target_type,
        target_id=req.target_id,
        reason=req.reason,
        details=req.details,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(new_report)
    db.commit()
    return {
        "status": "success",
        "message": "Report submitted. Our agricultural moderation team will review this promptly."
    }
