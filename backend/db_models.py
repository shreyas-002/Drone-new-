from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="farmer") # "farmer", "expert", "agronomist", "moderator", "admin"
    is_verified_expert = Column(Boolean, default=False)
    expert_title = Column(String, nullable=True) # e.g. "Senior Agronomist, ICAR" / "कृषि विशेषज्ञ"
    reputation = Column(Integer, default=10)
    location_region = Column(String, default="Ludhiana, Punjab") # Privacy-safe state/district location
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fields = relationship("Field", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="farmer", cascade="all, delete-orphan")
    community_posts = relationship("CommunityPost", back_populates="author", cascade="all, delete-orphan")
    community_comments = relationship("CommunityComment", back_populates="author", cascade="all, delete-orphan")
    community_votes = relationship("CommunityVote", back_populates="farmer", cascade="all, delete-orphan")
    community_bookmarks = relationship("CommunityBookmark", back_populates="farmer", cascade="all, delete-orphan")
    followers = relationship("CommunityFollow", foreign_keys="CommunityFollow.following_id", back_populates="following", cascade="all, delete-orphan")
    following = relationship("CommunityFollow", foreign_keys="CommunityFollow.follower_id", back_populates="follower", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    field_name = Column(String, nullable=False)
    area = Column(Float, nullable=False)
    area_unit = Column(String, default="acres") # acres, hectares, bigha
    crop = Column(String, nullable=False) # Wheat, Tomato, Rice, etc.
    sowing_date = Column(String, nullable=False) # YYYY-MM-DD
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    soil_type = Column(String, default="Alluvial")
    irrigation_type = Column(String, default="Canal")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("Farmer", back_populates="fields")
    detections = relationship("Detection", back_populates="field", cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="field", cascade="all, delete-orphan")
    community_posts = relationship("CommunityPost", back_populates="field")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)
    detection_type = Column(String, nullable=False) # DISEASE or PEST
    disease_or_pest_name = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    image_ref = Column(Text, nullable=True)

    field = relationship("Field", back_populates="detections")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)
    recipient_phone = Column(String, nullable=False)
    channel = Column(String, nullable=False) # "SMS", "WHATSAPP", "BOTH"
    alert_type = Column(String, nullable=False) # "DISEASE", "PEST", "CLIMATE", "TEST"
    title = Column(String, nullable=False)
    message_en = Column(Text, nullable=False)
    message_hi = Column(Text, nullable=False)
    status = Column(String, default="SENT") # "SENT", "SIMULATED", "FAILED"
    provider_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="notifications")
    field = relationship("Field", back_populates="notifications")


# ====================================================================
# KRISHI SAMVAD (कृषि संवाद) COMMUNITY DATA MODELS
# ====================================================================

class CommunityCategory(Base):
    __tablename__ = "community_categories"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name_en = Column(String, nullable=False)
    name_hi = Column(String, nullable=False)
    icon = Column(String, nullable=False) # Lucide icon name or emoji
    description_en = Column(String, nullable=True)
    description_hi = Column(String, nullable=True)
    display_order = Column(Integer, default=0)

    posts = relationship("CommunityPost", back_populates="category")


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True) # Optional internal link; never exposes GPS
    category_id = Column(Integer, ForeignKey("community_categories.id"), nullable=False, index=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    crop = Column(String, nullable=True, index=True) # e.g. "Wheat", "Tomato", "Rice"
    tags = Column(String, nullable=True) # JSON or comma-separated tags
    region = Column(String, nullable=False, default="Punjab, India") # Privacy-safe state/district
    post_type = Column(String, default="question") # "question", "discussion", "experience", "solution"
    
    upvotes_count = Column(Integer, default=0)
    downvotes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    
    has_solution = Column(Boolean, default=False)
    solution_comment_id = Column(Integer, nullable=True)
    
    status = Column(String, default="active") # "active", "hidden", "flagged", "deleted"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("Farmer", back_populates="community_posts")
    field = relationship("Field", back_populates="community_posts")
    category = relationship("CommunityCategory", back_populates="posts")
    media = relationship("CommunityPostMedia", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("CommunityComment", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("CommunityVote", back_populates="post", cascade="all, delete-orphan", foreign_keys="CommunityVote.post_id")
    bookmarks = relationship("CommunityBookmark", back_populates="post", cascade="all, delete-orphan")


class CommunityPostMedia(Base):
    __tablename__ = "community_post_media"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False, index=True)
    media_type = Column(String, default="image") # "image", "video"
    media_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("CommunityPost", back_populates="media")


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    parent_comment_id = Column(Integer, ForeignKey("community_comments.id"), nullable=True, index=True)
    
    content = Column(Text, nullable=False)
    is_solution = Column(Boolean, default=False)
    upvotes_count = Column(Integer, default=0)
    downvotes_count = Column(Integer, default=0)
    status = Column(String, default="active") # "active", "hidden", "deleted"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("Farmer", back_populates="community_comments")
    parent = relationship("CommunityComment", remote_side=[id], backref="replies")
    votes = relationship("CommunityVote", back_populates="comment", cascade="all, delete-orphan", foreign_keys="CommunityVote.comment_id")


class CommunityVote(Base):
    __tablename__ = "community_votes"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    target_type = Column(String, nullable=False) # "post" or "comment"
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("community_comments.id"), nullable=True)
    vote_type = Column(Integer, nullable=False) # +1 for upvote, -1 for downvote
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="community_votes")
    post = relationship("CommunityPost", back_populates="votes")
    comment = relationship("CommunityComment", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("farmer_id", "target_type", "post_id", name="uq_farmer_post_vote"),
        UniqueConstraint("farmer_id", "target_type", "comment_id", name="uq_farmer_comment_vote"),
    )


class CommunityBookmark(Base):
    __tablename__ = "community_bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="community_bookmarks")
    post = relationship("CommunityPost", back_populates="bookmarks")

    __table_args__ = (
        UniqueConstraint("farmer_id", "post_id", name="uq_farmer_post_bookmark"),
    )


class CommunityFollow(Base):
    __tablename__ = "community_follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    follower = relationship("Farmer", foreign_keys=[follower_id], back_populates="following")
    following = relationship("Farmer", foreign_keys=[following_id], back_populates="followers")

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),
    )


class CommunityReport(Base):
    __tablename__ = "community_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    target_type = Column(String, nullable=False) # "post", "comment", "farmer"
    target_id = Column(Integer, nullable=False)
    reason = Column(String, nullable=False) # "spam", "abuse", "misinformation", "dangerous_advice", "fake_expert", "other"
    details = Column(Text, nullable=True)
    status = Column(String, default="pending") # "pending", "reviewed", "dismissed", "action_taken"
    created_at = Column(DateTime, default=datetime.utcnow)

    reporter = relationship("Farmer")


class AgricultureNews(Base):
    __tablename__ = "agriculture_news"

    id = Column(Integer, primary_key=True, index=True)
    title_en = Column(String, nullable=False)
    title_hi = Column(String, nullable=False)
    summary_en = Column(Text, nullable=False)
    summary_hi = Column(Text, nullable=False)
    source_name = Column(String, nullable=False) # e.g., "ICAR / DD Kisan / Ministry of Agriculture"
    source_url = Column(String, nullable=False) # Authentic official link
    published_at = Column(DateTime, default=datetime.utcnow, index=True)
    news_type = Column(String, default="national") # "regional", "national"
    state = Column(String, nullable=True) # e.g. "Punjab", "Rajasthan", "Madhya Pradesh", "All India"
    image_url = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    is_verified = Column(Boolean, default=True)
