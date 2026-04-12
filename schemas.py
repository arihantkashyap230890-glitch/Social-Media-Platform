from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# ==================== User Schemas ====================
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None

class UserRegister(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None

class UserResponse(UserBase):
    id: int
    bio: Optional[str]
    profile_image: Optional[str]
    cover_image: Optional[str]
    created_at: datetime
    is_verified: bool
    
    model_config = ConfigDict(from_attributes=True)

class UserProfileResponse(UserResponse):
    followers_count: int
    following_count: int
    posts_count: int

# ==================== Token Schemas ====================
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# ==================== Post Schemas ====================
class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    image_url: Optional[str] = None
    is_nsfw: bool = False

class PostUpdate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None
    is_nsfw: Optional[bool] = None

class PostResponse(BaseModel):
    id: int
    author_id: int
    content: str
    image_url: Optional[str]
    is_nsfw: bool
    created_at: datetime
    updated_at: datetime
    author: UserResponse
    comments_count: int = 0
    likes_count: int = 0
    liked_by_current_user: bool = False
    
    class Config:
        orm_mode = True

class PostDetailResponse(PostResponse):
    comments: List['CommentResponse'] = []

# ==================== Comment Schemas ====================
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

class CommentResponse(BaseModel):
    id: int
    post_id: int
    author_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    author: UserResponse
    
    class Config:
        orm_mode = True

# ==================== Like Schemas ====================
class LikeResponse(BaseModel):
    user_id: int
    post_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# ==================== Follow Schemas ====================
class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class FollowUserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    profile_image: Optional[str]
    is_following: bool
    
    class Config:
        orm_mode = True

# ==================== Notification Schemas ====================
class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    sender_id: int
    notification_type: str
    content: Optional[str]
    post_id: Optional[int]
    is_read: bool
    created_at: datetime
    sender: UserResponse
    
    class Config:
        orm_mode = True

class NotificationMarkRead(BaseModel):
    is_read: bool

# ==================== Direct Message Schemas ====================
class DirectMessageCreate(BaseModel):
    recipient_id: int
    content: str = Field(..., min_length=1, max_length=1000)

class DirectMessageResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    is_read: bool
    created_at: datetime
    sender: UserResponse
    
    class Config:
        orm_mode = True

class DirectMessageThread(BaseModel):
    user: UserResponse
    last_message: Optional[DirectMessageResponse]
    unread_count: int

# ==================== Search Schemas ====================
class SearchResponse(BaseModel):
    users: List[UserResponse]
    posts: List[PostResponse]
    
class FeedResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    page_size: int

# ==================== AI / ML Schemas ====================
class DraftAnalysisRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    category: Optional[str] = None
    goal: Optional[str] = Field(None, max_length=120)

class ContentAnalysisResponse(BaseModel):
    sentiment: str
    sentiment_score: float
    engagement_score: float
    recommended_category: str
    suggested_hashtags: List[str]
    improvement_tip: str
    summary: str
    clarity_score: float = 0.0
    estimated_read_time_seconds: int = 0
    strengths: List[str] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)
    rewritten_draft: str = ""

class RecommendationItem(BaseModel):
    post_id: int
    author_id: int
    author_username: str
    content: str
    score: float
    reasons: List[str]
    category: Optional[str] = None
    interest_overlap: List[str] = Field(default_factory=list)

class RecommendationsResponse(BaseModel):
    user_id: int
    persona: str = "curious learner"
    interest_keywords: List[str] = Field(default_factory=list)
    recommendations: List[RecommendationItem]

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    draft: Optional[str] = Field(None, max_length=5000)
    signed_in: bool = False

class ChatResponse(BaseModel):
    response: str
    intent: str
    confidence: float
    suggestions: List[str] = Field(default_factory=list)
    draft_insights: Optional[ContentAnalysisResponse] = None

# ==================== Confirmation Schemas ====================
class ConfirmationRequest(BaseModel):
    action: str = Field(..., description="Action to confirm (e.g., 'delete_post', 'logout', 'unfollow')")
    resource_id: Optional[int] = Field(None, description="ID of the resource (e.g., post_id, follow_id)")

class ConfirmationResponse(BaseModel):
    confirmation_token: str
    message: str
    expires_at: datetime

class ActionWithConfirmation(BaseModel):
    confirmation_token: str

# Update forward references
PostDetailResponse.model_rebuild()
