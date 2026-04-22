from collections import Counter, defaultdict
from html import unescape
import json
from typing import List, Optional, cast
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Post, User
from schemas import (
    ContentAnalysisResponse,
    DraftAnalysisRequest,
    RecommendationItem,
    RecommendationsResponse,
    ChatRequest,
    ChatResponse,
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
CHATBOT_USER_AGENT = "ConnectHubBot/1.0 (+https://connecthub.local)"


def fetch_json(url: str) -> dict | list | None:
    request = Request(
        url,
        headers={
            "User-Agent": CHATBOT_USER_AGENT,
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=6) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None


def fetch_wikipedia_summary(query: str) -> tuple[str | None, str | None]:
    search_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={quote_plus(query)}&limit=1&namespace=0&format=json"
    search_data = fetch_json(search_url)
    if not isinstance(search_data, list) or len(search_data) < 2 or not search_data[1]:
        return None, None

    page_title = str(search_data[1][0]).replace(" ", "_")
    summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote_plus(page_title)}"
    summary_data = fetch_json(summary_url)
    if not isinstance(summary_data, dict):
        return None, None

    extract = str(summary_data.get("extract") or "").strip()
    page_url = (
        summary_data.get("content_urls", {})
        .get("desktop", {})
        .get("page")
    )
    return extract or None, str(page_url) if page_url else None


def fetch_duckduckgo_answer(query: str) -> tuple[str | None, str | None]:
    url = f"https://api.duckduckgo.com/?q={quote_plus(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=0"
    data = fetch_json(url)
    if not isinstance(data, dict):
        return None, None

    abstract = unescape(str(data.get("AbstractText") or "")).strip()
    if abstract:
        source_url = str(data.get("AbstractURL") or "").strip() or None
        return abstract, source_url

    answer = unescape(str(data.get("Answer") or "")).strip()
    if answer:
        return answer, None

    related_topics = data.get("RelatedTopics") or []
    for topic in related_topics:
        if isinstance(topic, dict) and topic.get("Text"):
            return unescape(str(topic["Text"])).strip(), str(topic.get("FirstURL") or "").strip() or None
        if isinstance(topic, dict) and isinstance(topic.get("Topics"), list):
            for nested in topic["Topics"]:
                if isinstance(nested, dict) and nested.get("Text"):
                    return unescape(str(nested["Text"])).strip(), str(nested.get("FirstURL") or "").strip() or None

    return None, None


def build_research_answer(query: str) -> tuple[str, float, list[str]]:
    snippets: list[str] = []
    sources: list[str] = []

    wiki_summary, wiki_url = fetch_wikipedia_summary(query)
    if wiki_summary:
        snippets.append(f"Wikipedia says: {wiki_summary}")
        if wiki_url:
            sources.append(f"Wikipedia: {wiki_url}")

    web_summary, web_url = fetch_duckduckgo_answer(query)
    if web_summary:
        snippets.append(f"Web result says: {web_summary}")
        if web_url:
            sources.append(f"Web: {web_url}")

    if not snippets:
        return (
            "I couldn't find a confident external answer right now. Try asking a more specific question with a person, place, event, or topic name.",
            0.28,
            [],
        )

    combined = " ".join(snippets[:2])
    sources_text = f" Sources: {' | '.join(sources[:2])}." if sources else ""
    return combined + sources_text, 0.78 if len(snippets) > 1 else 0.64, sources[:2]


def tokenize(text: str) -> List[str]:
    cleaned = "".join(char.lower() if char.isalnum() or char == "#" else " " for char in text)
    return [token for token in cleaned.split() if token]


def extract_keywords(text: str, limit: int = 5) -> List[str]:
    words = [word for word in tokenize(text) if word not in STOP_WORDS and len(word) > 3 and not word.startswith("#")]
    counts = Counter(words)
    return [word for word, _ in counts.most_common(limit)]


def vectorize_text(text: str, limit: int = 10) -> dict[str, int]:
    words = [word for word in tokenize(text) if word not in STOP_WORDS and len(word) > 3]
    counts = Counter(words)
    return dict(counts.most_common(limit))


def detect_category(keywords: List[str], requested_category: str | None) -> str:
    if requested_category:
        return requested_category

    scored = []
    keyword_set = set(keywords)
    for category, hints in CATEGORY_HINTS.items():
        scored.append((category, len(keyword_set & hints)))
    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[0][0] if scored and scored[0][1] > 0 else "general"


def analyze_content(content: str, category: str | None = None, goal: str | None = None) -> ContentAnalysisResponse:
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

    # Clarity and Readability Analysis
    sentences = [s for s in content.split(".") if s.strip()]
    avg_sentence_len = len(tokens) / max(len(sentences), 1)
    unique_ratio = len(set(tokens)) / max(len(tokens), 1)
    clarity_score = max(30, min(98, 92 - (avg_sentence_len - 14) * 2.2 + unique_ratio * 8))
    read_time = max(5, round((len(tokens) / 200) * 60))

    # Strengths and Action Items
    strengths = []
    action_items = []
    if sentiment == "positive": strengths.append("Approachable and positive tone")
    if clarity_score > 75: strengths.append("High readability and scanability")
    if len(content) > 120: strengths.append("Provides good depth and context")

    if "?" not in content: action_items.append("Ask a question at the end to invite replies")
    if clarity_score < 60: action_items.append("Consider breaking up long sentences")
    if sentiment == "negative": action_items.append("Shift toward a more constructive takeaway")
    if not keywords: action_items.append("Add specific keywords for better discovery")

    # Basic Rewritten Draft Suggestion
    rewrite = content.strip()
    if not rewrite.endswith(("?", ".", "!")): rewrite += "."
    if "?" not in rewrite: rewrite += " What are your thoughts on this?"

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
        clarity_score=round(clarity_score, 1),
        estimated_read_time_seconds=read_time,
        strengths=strengths,
        action_items=action_items,
        rewritten_draft=rewrite,
    )


def build_user_interest_profile(user: User) -> dict[str, float]:
    field_weights = {"bio": 1.5, "profile": 1.0, "post": 1.2}
    interest_vector = defaultdict(float)

    if user.bio is not None:
        for keyword, count in vectorize_text(str(user.bio), limit=12).items():
            interest_vector[keyword] += count * field_weights["bio"]

    profile_text = " ".join(str(value) for value in [user.full_name, user.username] if value is not None)
    if profile_text.strip():
        for keyword, count in vectorize_text(str(profile_text), limit=12).items():
            interest_vector[keyword] += count * field_weights["profile"]

    for post in user.posts:
        for keyword, count in vectorize_text(str(post.content), limit=8).items():
            interest_vector[keyword] += count * field_weights["post"]

    return dict(interest_vector)


@router.post("/analyze-draft", response_model=ContentAnalysisResponse)
async def analyze_draft(payload: DraftAnalysisRequest):
    return analyze_content(payload.content, payload.category, payload.goal)


@router.post("/chat", response_model=ChatResponse)
async def assistant_chat(payload: ChatRequest):
    msg = payload.message.lower()
    intent = "general"
    confidence = 0.95
    response_text = "I'm your Connect Hub assistant. I can help with posts, AI Studio, recommendations, and general questions."
    suggestions = ["How do recommendations work?", "What is AI Studio?", "Who is Ada Lovelace?"]
    insights = None

    if "recommend" in msg:
        intent = "recommendations_query"
        response_text = "Recommendations are based on your interest profile, which is built from your bio, posts, and interactions. We look for topic overlaps and social momentum."
    elif "draft" in msg or "improve" in msg or "analyze" in msg:
        intent = "draft_coaching"
        if payload.draft:
            insights = analyze_content(payload.draft)
            response_text = f"I've analyzed your draft. Its sentiment is {insights.sentiment} and I estimate an engagement score of {insights.engagement_score}. {insights.improvement_tip}"
        else:
            response_text = "Write something in the composer first, then I can help you improve the draft."
    elif "connect hub" in msg or ("hub" in msg and "connect" in msg):
        response_text = "Connect Hub is a social platform focused on thoughtful sharing and AI-assisted content discovery."
    elif "post" in msg or "create" in msg:
        response_text = "You can create a post using the composer on your dashboard. Don't forget to pick a category!"
    else:
        intent = "research_answer"
        response_text, confidence, _sources = build_research_answer(payload.message)
        suggestions = [
            "Give me a short summary",
            "Explain it more simply",
            "Show another example"
        ]

    return ChatResponse(
        response=response_text,
        intent=intent,
        confidence=confidence,
        suggestions=suggestions,
        draft_insights=insights
    )


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

    interest_profile = build_user_interest_profile(user)
    interest_keywords = set(interest_profile.keys())
    candidate_posts = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.comments), joinedload(Post.liked_by))
        .filter(Post.author_id != user_id)
        .all()
    )

    ranked: List[RecommendationItem] = []
    for post in candidate_posts:
        post_keywords = set(extract_keywords(str(post.content), limit=8))
        overlap = interest_keywords & post_keywords
        popularity_bonus = len(post.comments) * 1.5 + len(post.liked_by) * 1.2
        score = len(overlap) * 12 + popularity_bonus + min(len(str(post.content)) / 30, 8)

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
                post_id=cast(int, post.id),
                author_id=cast(int, post.author_id),
                author_username=str(post.author.username),
                content=str(post.content),
                score=round(score, 1),
                reasons=reasons[:3],
            )
        )

    ranked.sort(key=lambda item: item.score, reverse=True)
    return RecommendationsResponse(
        user_id=user_id, 
        persona="curious learner", 
        interest_keywords=list(interest_keywords),
        recommendations=ranked[:limit]
    )
