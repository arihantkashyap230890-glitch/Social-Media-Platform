from collections import Counter
from datetime import datetime
import math
import re
from typing import List, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Post, User
from schemas import (
    ChatRequest,
    ChatResponse,
    ContentAnalysisResponse,
    DraftAnalysisRequest,
    RecommendationItem,
    RecommendationsResponse,
)

router = APIRouter()

POSITIVE_WORDS = {
    "amazing", "awesome", "brilliant", "celebrate", "clear", "cool", "excited", "good",
    "great", "happy", "helpful", "improve", "inspire", "insight", "learn", "love",
    "nice", "progress", "smart", "strong", "success", "thanks", "useful", "win",
    "wonderful",
}
NEGATIVE_WORDS = {
    "angry", "annoyed", "bad", "broken", "confused", "delay", "difficult", "fail",
    "frustrated", "hate", "issue", "problem", "sad", "slow", "stress", "stuck",
    "terrible", "tired", "unclear", "worried",
}
CTA_TERMS = {
    "comment", "drop", "let", "reply", "share", "tell", "thoughts", "vote", "what",
    "which",
}
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i",
    "in", "is", "it", "its", "my", "of", "on", "or", "our", "that", "the", "their",
    "this", "to", "we", "with", "you", "your",
}
CATEGORY_HINTS = {
    "tech": {"ai", "analytics", "app", "api", "build", "cloud", "code", "data", "dbms", "ml", "python", "software", "tech"},
    "news": {"announce", "breaking", "headline", "launch", "news", "release", "update"},
    "lifestyle": {"daily", "health", "home", "journey", "life", "mindset", "routine", "travel", "wellness"},
    "general": {"community", "idea", "people", "share", "story", "thought"},
}
CHAT_SUGGESTIONS = [
    "How do recommendations work?",
    "Help me improve my current draft",
    "How do I create a post?",
]


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def tokenize(text: str) -> List[str]:
    cleaned = re.sub(r"[^a-z0-9# ]+", " ", text.lower())
    return [token for token in cleaned.split() if token]


def split_sentences(text: str) -> List[str]:
    sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", text.strip()) if sentence.strip()]
    return sentences or [text.strip()] if text.strip() else []


def extract_keywords(text: str, limit: int = 5) -> List[str]:
    words = [word for word in tokenize(text) if word not in STOP_WORDS and len(word) > 3 and not word.startswith("#")]
    counts = Counter(words)
    return [word for word, _ in counts.most_common(limit)]


def vectorize_text(text: str, limit: int = 10) -> Counter[str]:
    words = [word for word in tokenize(text) if word not in STOP_WORDS and len(word) > 3 and not word.startswith("#")]
    counts = Counter(words)
    most_common = counts.most_common(limit)
    return Counter({word: count for word, count in most_common})


def normalize_vector(vector: Counter[str]) -> float:
    return math.sqrt(sum(weight * weight for weight in vector.values())) or 1.0


def compute_similarity(profile: Counter[str], content_vector: Counter[str]) -> float:
    if not profile or not content_vector:
        return 0.0
    dot = sum(profile[word] * weight for word, weight in content_vector.items() if word in profile)
    return dot / (normalize_vector(profile) * normalize_vector(content_vector))


def infer_user_persona(interests: set[str]) -> str:
    if interests & {"ai", "ml", "python", "cloud", "code", "data", "software", "dbms", "tech"}:
        return "tech-savvy creator"
    if interests & {"travel", "life", "health", "home", "routine", "journey", "lifestyle", "mindset"}:
        return "lifestyle storyteller"
    if interests & {"community", "share", "story", "people", "help", "support", "career"}:
        return "community connector"
    return "curious learner"


def detect_category(keywords: List[str], requested_category: str | None) -> str:
    if requested_category:
        return requested_category

    keyword_set = set(keywords)
    scored = [(category, len(keyword_set & hints)) for category, hints in CATEGORY_HINTS.items()]
    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[0][0] if scored and scored[0][1] > 0 else "general"


def contains_call_to_action(text: str, tokens: List[str]) -> bool:
    lowered = text.lower()
    return "?" in text or any(token in CTA_TERMS for token in tokens) or "let me know" in lowered


def compute_clarity_score(tokens: List[str], sentences: List[str], content: str) -> float:
    if not tokens:
        return 0.0

    avg_sentence_length = len(tokens) / max(len(sentences), 1)
    unique_ratio = len(set(tokens)) / len(tokens)
    punctuation_bonus = 4 if any(char in content for char in ".!?") else -4

    clarity = 88.0
    clarity -= max(avg_sentence_length - 16, 0) * 2.3
    clarity -= 10 if len(content) > 320 else 0
    clarity -= 7 if len(content) < 35 else 0
    clarity += unique_ratio * 10
    clarity += punctuation_bonus

    return round(clamp(clarity, 32.0, 98.0), 1)


def build_hashtags(category: str, keywords: List[str], goal: str | None = None) -> List[str]:
    suggestions = [f"#{category}"]
    suggestions.extend(f"#{word}" for word in keywords[:4])
    if goal:
        goal_keyword = "".join(char.lower() for char in goal if char.isalnum())
        if len(goal_keyword) > 3:
            suggestions.append(f"#{goal_keyword}")
    return list(dict.fromkeys(suggestions))[:6]


def build_strengths(content: str, sentiment_score: float, clarity_score: float, keywords: List[str], has_cta: bool) -> List[str]:
    strengths: List[str] = []
    if sentiment_score > 0.15:
        strengths.append("The tone feels encouraging and approachable.")
    if clarity_score >= 78:
        strengths.append("The message is clear enough to scan quickly on mobile.")
    if keywords:
        strengths.append(f"Your topic focus is visible through keywords like {', '.join(keywords[:3])}.")
    if has_cta:
        strengths.append("You already have a reply-friendly hook or call to action.")
    if len(content) >= 80:
        strengths.append("There is enough detail here to feel useful instead of vague.")
    return strengths[:4]


def build_action_items(content: str, positive_hits: int, negative_hits: int, clarity_score: float, has_cta: bool) -> List[str]:
    action_items: List[str] = []
    if len(content) < 80:
        action_items.append("Add one specific detail, example, or result to make the post more memorable.")
    if clarity_score < 72:
        action_items.append("Shorten one long sentence so the idea lands faster.")
    if negative_hits > positive_hits:
        action_items.append("Shift from problem-heavy wording to a constructive takeaway.")
    if not has_cta:
        action_items.append("End with a question or invite replies to increase conversation.")
    if len(content) > 220:
        action_items.append("Trim a few words so the strongest point appears earlier.")
    if not action_items:
        action_items.append("Publish as is or add one short question to invite responses.")
    return action_items[:4]


def build_rewrite(content: str, category: str, keywords: List[str], has_cta: bool) -> str:
    cleaned = " ".join(content.split())
    if not cleaned:
        return ""

    lead_map = {
        "tech": "Quick build update:",
        "news": "Quick update:",
        "lifestyle": "Small life note:",
        "general": "Thought for today:",
    }
    lead = lead_map.get(category, "Quick update:")
    lowered = cleaned.lower()
    has_existing_hook = lowered.startswith(("quick", "thought", "small", "update", "today", "here"))
    rewritten = cleaned if has_existing_hook else f"{lead} {cleaned}"

    if rewritten[-1] not in ".!?":
        rewritten += "."

    if not has_cta:
        cta_map = {
            "tech": "What would you improve next?",
            "news": "What stands out to you most?",
            "lifestyle": "Would you try something similar?",
            "general": "What do you think?",
        }
        rewritten = f"{rewritten} {cta_map.get(category, 'What do you think?')}"

    if len(rewritten) > 280:
        trimmed = rewritten[:277].rsplit(" ", 1)[0].rstrip(" ,.;:")
        rewritten = f"{trimmed}..."

    return rewritten


def analyze_content(content: str, category: str | None = None, goal: str | None = None) -> ContentAnalysisResponse:
    tokens = tokenize(content)
    keywords = extract_keywords(content)
    sentences = split_sentences(content)

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

    chosen_category = detect_category(keywords, category)
    has_cta = contains_call_to_action(content, tokens)
    clarity_score = compute_clarity_score(tokens, sentences, content)
    estimated_read_time_seconds = max(15, round(len(tokens) / 190 * 60)) if tokens else 0

    question_bonus = 8 if "?" in content else 0
    hashtag_bonus = min(content.count("#") * 3, 12)
    cta_bonus = 8 if has_cta else 0
    structure_bonus = 6 if 1 <= len(sentences) <= 3 else 0
    length_bonus = min(len(content) / 14, 18)
    engagement_score = clamp(
        32.0 + positive_hits * 7 - negative_hits * 5 + question_bonus + hashtag_bonus + cta_bonus + structure_bonus + length_bonus,
        20.0,
        100.0,
    )

    strengths = build_strengths(content, sentiment_score, clarity_score, keywords, has_cta)
    action_items = build_action_items(content, positive_hits, negative_hits, clarity_score, has_cta)
    improvement_tip = action_items[0]
    summary_keywords = ", ".join(keywords[:3]) if keywords else "your main idea"
    summary = f"This draft centers on {summary_keywords} and should perform best in {chosen_category}."
    suggested_hashtags = build_hashtags(chosen_category, keywords, goal)
    rewritten_draft = build_rewrite(content, chosen_category, keywords, has_cta)

    return ContentAnalysisResponse(
        sentiment=sentiment,
        sentiment_score=round(sentiment_score, 2),
        engagement_score=round(engagement_score, 1),
        recommended_category=chosen_category,
        suggested_hashtags=suggested_hashtags,
        improvement_tip=improvement_tip,
        summary=summary,
        clarity_score=clarity_score,
        estimated_read_time_seconds=estimated_read_time_seconds,
        strengths=strengths,
        action_items=action_items,
        rewritten_draft=rewritten_draft,
    )


def build_user_interest_profile(user: User) -> Counter[str]:
    interest_vector: Counter[str] = Counter()
    field_weights = {
        "bio": 3,
        "profile": 2,
        "post": 5,
        "like": 3,
        "follow": 2,
    }

    bio_text = str(user.bio or "")
    if bio_text.strip():
        for keyword, count in vectorize_text(bio_text, limit=12).items():
            interest_vector[keyword] += count * field_weights["bio"]

    profile_text = " ".join(str(value) for value in [user.full_name, user.username] if SS) # type: ignore
    if profile_text.strip():
        for keyword, count in vectorize_text(profile_text, limit=12).items():
            interest_vector[keyword] += count * field_weights["profile"]

    for post in user.posts:
        post_content = str(post.content or "")
        if post_content.strip():
            for keyword, count in vectorize_text(post_content, limit=10).items():
                interest_vector[keyword] += count * field_weights["post"]

    for liked_post in getattr(user, "likes", []):
        liked_content = str(getattr(liked_post, "content", "") or "")
        if liked_content.strip():
            for keyword, count in vectorize_text(liked_content, limit=8).items():
                interest_vector[keyword] += count * field_weights["like"]

    for follow in getattr(user, "following", []):
        followed_id = getattr(follow, "following_id", None)
        if followed_id:
            interest_vector[f"user_{followed_id}"] += field_weights["follow"]

    return interest_vector


def contains_any(text: str, phrases: set[str]) -> bool:
    return any(phrase in text for phrase in phrases)


def detect_chat_intent(message: str, has_draft: bool) -> tuple[str, float]:
    lowered = message.lower().strip()
    if has_draft and contains_any(lowered, {"draft", "rewrite", "improve", "caption", "post idea", "post help"}):
        return "draft_help", 0.94
    if contains_any(lowered, {"hello", "hey", "hi", "good morning", "good evening"}):
        return "greeting", 0.96
    if contains_any(lowered, {"what is connect hub", "about connect hub", "what does connect hub do"}):
        return "overview", 0.97
    if contains_any(lowered, {"sign up", "signup", "register", "login", "log in", "account"}):
        return "auth", 0.92
    if contains_any(lowered, {"create post", "how to post", "publish", "composer"}):
        return "posting", 0.92
    if contains_any(lowered, {"ai studio", "analysis", "hashtags", "rewrite"}):
        return "ai_studio", 0.9
    if contains_any(lowered, {"recommend", "recommended", "personalized feed", "for you"}):
        return "recommendations", 0.88
    if contains_any(lowered, {"message", "dm", "inbox", "chat"}):
        return "messaging", 0.86
    if contains_any(lowered, {"notifications", "alerts", "settings", "profile"}):
        return "profile", 0.82
    if contains_any(lowered, {"nsfw", "safety", "report", "block"}):
        return "safety", 0.84
    if contains_any(lowered, {"creator", "arihant"}):
        return "creator", 0.94
    if contains_any(lowered, {"help", "support", "what can you do"}):
        return "help", 0.8
    return "fallback", 0.56


def build_chat_response(payload: ChatRequest) -> ChatResponse:
    intent, confidence = detect_chat_intent(payload.message, bool(payload.draft and payload.draft.strip()))
    draft_insights = None

    if intent == "draft_help":
        if payload.draft and payload.draft.strip():
            draft_insights = analyze_content(payload.draft, None, "engagement")
            response = (
                f"Your draft looks {draft_insights.sentiment} with clarity at {draft_insights.clarity_score}/100. "
                f"{draft_insights.improvement_tip}"
            )
            suggestions = [
                "Use the rewrite from AI Studio",
                "Add the suggested hashtags",
                "Ask how to improve engagement",
            ]
            return ChatResponse(
                response=response,
                intent=intent,
                confidence=confidence,
                suggestions=suggestions,
                draft_insights=draft_insights,
            )
        return ChatResponse(
            response="Write something in the composer first, then ask me to improve the draft and I will coach it.",
            intent=intent,
            confidence=confidence,
            suggestions=["Help me improve my current draft", "How do I create a post?", "How do recommendations work?"],
        )

    if intent == "greeting":
        return ChatResponse(
            response="I can help with posting, AI Studio, recommendations, inbox, settings, and general platform questions.",
            intent=intent,
            confidence=confidence,
            suggestions=CHAT_SUGGESTIONS,
        )

    if intent == "overview":
        return ChatResponse(
            response="Connect Hub is a social platform focused on thoughtful sharing, clean discovery, and built-in AI help for drafting, hashtags, rewrites, and recommendations.",
            intent=intent,
            confidence=confidence,
            suggestions=["How do I create a post?", "What can AI Studio do?", "How do recommendations work?"],
        )

    if intent == "auth":
        return ChatResponse(
            response="Use Join the Community to create an account, then sign in with your email and password to unlock posting, following, and personalized features.",
            intent=intent,
            confidence=confidence,
            suggestions=["How do I create a post?", "How do recommendations work?", "Help me improve my current draft"],
        )

    if intent == "posting":
        return ChatResponse(
            response="Open the composer, write your post, choose a category, optionally add an image, run Analyze Draft if you want AI guidance, and then publish.",
            intent=intent,
            confidence=confidence,
            suggestions=["What can AI Studio do?", "Help me improve my current draft", "How do recommendations work?"],
        )

    if intent == "ai_studio":
        return ChatResponse(
            response="AI Studio analyzes tone, clarity, engagement potential, hashtags, and a suggested rewrite so you can polish a post before publishing.",
            intent=intent,
            confidence=confidence,
            suggestions=["Help me improve my current draft", "How do recommendations work?", "How do I create a post?"],
        )

    if intent == "recommendations":
        return ChatResponse(
            response="Recommendations learn from what you write, like, and who you follow, then blend topic match, social signals, and freshness to surface stronger posts.",
            intent=intent,
            confidence=confidence,
            suggestions=["What can AI Studio do?", "How do I create a post?", "Help me improve my current draft"],
        )

    if intent == "messaging":
        return ChatResponse(
            response="Open Inbox to continue conversations, view recent threads, and message people in your network directly.",
            intent=intent,
            confidence=confidence,
            suggestions=["How do I create a post?", "How do recommendations work?", "What can AI Studio do?"],
        )

    if intent == "profile":
        return ChatResponse(
            response="Profile and Settings let you manage your presence, privacy choices, theme, and notification preferences.",
            intent=intent,
            confidence=confidence,
            suggestions=["How do I create a post?", "How do recommendations work?", "What can AI Studio do?"],
        )

    if intent == "safety":
        return ChatResponse(
            response="Connect Hub separates sensitive content flows, keeps notifications visible, and uses confirmation steps around risky actions like deletion.",
            intent=intent,
            confidence=confidence,
            suggestions=["How do I create a post?", "What can AI Studio do?", "How do recommendations work?"],
        )

    if intent == "creator":
        return ChatResponse(
            response="Connect Hub was built by Arihant Kashyap with a focus on calmer, more meaningful social experiences.",
            intent=intent,
            confidence=confidence,
            suggestions=["What can AI Studio do?", "How do I create a post?", "How do recommendations work?"],
        )

    if intent == "help":
        return ChatResponse(
            response="Ask me about posting, AI Studio, recommendations, messages, settings, or have me coach the draft currently in your composer.",
            intent=intent,
            confidence=confidence,
            suggestions=CHAT_SUGGESTIONS,
        )

    return ChatResponse(
        response="I can help with posting, AI Studio, recommendations, inbox, or improving the draft in your composer.",
        intent=intent,
        confidence=confidence,
        suggestions=CHAT_SUGGESTIONS,
    )


async def parse_chat_payload(request: Request) -> ChatRequest:
    query_message = str(request.query_params.get("message", "")).strip()
    content_type = request.headers.get("content-type", "").lower()
    raw_body = await request.body()

    if "application/json" in content_type and raw_body:
        try:
            return ChatRequest.model_validate_json(raw_body)
        except Exception as exc:
            raise HTTPException(status_code=422, detail="Invalid chat payload") from exc

    if raw_body:
        body_message = raw_body.decode("utf-8", errors="ignore").strip()
        if body_message:
            return ChatRequest(message=body_message) # type: ignore

    if query_message:
        return ChatRequest(
            message=query_message,
            draft=str(request.query_params.get("draft", "")).strip() or None,
            signed_in=str(request.query_params.get("signed_in", "")).lower() in {"1", "true", "yes"},
        )

    raise HTTPException(status_code=422, detail="Message is required")


@router.post("/analyze-draft", response_model=ContentAnalysisResponse)
async def analyze_draft(payload: DraftAnalysisRequest):
    return analyze_content(payload.content, payload.category, payload.goal)


@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(user_id: int, limit: int = 5, db: Session = Depends(get_db)):
    safe_limit = int(clamp(limit, 1, 10))
    user = (
        db.query(User)
        .options(joinedload(User.posts), joinedload(User.likes), joinedload(User.following))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_interest_vector = build_user_interest_profile(user)
    user_persona = infer_user_persona({keyword for keyword in user_interest_vector if not keyword.startswith("user_")})
    interest_keywords = [keyword for keyword, _ in user_interest_vector.most_common(8) if not keyword.startswith("user_")]
    followed_ids = {follow.following_id for follow in getattr(user, "following", [])}
    candidate_posts = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.comments), joinedload(Post.liked_by))
        .filter(Post.author_id != user_id)
        .all()
    )

    ranked: List[RecommendationItem] = []
    now = datetime.utcnow()

    for post in candidate_posts:
        post_content = str(post.content or "")
        post_vector = vectorize_text(post_content, limit=12)
        similarity = compute_similarity(user_interest_vector, post_vector)
        overlap = sorted(
            [word for word in post_vector if word in user_interest_vector and not word.startswith("user_")],
            key=lambda word: user_interest_vector[word],
            reverse=True,
        )
        popularity_bonus = len(post.comments) * 1.6 + len(post.liked_by) * 1.15
        social_bonus = 10 if post.author_id in followed_ids else 0
        created_at = post.created_at or now
        age_hours = max((now - created_at).total_seconds() / 3600, 0)
        freshness_bonus = max(0.0, 10 - min(age_hours / 6, 10))
        post_category = detect_category(list(post_vector.keys()), None)
        category_bonus = 5 if post_category in interest_keywords else 0
        exploration_bonus = 3 if similarity < 0.08 and popularity_bonus >= 4 else 0
        score = similarity * 65 + len(overlap) * 6 + popularity_bonus + social_bonus + freshness_bonus + category_bonus + exploration_bonus

        reasons = []
        if similarity > 0.2:
            reasons.append(f"Strong topic match for a {user_persona}.")
        if overlap:
            reasons.append(f"Matches your interests: {', '.join(overlap[:3])}")
        if social_bonus:
            reasons.append("From someone in your network.")
        if popularity_bonus >= 4:
            reasons.append(f"Already drawing engagement with {len(post.liked_by)} like(s) and {len(post.comments)} comment(s).")
        if freshness_bonus >= 6:
            reasons.append("Fresh post with current momentum.")
        if not reasons:
            reasons.append("Useful exploration pick outside your usual pattern.")

        post_id = cast(int, post.id)
        author_id = cast(int, post.author_id)
        ranked.append(
            RecommendationItem(
                post_id=post_id,
                author_id=author_id,
                author_username=str(post.author.username),
                content=post_content,
                score=round(score, 1),
                reasons=reasons[:3],
                category=post_category,
                interest_overlap=overlap[:4],
            )
        )

    ranked.sort(key=lambda item: item.score, reverse=True)
    return RecommendationsResponse(
        user_id=user_id,
        persona=user_persona,
        interest_keywords=interest_keywords[:6],
        recommendations=ranked[:safe_limit],
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: Request) -> ChatResponse:
    payload = await parse_chat_payload(request)
    return build_chat_response(payload)
