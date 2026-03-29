from collections import Counter
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Post, User
from schemas import (
    ContentAnalysisResponse,
    DraftAnalysisRequest,
    RecommendationItem,
    RecommendationsResponse,
)

router = APIRouter()

POSITIVE_WORDS = {
    "amazing", "awesome", "brilliant", "celebrate", "cool", "excited", "good",
    "great", "happy", "helpful", "inspire", "love", "nice", "progress",
    "strong", "success", "thanks", "win", "wonderful",
}
NEGATIVE_WORDS = {
    "angry", "annoyed", "bad", "broken", "delay", "fail", "frustrated", "hate",
    "issue", "problem", "sad", "stress", "stuck", "terrible", "tired", "worried",
}
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i",
    "in", "is", "it", "my", "of", "on", "or", "our", "that", "the", "this", "to",
    "we", "with", "you", "your",
}
CATEGORY_HINTS = {
    "tech": {"ai", "app", "build", "cloud", "code", "data", "dbms", "ml", "python", "software", "tech"},
    "news": {"announce", "breaking", "headline", "launch", "news", "update"},
    "lifestyle": {"daily", "health", "home", "journey", "life", "mindset", "routine", "travel"},
    "general": {"community", "idea", "people", "share", "story", "thought"},
}


def tokenize(text: str) -> List[str]:
    cleaned = "".join(char.lower() if char.isalnum() or char == "#" else " " for char in text)
    return [token for token in cleaned.split() if token]


def extract_keywords(text: str, limit: int = 5) -> List[str]:
    words = [word for word in tokenize(text) if word not in STOP_WORDS and len(word) > 3 and not word.startswith("#")]
    counts = Counter(words)
    return [word for word, _ in counts.most_common(limit)]


def detect_category(keywords: List[str], requested_category: str | None) -> str:
    if requested_category:
        return requested_category

    scored = []
    keyword_set = set(keywords)
    for category, hints in CATEGORY_HINTS.items():
        scored.append((category, len(keyword_set & hints)))
    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[0][0] if scored and scored[0][1] > 0 else "general"


def analyze_content(content: str, category: str | None = None) -> ContentAnalysisResponse:
    tokens = tokenize(content)
    keywords = extract_keywords(content)

    positive_hits = sum(1 for token in tokens if token in POSITIVE_WORDS)
    negative_hits = sum(1 for token in tokens if token in NEGATIVE_WORDS)
    total_signal = max(positive_hits + negative_hits, 1)
    sentiment_score = (positive_hits - negative_hits) / total_signal

    if sentiment_score > 0.2:
        sentiment = "positive"
    elif sentiment_score < -0.2:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    question_bonus = 8 if "?" in content else 0
    hashtag_bonus = min(content.count("#") * 4, 12)
    length_bonus = min(len(content) / 18, 20)
    engagement_score = max(20.0, min(100.0, 45 + positive_hits * 6 - negative_hits * 4 + question_bonus + hashtag_bonus + length_bonus))

    chosen_category = detect_category(keywords, category)
    suggestions = [f"#{chosen_category}"]
    suggestions.extend(f"#{word}" for word in keywords[:4])
    suggested_hashtags = list(dict.fromkeys(suggestions))[:5]

    if negative_hits > positive_hits:
        tip = "Try a more constructive tone and add a clear takeaway to improve reach."
    elif len(content) < 80:
        tip = "Add one concrete detail or question so people have more reason to reply."
    else:
        tip = "This draft is strong. A short call to action at the end could boost engagement."

    summary_keywords = ", ".join(keywords[:3]) if keywords else "your main idea"
    summary = f"This post centers on {summary_keywords} and is likely to perform best in {chosen_category}."

    return ContentAnalysisResponse(
        sentiment=sentiment,
        sentiment_score=round(sentiment_score, 2),
        engagement_score=round(engagement_score, 1),
        recommended_category=chosen_category,
        suggested_hashtags=suggested_hashtags,
        improvement_tip=tip,
        summary=summary,
    )


def build_user_interest_profile(user: User) -> set[str]:
    corpus = [user.bio or "", user.full_name or "", user.username or ""]
    corpus.extend(post.content for post in user.posts)
    interests = set()
    for text in corpus:
        interests.update(extract_keywords(text, limit=8))
    return interests


@router.post("/analyze-draft", response_model=ContentAnalysisResponse)
async def analyze_draft(payload: DraftAnalysisRequest):
    return analyze_content(payload.content, payload.category)


@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(user_id: int, limit: int = 5, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(joinedload(User.posts))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    interest_keywords = build_user_interest_profile(user)
    candidate_posts = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.comments), joinedload(Post.liked_by))
        .filter(Post.author_id != user_id)
        .all()
    )

    ranked: List[RecommendationItem] = []
    for post in candidate_posts:
        post_keywords = set(extract_keywords(post.content, limit=8))
        overlap = interest_keywords & post_keywords
        popularity_bonus = len(post.comments) * 1.5 + len(post.liked_by) * 1.2
        score = len(overlap) * 12 + popularity_bonus + min(len(post.content) / 30, 8)

        reasons = []
        if overlap:
            reasons.append(f"Matches your interests: {', '.join(sorted(list(overlap))[:3])}")
        if len(post.comments) > 0:
            reasons.append(f"Already getting conversation with {len(post.comments)} comment(s)")
        if len(post.liked_by) > 0:
            reasons.append(f"Popular with {len(post.liked_by)} like(s)")
        if not reasons:
            reasons.append("Fresh content from the community")

        ranked.append(
            RecommendationItem(
                post_id=post.id,
                author_id=post.author_id,
                author_username=post.author.username,
                content=post.content,
                score=round(score, 1),
                reasons=reasons[:3],
            )
        )

    ranked.sort(key=lambda item: item.score, reverse=True)
    return RecommendationsResponse(user_id=user_id, recommendations=ranked[:limit])
