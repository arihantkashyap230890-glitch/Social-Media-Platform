const postForm = document.getElementById("postForm");
const feed = document.getElementById("feed");
const postContent = document.getElementById("postContent");
const charCount = document.getElementById("charCount");
const authModal = document.getElementById("authModal");
const mainContainer = document.getElementById("mainContainer");
const mainHeader = document.getElementById("mainHeader");
const userInfo = document.getElementById("userInfo");
const currentUserSpan = document.getElementById("currentUser");
const logoutBtn = document.getElementById("logoutBtn");

const landingPage = document.getElementById("landingPage");
const getStartedBtn = document.getElementById("getStartedBtn");
const learnMoreBtn = document.getElementById("learnMoreBtn");
const totalUsersEl = document.getElementById("totalUsers");
const totalPostsEl = document.getElementById("totalPosts");
const totalLikesEl = document.getElementById("totalLikes");

const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");
const notificationsBtn = document.getElementById("notificationsBtn");
const settingsBtn = document.getElementById("settingsBtn");
const profileBtn = document.getElementById("profileBtn");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const categorySelect = document.getElementById("categorySelect");
const imageInput = document.getElementById("imageInput");
const imageBtn = document.getElementById("imageBtn");
const dmBtn = document.getElementById("dmBtn");
const analyzeDraftBtn = document.getElementById("analyzeDraftBtn");
const useHashtagsBtn = document.getElementById("useHashtagsBtn");
const aiSentiment = document.getElementById("aiSentiment");
const aiEngagement = document.getElementById("aiEngagement");
const aiCategory = document.getElementById("aiCategory");
const aiSummary = document.getElementById("aiSummary");
const aiTip = document.getElementById("aiTip");
const aiHashtags = document.getElementById("aiHashtags");
const aiInsightStatus = document.getElementById("aiInsightStatus");
const recommendedFeed = document.getElementById("recommendedFeed");
const draftStatus = document.getElementById("draftStatus");
const imagePreview = document.getElementById("imagePreview");
const feedSummary = document.getElementById("feedSummary");
const searchSummary = document.getElementById("searchSummary");
const toastStack = document.getElementById("toastStack");

const profileModal = document.getElementById("profileModal");
const commentsModal = document.getElementById("commentsModal");
const notificationsModal = document.getElementById("notificationsModal");
const settingsModal = document.getElementById("settingsModal");
const dmModal = document.getElementById("dmModal");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");

const allPostsTab = document.getElementById("allPostsTab");
const followingTab = document.getElementById("followingTab");
const trendingTab = document.getElementById("trendingTab");
const sortSelect = document.getElementById("sortSelect");

const DEFAULT_SETTINGS = {
    theme: "light",
    privateProfile: false,
    showOnlineStatus: true,
    emailNotifications: true,
    pushNotifications: true
};

let posts = readLocal("posts", []).map(normalizePost);
let users = readLocal("users", []).map(normalizeUser);
let comments = readLocal("comments", []).map(normalizeComment);
let notifications = readLocal("notifications", []).map(normalizeNotification);
let messages = readLocal("messages", []).map(normalizeMessage);
let settings = { ...DEFAULT_SETTINGS, ...readLocal("settings", {}) };
let currentUser = normalizeCurrentUser(readLocal("currentUser", null));
let currentPostId = null;
let profileUser = null;
let currentChatUser = null;
let currentAIAnalysis = null;
let currentImageData = null;
let currentFeedFilter = "all";

persistNormalizedData();

function readLocal(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function resolveIsoDate(value, fallbackId) {
    if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
        return value;
    }

    if (typeof fallbackId === "number") {
        const fromId = new Date(fallbackId);
        if (!Number.isNaN(fromId.getTime())) {
            return fromId.toISOString();
        }
    }

    return new Date().toISOString();
}

function normalizeUser(user) {
    if (!user) {
        return null;
    }

    const name = String(user.name || "Guest").trim() || "Guest";

    return {
        ...user,
        name,
        email: String(user.email || "").trim(),
        avatar: String(user.avatar || name.charAt(0).toUpperCase()),
        joined: resolveIsoDate(user.joined, user.id),
        followers: Array.isArray(user.followers) ? user.followers : [],
        following: Array.isArray(user.following) ? user.following : []
    };
}

function normalizeCurrentUser(user) {
    return normalizeUser(user);
}

function normalizePost(post) {
    const createdAt = resolveIsoDate(post && post.createdAt, post && post.id);

    return {
        ...post,
        id: post && post.id ? post.id : Date.now(),
        userId: post && post.userId ? post.userId : null,
        username: String((post && post.username) || "Unknown"),
        content: String((post && post.content) || ""),
        category: String((post && post.category) || ""),
        image: (post && post.image) || null,
        createdAt,
        timestamp: formatTime(new Date(createdAt)),
        likes: Number(post && post.likes) || 0,
        likedBy: Array.isArray(post && post.likedBy) ? post.likedBy : [],
        comments: Number(post && post.comments) || 0
    };
}

function normalizeComment(comment) {
    return {
        ...comment,
        id: comment && comment.id ? comment.id : Date.now(),
        postId: comment && comment.postId ? comment.postId : null,
        author: String((comment && comment.author) || "Anonymous"),
        content: String((comment && comment.content) || ""),
        timestamp: resolveIsoDate(comment && comment.timestamp, comment && comment.id)
    };
}

function normalizeNotification(notification) {
    return {
        ...notification,
        id: notification && notification.id ? notification.id : Date.now(),
        content: String((notification && notification.content) || ""),
        type: String((notification && notification.type) || "info"),
        timestamp: resolveIsoDate(notification && notification.timestamp, notification && notification.id),
        read: Boolean(notification && notification.read)
    };
}

function normalizeMessage(message) {
    return {
        ...message,
        id: message && message.id ? message.id : Date.now(),
        senderId: message && message.senderId ? message.senderId : null,
        receiverId: message && message.receiverId ? message.receiverId : null,
        content: String((message && message.content) || ""),
        timestamp: resolveIsoDate(message && message.timestamp, message && message.id),
        read: Boolean(message && message.read)
    };
}

function persistNormalizedData() {
    users = users.map(normalizeUser);
    posts = posts.map(normalizePost);
    comments = comments.map(normalizeComment);
    notifications = notifications.map(normalizeNotification);
    messages = messages.map(normalizeMessage);

    if (currentUser) {
        syncCurrentUserRecord();
    } else {
        localStorage.removeItem("currentUser");
        saveUsers();
    }

    savePosts();
    saveComments();
    saveMessages();
    saveNotifications();
    saveSettingsState();
}

function savePosts() {
    writeLocal("posts", posts);
}

function saveUsers() {
    writeLocal("users", users);
}

function saveComments() {
    writeLocal("comments", comments);
}

function saveNotifications() {
    writeLocal("notifications", notifications);
}

function saveMessages() {
    writeLocal("messages", messages);
}

function saveSettingsState() {
    writeLocal("settings", settings);
}

function saveCurrentUser() {
    if (currentUser) {
        writeLocal("currentUser", currentUser);
    } else {
        localStorage.removeItem("currentUser");
    }
}

function syncCurrentUserRecord() {
    if (!currentUser) {
        return;
    }

    currentUser = normalizeUser(currentUser);
    const index = users.findIndex((user) => user.id === currentUser.id);

    if (index === -1) {
        users.push({ ...currentUser });
    } else {
        users[index] = {
            ...normalizeUser(users[index]),
            ...currentUser,
            followers: [...currentUser.followers],
            following: [...currentUser.following]
        };
    }

    saveUsers();
    saveCurrentUser();
}

function updateUserRecord(user) {
    const normalized = normalizeUser(user);
    const index = users.findIndex((item) => item.id === normalized.id);

    if (index === -1) {
        users.push(normalized);
    } else {
        users[index] = normalized;
    }
}

function getUserById(userId) {
    return users.find((user) => user.id === userId) || null;
}

function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

function escapeHtml(value) {
    const text = String(value == null ? "" : value);
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return text.replace(/[&<>"']/g, (char) => map[char]);
}

function formatCategoryLabel(category) {
    if (!category) {
        return "";
    }

    return category.charAt(0).toUpperCase() + category.slice(1);
}

function renderPostContent(content) {
    return escapeHtml(content)
        .replace(/(^|\s)#(\w+)/g, '$1<span class="hashtag">#$2</span>')
        .replace(/\n/g, "<br>");
}

function requireAuth(message) {
    if (currentUser) {
        return true;
    }

    showAuthModal();
    showToast(message || "Sign in to continue.", "info");
    return false;
}

function setHeaderState() {
    mainHeader.classList.toggle("scrolled", window.scrollY > 12);
}

function getResolvedTheme(mode) {
    if (mode === "auto") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    return mode;
}

function loadTheme() {
    const resolvedTheme = getResolvedTheme(settings.theme);
    document.body.classList.toggle("dark", resolvedTheme === "dark");
    themeToggle.textContent = resolvedTheme === "dark" ? "Light" : "Dark";
    themeToggle.title = settings.theme === "auto"
        ? `Auto theme (${resolvedTheme})`
        : `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`;
    themeToggle.setAttribute("aria-label", themeToggle.title);
}

function toggleTheme() {
    settings.theme = getResolvedTheme(settings.theme) === "dark" ? "light" : "dark";
    saveSettingsState();
    loadTheme();
    showToast(`Theme switched to ${settings.theme}.`, "success");
}

function switchTab(showLogin) {
    loginTab.classList.toggle("active", showLogin);
    signupTab.classList.toggle("active", !showLogin);
    loginForm.style.display = showLogin ? "grid" : "none";
    signupForm.style.display = showLogin ? "none" : "grid";
    loginError.textContent = "";
    signupError.textContent = "";
}

function showAuthModal() {
    switchTab(true);
    authModal.style.display = "flex";
    landingPage.style.display = "none";
    mainContainer.style.display = "none";
    userInfo.style.display = "none";
}

function hideAuthModal() {
    authModal.style.display = "none";
    landingPage.style.display = "none";
    mainContainer.style.display = "block";
    userInfo.style.display = "flex";
    currentUserSpan.textContent = currentUser ? currentUser.name : "";
    loadTheme();
    updateStats();
    updateNotificationsBadge();
    updateDMBadge();
    updateCharCount();
    renderImagePreview();
    loadPosts();
}

function showLandingPage() {
    landingPage.style.display = "block";
    authModal.style.display = "none";
    mainContainer.style.display = "none";
    userInfo.style.display = "none";
    currentUserSpan.textContent = "";
    updateStats();
    renderRecommendations();
}

function closeModals() {
    profileModal.style.display = "none";
    commentsModal.style.display = "none";
    notificationsModal.style.display = "none";
    settingsModal.style.display = "none";
    dmModal.style.display = "none";
    authModal.style.display = "none";
    emojiPicker.style.display = "none";

    if (!currentUser) {
        showLandingPage();
    }
}

function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(
        (item) => item.email.toLowerCase() === normalizedEmail && item.password === password
    );

    if (!user) {
        return false;
    }

    currentUser = normalizeUser(user);
    saveCurrentUser();
    hideAuthModal();
    showToast(`Welcome back, ${currentUser.name}.`, "success");
    return true;
}

function signup(name, email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        return false;
    }

    const newUser = normalizeUser({
        id: Date.now(),
        name,
        email: normalizedEmail,
        password,
        avatar: name.charAt(0).toUpperCase(),
        joined: new Date().toISOString(),
        followers: [],
        following: []
    });

    users.push(newUser);
    saveUsers();
    currentUser = { ...newUser };
    saveCurrentUser();
    hideAuthModal();
    showToast(`Account created for ${currentUser.name}.`, "success");
    return true;
}

function logout() {
    currentUser = null;
    saveCurrentUser();
    closeModals();
    showLandingPage();
    showToast("You have been logged out.", "info");
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${escapeHtml(type)}`;
    toast.textContent = message;
    toastStack.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3200);
}

function addNotification(content, type = "info", persist = true) {
    if (persist) {
        notifications.unshift(
            normalizeNotification({
                id: Date.now(),
                content,
                type,
                timestamp: new Date().toISOString(),
                read: false
            })
        );
        saveNotifications();
        updateNotificationsBadge();
    }

    showToast(content, type);
}

function updateStats() {
    totalUsersEl.textContent = users.length.toLocaleString();
    totalPostsEl.textContent = posts.length.toLocaleString();
    totalLikesEl.textContent = posts.reduce((sum, post) => sum + (post.likes || 0), 0).toLocaleString();
}

function updateCharCount() {
    const count = postContent.value.length;
    const remaining = 280 - count;
    charCount.textContent = `${count}/280`;
    charCount.style.color = remaining < 25 ? "var(--danger)" : "var(--muted)";

    if (count === 0) {
        draftStatus.textContent = "Draft ready when you are.";
    } else if (count < 80) {
        draftStatus.textContent = "Short and easy to scan.";
    } else if (count < 220) {
        draftStatus.textContent = "Nice balance of depth and readability.";
    } else {
        draftStatus.textContent = "Close to the limit. Tighten if needed.";
    }
}

function renderImagePreview() {
    if (!currentImageData) {
        imagePreview.className = "image-preview empty";
        imagePreview.innerHTML = `
            <div class="image-preview-copy">
                <strong>Media preview</strong>
                <p>Add an image to create a richer post.</p>
            </div>
        `;
        return;
    }

    imagePreview.className = "image-preview";
    imagePreview.innerHTML = `
        <div class="image-preview-top">
            <div class="image-preview-copy">
                <strong>Selected image</strong>
                <p>Your post is ready to publish with media.</p>
            </div>
            <button type="button" class="remove-image" id="removeImageBtn">Remove</button>
        </div>
        <img src="${currentImageData}" alt="Selected post preview" />
    `;
}
function tokenizeContent(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9# ]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}

function extractKeywords(text, limit = 4) {
    const stopWords = new Set([
        "the",
        "and",
        "for",
        "with",
        "this",
        "that",
        "have",
        "from",
        "your",
        "about",
        "into",
        "just",
        "been",
        "they",
        "them",
        "what"
    ]);
    const counts = {};

    tokenizeContent(text).forEach((token) => {
        if (!stopWords.has(token) && token.length > 3 && !token.startsWith("#")) {
            counts[token] = (counts[token] || 0) + 1;
        }
    });

    return Object.entries(counts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, limit)
        .map(([word]) => word);
}

function analyzeDraftContent(content, category) {
    const positiveWords = new Set([
        "amazing",
        "awesome",
        "build",
        "celebrate",
        "excited",
        "good",
        "great",
        "happy",
        "helpful",
        "insight",
        "learn",
        "love",
        "smart",
        "success",
        "win"
    ]);
    const negativeWords = new Set([
        "angry",
        "bad",
        "broken",
        "fail",
        "frustrated",
        "issue",
        "problem",
        "sad",
        "stuck",
        "stress",
        "tired"
    ]);

    const tokens = tokenizeContent(content);
    const keywords = extractKeywords(content, 5);
    const positiveHits = tokens.filter((token) => positiveWords.has(token)).length;
    const negativeHits = tokens.filter((token) => negativeWords.has(token)).length;
    const sentimentScore = (positiveHits - negativeHits) / Math.max(positiveHits + negativeHits, 1);
    const sentiment = sentimentScore > 0.2 ? "Positive" : sentimentScore < -0.2 ? "Negative" : "Neutral";
    const inferredCategory = category || (
        keywords.some((word) => ["code", "ai", "ml", "data", "python", "app"].includes(word))
            ? "tech"
            : "general"
    );
    const engagement = Math.max(
        25,
        Math.min(
            99,
            Math.round(
                48 +
                positiveHits * 7 -
                negativeHits * 5 +
                (content.includes("?") ? 10 : 0) +
                Math.min(content.length / 10, 24)
            )
        )
    );
    const hashtags = [`#${inferredCategory}`, ...keywords.slice(0, 4).map((word) => `#${word}`)].filter(
        (tag, index, array) => array.indexOf(tag) === index
    );

    let tip = "Add a short question or call to action at the end to encourage replies.";
    if (negativeHits > positiveHits) {
        tip = "Try softening the tone and adding a practical takeaway to make the post feel more constructive.";
    } else if (content.length > 160) {
        tip = "This draft has good depth. Break one sentence into two if you want it to scan faster on mobile.";
    }

    return {
        sentiment,
        engagement,
        category: inferredCategory,
        hashtags,
        summary: keywords.length
            ? `Your draft focuses on ${keywords.slice(0, 3).join(", ")}.`
            : "Your draft is ready for AI-assisted improvements.",
        tip
    };
}

function renderAIInsights(analysis) {
    currentAIAnalysis = analysis;
    aiSentiment.textContent = analysis.sentiment;
    aiEngagement.textContent = `${analysis.engagement}/100`;
    aiCategory.textContent = analysis.category;
    aiSummary.textContent = analysis.summary;
    aiTip.textContent = analysis.tip;
    aiHashtags.innerHTML = "";

    analysis.hashtags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "ai-chip";
        chip.textContent = tag;
        aiHashtags.appendChild(chip);
    });
}

function buildInterestProfile() {
    if (!currentUser) {
        return [];
    }

    const signals = [];

    posts.forEach((post) => {
        if (
            post.userId === currentUser.id ||
            currentUser.following.includes(post.userId) ||
            post.likedBy.includes(currentUser.id)
        ) {
            signals.push(post.content);
            if (post.category) {
                signals.push(post.category);
            }
        }
    });

    if (!signals.length) {
        signals.push(currentUser.name);
    }

    return extractKeywords(signals.join(" "), 8);
}

function getRecommendedPosts() {
    if (!currentUser) {
        return [];
    }

    const interests = buildInterestProfile();

    return posts
        .filter((post) => post.userId !== currentUser.id)
        .map((post) => {
            const keywords = extractKeywords(post.content, 6);
            const overlap = keywords.filter((keyword) => interests.includes(keyword));
            const followingBoost = currentUser.following.includes(post.userId) ? 18 : 0;
            const popularityBoost = (post.likes || 0) * 3 + (post.comments || 0) * 2;
            const categoryBoost = post.category && interests.includes(post.category) ? 10 : 0;
            const score = overlap.length * 15 + followingBoost + popularityBoost + categoryBoost;
            const reasons = [];

            if (overlap.length) {
                reasons.push(`Matches your interests: ${overlap.slice(0, 3).join(", ")}`);
            }
            if (followingBoost) {
                reasons.push("From someone in your network");
            }
            if (popularityBoost) {
                reasons.push("Strong community engagement");
            }
            if (!reasons.length) {
                reasons.push("Fresh post worth discovering");
            }

            return { ...post, score, reasons };
        })
        .sort((left, right) => right.score - left.score)
        .slice(0, 4);
}

function renderRecommendations() {
    if (!currentUser) {
        aiInsightStatus.textContent = "Sign in to activate personalized recommendations.";
        recommendedFeed.innerHTML = "";
        return;
    }

    const recommendations = getRecommendedPosts();
    aiInsightStatus.textContent = recommendations.length
        ? "Recommendations update as you post, like, and follow."
        : "Create a few posts or follow people to train your recommendation feed.";
    recommendedFeed.innerHTML = "";

    if (!recommendations.length) {
        recommendedFeed.appendChild(
            createEmptyState(
                "No recommendations yet",
                "Interact with the feed to help the recommendation engine learn what you care about."
            )
        );
        return;
    }

    recommendations.forEach((post) => {
        const card = document.createElement("div");
        card.className = "recommended-card";
        card.innerHTML = `
            <div class="recommended-meta">
                <strong>${escapeHtml(post.username)}</strong>
                <span>Score ${post.score}</span>
            </div>
            <p>${escapeHtml(post.content)}</p>
            <div class="recommended-reasons">
                ${post.reasons.map((reason) => `<span class="recommended-reason">${escapeHtml(reason)}</span>`).join("")}
            </div>
        `;
        recommendedFeed.appendChild(card);
    });
}

function createEmptyState(title, description) {
    const state = document.createElement("div");
    state.className = "empty-state";
    state.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p>`;
    return state;
}

function createPostElement(post) {
    const postDiv = document.createElement("article");
    const isLiked = currentUser ? post.likedBy.includes(currentUser.id) : false;
    const isFollowing = currentUser ? currentUser.following.includes(post.userId) : false;
    const showFollowBtn = currentUser && post.userId !== currentUser.id && !isFollowing;
    const categoryTags = post.category
        ? `<div class="post-categories"><span class="category-tag">${escapeHtml(formatCategoryLabel(post.category))}</span></div>`
        : "";
    const imageHtml = post.image
        ? `<div class="post-image"><img src="${post.image}" alt="Post image" /></div>`
        : "";

    postDiv.className = "post";
    postDiv.dataset.id = post.id;
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="avatar">${escapeHtml(post.username.charAt(0).toUpperCase())}</div>
            <div class="user-info">
                <div class="user" data-user-id="${post.userId}">${escapeHtml(post.username)}</div>
                <div class="timestamp">${formatTime(new Date(post.createdAt))}</div>
            </div>
            ${showFollowBtn ? `<button class="follow-btn" data-user-id="${post.userId}">Follow</button>` : ""}
        </div>
        ${categoryTags}
        <div class="content">${renderPostContent(post.content)}</div>
        ${imageHtml}
        <div class="post-actions">
            <div class="post-action-group">
                <button class="like-btn ${isLiked ? "liked" : ""}" data-id="${post.id}">Like <span class="like-count">${post.likes || 0}</span></button>
                <button class="comment-btn" data-id="${post.id}">Comment <span class="comment-count">${post.comments || 0}</span></button>
                <button class="share-btn" data-id="${post.id}">Share</button>
            </div>
            ${currentUser && post.userId === currentUser.id ? `<button class="delete-btn" data-id="${post.id}">Delete</button>` : ""}
        </div>
    `;
    return postDiv;
}

function updateFeedSummary(visibleCount) {
    const filterLabel = currentFeedFilter === "following"
        ? "following"
        : currentFeedFilter === "trending"
            ? "trending"
            : "all";

    feedSummary.textContent = `${visibleCount} post${visibleCount === 1 ? "" : "s"} visible in ${filterLabel}.`;
}

function updateSearchSummary(query, visibleCount) {
    if (query) {
        searchSummary.textContent = `${visibleCount} result${visibleCount === 1 ? "" : "s"} for "${query}".`;
        return;
    }

    if (currentFeedFilter === "following") {
        searchSummary.textContent = "Posts from your network and your own updates only.";
    } else if (currentFeedFilter === "trending") {
        searchSummary.textContent = "Popular posts rising through likes and discussion.";
    } else {
        searchSummary.textContent = "Use search, tabs, and sorting to shape the feed around what you want to see.";
    }
}

function sortPostsList(postList) {
    const sorted = [...postList];

    if (sortSelect.value === "oldest") {
        sorted.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
    } else if (sortSelect.value === "popular") {
        sorted.sort((left, right) => (right.likes || 0) - (left.likes || 0) || (right.comments || 0) - (left.comments || 0));
    } else {
        sorted.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    }

    return sorted;
}

function loadPosts() {
    if (!currentUser) {
        feed.innerHTML = "";
        renderRecommendations();
        return;
    }

    let visiblePosts = [...posts];

    if (currentFeedFilter === "following") {
        visiblePosts = visiblePosts.filter(
            (post) => currentUser.following.includes(post.userId) || post.userId === currentUser.id
        );
    } else if (currentFeedFilter === "trending") {
        visiblePosts = visiblePosts.filter((post) => (post.likes || 0) > 0 || (post.comments || 0) > 0);
    }

    const query = searchInput.value.trim().toLowerCase();
    if (query) {
        visiblePosts = visiblePosts.filter((post) => {
            const haystack = `${post.username} ${post.content} ${post.category}`.toLowerCase();
            return haystack.includes(query);
        });
    }

    visiblePosts = sortPostsList(visiblePosts);
    feed.innerHTML = "";

    if (!visiblePosts.length) {
        const title = query ? "No posts match your search" : "The feed is quiet right now";
        const description = query
            ? "Try a broader keyword, clear the search, or switch feed tabs."
            : currentFeedFilter === "following"
                ? "Follow people to make this view more useful."
                : currentFeedFilter === "trending"
                    ? "Posts with likes or comments will show up here."
                    : "Publish the first post to kick things off.";
        feed.appendChild(createEmptyState(title, description));
    } else {
        visiblePosts.forEach((post) => {
            feed.appendChild(createPostElement(post));
        });
    }

    updateFeedSummary(visiblePosts.length);
    updateSearchSummary(query, visiblePosts.length);
    renderRecommendations();
}

function addPost(content) {
    if (!currentUser) {
        return;
    }

    const createdAt = new Date().toISOString();
    const post = normalizePost({
        id: Date.now(),
        userId: currentUser.id,
        username: currentUser.name,
        content,
        category: categorySelect.value,
        image: currentImageData,
        createdAt,
        likes: 0,
        likedBy: [],
        comments: 0
    });

    posts.unshift(post);
    savePosts();
    currentImageData = null;
    currentAIAnalysis = null;
    renderImagePreview();
    loadPosts();
    updateStats();
    addNotification("Your post has been published.", "success");
}

function sharePost(postId) {
    const shareUrl = `${window.location.origin}${window.location.pathname}#post-${postId}`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl)
            .then(() => showToast("Share link copied to clipboard.", "success"))
            .catch(() => showToast(`Share this post: ${shareUrl}`, "info"));
        return;
    }

    showToast(`Share this post: ${shareUrl}`, "info");
}
function showProfileModal(userId = null) {
    if (!requireAuth("Sign in to view profiles.")) {
        return;
    }

    profileUser = userId ? getUserById(userId) : currentUser;
    if (!profileUser) {
        return;
    }

    document.getElementById("profileName").textContent = profileUser.name;
    document.getElementById("profileEmail").textContent = profileUser.email || "Not shared";
    document.getElementById("profileAvatar").textContent = profileUser.avatar;
    document.getElementById("profilePosts").textContent = posts.filter((post) => post.userId === profileUser.id).length;
    document.getElementById("profileLikes").textContent = posts
        .filter((post) => post.userId === profileUser.id)
        .reduce((sum, post) => sum + (post.likes || 0), 0);
    document.getElementById("profileJoined").textContent = new Date(profileUser.joined).toLocaleDateString();
    document.getElementById("followersCount").textContent = profileUser.followers.length;
    document.getElementById("followingCount").textContent = profileUser.following.length;

    const profileActions = document.getElementById("profileActions");
    profileActions.innerHTML = "";

    if (profileUser.id !== currentUser.id) {
        const isFollowing = currentUser.following.includes(profileUser.id);
        const followButton = document.createElement("button");
        followButton.textContent = isFollowing ? "Unfollow" : "Follow";
        followButton.addEventListener("click", () => {
            if (isFollowing) {
                unfollowUser(profileUser.id);
            } else {
                followUser(profileUser.id);
            }
            showProfileModal(profileUser.id);
        });
        profileActions.appendChild(followButton);

        const messageButton = document.createElement("button");
        messageButton.textContent = "Message";
        messageButton.addEventListener("click", () => {
            currentChatUser = profileUser;
            showDMModal();
            openChat(profileUser.id);
            profileModal.style.display = "none";
        });
        profileActions.appendChild(messageButton);
    }

    profileModal.style.display = "flex";
}

function showCommentsModal(postId) {
    if (!requireAuth("Sign in to read and write comments.")) {
        return;
    }

    currentPostId = postId;
    const postComments = comments.filter((comment) => comment.postId === postId);
    const commentsList = document.getElementById("commentsList");
    commentsList.innerHTML = "";

    if (!postComments.length) {
        commentsList.appendChild(
            createEmptyState("No comments yet", "Be the first person to respond to this post.")
        );
    } else {
        postComments
            .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp))
            .forEach((comment) => {
                const commentDiv = document.createElement("div");
                commentDiv.className = "comment";
                commentDiv.innerHTML = `
                    <div class="comment-author">${escapeHtml(comment.author)}</div>
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    <div class="comment-timestamp">${formatTime(new Date(comment.timestamp))}</div>
                `;
                commentsList.appendChild(commentDiv);
            });
    }

    commentsModal.style.display = "flex";
}

function updateNotificationsBadge() {
    const badge = document.getElementById("notificationCount");
    const unreadCount = notifications.filter((notification) => !notification.read).length;

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = "inline-block";
    } else {
        badge.style.display = "none";
    }
}

function showNotificationsModal() {
    if (!requireAuth("Sign in to view notifications.")) {
        return;
    }

    const notificationsList = document.getElementById("notificationsList");
    notificationsList.innerHTML = "";

    if (!notifications.length) {
        notificationsList.appendChild(
            createEmptyState("All clear", "New notifications will show up here when activity happens.")
        );
    } else {
        notifications.forEach((notification) => {
            const notificationDiv = document.createElement("div");
            notificationDiv.className = `notification ${notification.read ? "" : "unread"}`;
            notificationDiv.innerHTML = `
                <div class="notification-content">${escapeHtml(notification.content)}</div>
                <div class="notification-time">${formatTime(new Date(notification.timestamp))}</div>
            `;
            notificationDiv.addEventListener("click", () => markAsRead(notification.id));
            notificationsList.appendChild(notificationDiv);
        });
    }

    notificationsModal.style.display = "flex";
    updateNotificationsBadge();
}

function showSettingsModal() {
    if (!requireAuth("Sign in to adjust your settings.")) {
        return;
    }

    document.getElementById("privateProfile").checked = settings.privateProfile;
    document.getElementById("showOnlineStatus").checked = settings.showOnlineStatus;
    document.getElementById("emailNotifications").checked = settings.emailNotifications;
    document.getElementById("pushNotifications").checked = settings.pushNotifications;
    document.getElementById("themeSelect").value = settings.theme;
    settingsModal.style.display = "flex";
}

function markMessagesRead(userId) {
    let hasChanges = false;

    messages = messages.map((message) => {
        if (message.senderId === userId && message.receiverId === currentUser.id && !message.read) {
            hasChanges = true;
            return { ...message, read: true };
        }
        return message;
    });

    if (hasChanges) {
        saveMessages();
        updateDMBadge();
    }
}

function updateDMBadge() {
    const badge = document.getElementById("dmBadge");

    if (!currentUser) {
        badge.style.display = "none";
        return;
    }

    const unreadCount = messages.filter(
        (message) => message.receiverId === currentUser.id && !message.read
    ).length;

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = "inline-block";
    } else {
        badge.style.display = "none";
    }
}

function showDMModal() {
    if (!requireAuth("Sign in to open direct messages.")) {
        return;
    }

    loadConversations();
    dmModal.style.display = "flex";
    updateDMBadge();
}

function loadConversations() {
    const conversationsDiv = document.getElementById("conversations");
    conversationsDiv.innerHTML = "";

    const userConversations = {};

    messages.forEach((message) => {
        if (message.senderId === currentUser.id || message.receiverId === currentUser.id) {
            const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId;
            if (!userConversations[otherUserId]) {
                userConversations[otherUserId] = [];
            }
            userConversations[otherUserId].push(message);
        }
    });

    const conversationIds = Object.keys(userConversations);
    if (!conversationIds.length) {
        conversationsDiv.appendChild(
            createEmptyState("No conversations yet", "Open a profile and start your first message thread.")
        );
        return;
    }

    conversationIds.forEach((userId) => {
        const user = getUserById(Number(userId));
        const chatThread = userConversations[userId].sort(
            (left, right) => new Date(left.timestamp) - new Date(right.timestamp)
        );

        if (!user) {
            return;
        }

        const conversationDiv = document.createElement("div");
        conversationDiv.className = "conversation";
        conversationDiv.dataset.userId = userId;
        conversationDiv.innerHTML = `
            <div class="conversation-avatar">${escapeHtml(user.avatar)}</div>
            <div class="conversation-info">
                <div class="conversation-name">${escapeHtml(user.name)}</div>
                <div class="conversation-last">${escapeHtml(chatThread[chatThread.length - 1].content)}</div>
            </div>
        `;
        conversationDiv.addEventListener("click", () => openChat(userId));
        conversationsDiv.appendChild(conversationDiv);
    });
}

function openChat(userId) {
    currentChatUser = getUserById(Number(userId));

    if (!currentChatUser) {
        return;
    }

    markMessagesRead(currentChatUser.id);
    document.getElementById("chatUserName").textContent = currentChatUser.name;
    document.getElementById("conversationsList").style.display = "block";
    document.getElementById("messagesContainer").style.display = "block";
    if (window.innerWidth < 900) {
        document.getElementById("conversationsList").style.display = "none";
    }
    loadMessages();
}

function loadMessages() {
    const messagesList = document.getElementById("messagesList");
    messagesList.innerHTML = "";

    const chatMessages = messages
        .filter(
            (message) =>
                (message.senderId === currentUser.id && message.receiverId === currentChatUser.id) ||
                (message.senderId === currentChatUser.id && message.receiverId === currentUser.id)
        )
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));

    if (!chatMessages.length) {
        messagesList.appendChild(
            createEmptyState("No messages yet", "Say hello and start the conversation.")
        );
        return;
    }

    chatMessages.forEach((message) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${message.senderId === currentUser.id ? "sent" : "received"}`;
        messageDiv.innerHTML = `
            <div class="message-content">${escapeHtml(message.content)}</div>
            <div class="message-time">${formatTime(new Date(message.timestamp))}</div>
        `;
        messagesList.appendChild(messageDiv);
    });

    messagesList.scrollTop = messagesList.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById("messageInput");
    const content = input.value.trim();

    if (!content || !currentChatUser) {
        return;
    }

    messages.push(
        normalizeMessage({
            id: Date.now(),
            senderId: currentUser.id,
            receiverId: currentChatUser.id,
            content,
            timestamp: new Date().toISOString(),
            read: false
        })
    );
    saveMessages();
    input.value = "";
    loadMessages();
    loadConversations();
    updateDMBadge();
    showToast(`Message sent to ${currentChatUser.name}.`, "message");
}

function markAsRead(notificationId) {
    notifications = notifications.map((notification) => (
        notification.id === notificationId ? { ...notification, read: true } : notification
    ));
    saveNotifications();
    updateNotificationsBadge();
    showNotificationsModal();
}

function clearNotifications() {
    notifications = [];
    saveNotifications();
    document.getElementById("notificationsList").innerHTML = "";
    updateNotificationsBadge();
    showToast("Notifications cleared.", "success");
}

function saveSettings() {
    settings.privateProfile = document.getElementById("privateProfile").checked;
    settings.showOnlineStatus = document.getElementById("showOnlineStatus").checked;
    settings.emailNotifications = document.getElementById("emailNotifications").checked;
    settings.pushNotifications = document.getElementById("pushNotifications").checked;
    settings.theme = document.getElementById("themeSelect").value;

    saveSettingsState();
    loadTheme();
    closeModals();
    showToast("Settings saved successfully.", "success");
}

function addComment() {
    const content = document.getElementById("commentInput").value.trim();

    if (!content || !currentPostId) {
        return;
    }

    comments.push(
        normalizeComment({
            id: Date.now(),
            postId: currentPostId,
            author: currentUser.name,
            content,
            timestamp: new Date().toISOString()
        })
    );
    saveComments();

    const postIndex = posts.findIndex((post) => post.id === currentPostId);
    if (postIndex > -1) {
        posts[postIndex].comments = (posts[postIndex].comments || 0) + 1;
        savePosts();
    }

    document.getElementById("commentInput").value = "";
    showCommentsModal(currentPostId);
    loadPosts();
    addNotification("Your comment has been added.", "success", false);
}

function followUser(userId) {
    if (!currentUser || currentUser.following.includes(userId) || currentUser.id === userId) {
        return;
    }

    currentUser.following = [...currentUser.following, userId];
    syncCurrentUserRecord();

    const targetUser = getUserById(userId);
    if (targetUser && !targetUser.followers.includes(currentUser.id)) {
        targetUser.followers = [...targetUser.followers, currentUser.id];
        updateUserRecord(targetUser);
        saveUsers();
    }

    loadPosts();
    renderRecommendations();
    showToast(`You are now following ${targetUser ? targetUser.name : "this user"}.`, "follow");
}

function unfollowUser(userId) {
    if (!currentUser) {
        return;
    }

    currentUser.following = currentUser.following.filter((followedUserId) => followedUserId !== userId);
    syncCurrentUserRecord();

    const targetUser = getUserById(userId);
    if (targetUser) {
        targetUser.followers = targetUser.followers.filter((followerId) => followerId !== currentUser.id);
        updateUserRecord(targetUser);
        saveUsers();
    }

    loadPosts();
    renderRecommendations();
    showToast(`You unfollowed ${targetUser ? targetUser.name : "this user"}.`, "info");
}

function handleSearch() {
    loadPosts();
}

function filterPosts(filter) {
    currentFeedFilter = filter;
    allPostsTab.classList.toggle("active", filter === "all");
    followingTab.classList.toggle("active", filter === "following");
    trendingTab.classList.toggle("active", filter === "trending");
    loadPosts();
}

function sortPosts() {
    loadPosts();
}

function toggleEmojiPicker() {
    const rect = emojiBtn.getBoundingClientRect();
    emojiPicker.style.left = `${Math.max(12, rect.left)}px`;
    emojiPicker.style.top = `${rect.bottom + 8}px`;
    emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
}
feed.addEventListener("click", (event) => {
    const actionButton = event.target.closest("button");
    const userTrigger = event.target.closest(".user");
    const hashtagTrigger = event.target.closest(".hashtag");

    if (actionButton) {
        const postId = Number(actionButton.dataset.id);
        const postIndex = posts.findIndex((post) => post.id === postId);
        const post = posts[postIndex];

        if (actionButton.classList.contains("like-btn") && post && currentUser) {
            const likedIndex = post.likedBy.indexOf(currentUser.id);

            if (likedIndex > -1) {
                post.likes = Math.max(0, post.likes - 1);
                post.likedBy.splice(likedIndex, 1);
                showToast("Like removed.", "info");
            } else {
                post.likes += 1;
                post.likedBy.push(currentUser.id);
                showToast(`You liked a post by ${post.username}.`, "like");
            }

            savePosts();
            updateStats();
            loadPosts();
            return;
        }

        if (actionButton.classList.contains("comment-btn")) {
            showCommentsModal(postId);
            return;
        }

        if (actionButton.classList.contains("share-btn")) {
            sharePost(postId);
            return;
        }

        if (actionButton.classList.contains("delete-btn") && post) {
            if (window.confirm("Are you sure you want to delete this post?")) {
                posts.splice(postIndex, 1);
                comments = comments.filter((comment) => comment.postId !== postId);
                savePosts();
                saveComments();
                updateStats();
                loadPosts();
                showToast("Post deleted successfully.", "success");
            }
            return;
        }

        if (actionButton.classList.contains("follow-btn")) {
            followUser(Number(actionButton.dataset.userId));
        }
    }

    if (userTrigger) {
        showProfileModal(Number(userTrigger.dataset.userId));
    }

    if (hashtagTrigger) {
        searchInput.value = hashtagTrigger.textContent;
        loadPosts();
    }
});

postContent.addEventListener("input", updateCharCount);

postForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = postContent.value.trim();

    if (!content) {
        return;
    }

    addPost(content);
    postForm.reset();
    categorySelect.value = "";
    updateCharCount();
    renderImagePreview();
});

loginTab.addEventListener("click", () => switchTab(true));
signupTab.addEventListener("click", () => switchTab(false));

loginBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (login(email, password)) {
        loginError.textContent = "";
    } else {
        loginError.textContent = "Invalid email or password.";
    }
});

signupBtn.addEventListener("click", () => {
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || !password) {
        signupError.textContent = "All fields are required.";
        return;
    }

    if (password.length < 6) {
        signupError.textContent = "Password must be at least 6 characters.";
        return;
    }

    if (signup(name, email, password)) {
        signupError.textContent = "";
    } else {
        signupError.textContent = "Email already exists.";
    }
});

logoutBtn.addEventListener("click", logout);

searchInput.addEventListener("input", handleSearch);
themeToggle.addEventListener("click", toggleTheme);
notificationsBtn.addEventListener("click", showNotificationsModal);
settingsBtn.addEventListener("click", showSettingsModal);
profileBtn.addEventListener("click", () => showProfileModal());
dmBtn.addEventListener("click", showDMModal);
emojiBtn.addEventListener("click", toggleEmojiPicker);

imageBtn.addEventListener("click", () => {
    if (requireAuth("Sign in to add media to posts.")) {
        imageInput.click();
    }
});

imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
        currentImageData = loadEvent.target.result;
        renderImagePreview();
        showToast("Image selected and ready for your post.", "success");
    };
    reader.readAsDataURL(file);
});

imagePreview.addEventListener("click", (event) => {
    if (event.target.id === "removeImageBtn") {
        currentImageData = null;
        imageInput.value = "";
        renderImagePreview();
        showToast("Image removed from draft.", "info");
    }
});

allPostsTab.addEventListener("click", () => filterPosts("all"));
followingTab.addEventListener("click", () => filterPosts("following"));
trendingTab.addEventListener("click", () => filterPosts("trending"));
sortSelect.addEventListener("change", sortPosts);

analyzeDraftBtn.addEventListener("click", () => {
    const content = postContent.value.trim();

    if (!content) {
        showToast("Write something first so the AI can analyze it.", "info");
        return;
    }

    const analysis = analyzeDraftContent(content, categorySelect.value);
    renderAIInsights(analysis);
    aiInsightStatus.textContent = "Draft analyzed successfully.";
    showToast("Draft analysis complete.", "success");
});

useHashtagsBtn.addEventListener("click", () => {
    if (!currentAIAnalysis || !currentAIAnalysis.hashtags.length) {
        showToast("Analyze a draft first to generate hashtag suggestions.", "info");
        return;
    }

    const existingContent = postContent.value.trim();
    const hashtagBlock = currentAIAnalysis.hashtags.join(" ");
    postContent.value = `${existingContent} ${hashtagBlock}`.trim();
    updateCharCount();
    showToast("Suggested hashtags added to your draft.", "success");
});

document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", closeModals);
    closeBtn.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            closeModals();
        }
    });
});

window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
        closeModals();
    }

    if (
        emojiPicker.style.display === "block" &&
        !emojiPicker.contains(event.target) &&
        event.target !== emojiBtn
    ) {
        emojiPicker.style.display = "none";
    }
});

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModals();
    }
});

window.addEventListener("scroll", setHeaderState);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (settings.theme === "auto") {
        loadTheme();
    }
});

document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
document.getElementById("addCommentBtn").addEventListener("click", addComment);
document.getElementById("clearNotificationsBtn").addEventListener("click", clearNotifications);
document.getElementById("changeAvatarBtn").addEventListener("click", () => {
    showToast("Avatar editing is ready for the next upgrade.", "info");
});

document.getElementById("backToConversations").addEventListener("click", () => {
    document.getElementById("messagesContainer").style.display = "none";
    document.getElementById("conversationsList").style.display = "block";
    currentChatUser = null;
});

document.getElementById("sendMessageBtn").addEventListener("click", sendMessage);
document.getElementById("messageInput").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

emojiPicker.addEventListener("click", (event) => {
    if (event.target.tagName === "SPAN") {
        postContent.value += event.target.textContent;
        updateCharCount();
        emojiPicker.style.display = "none";
    }
});

getStartedBtn.addEventListener("click", showAuthModal);
learnMoreBtn.addEventListener("click", () => {
    document.querySelector(".about-creator-section").scrollIntoView({ behavior: "smooth" });
});

loadTheme();
updateCharCount();
renderImagePreview();
updateDMBadge();
updateNotificationsBadge();
updateStats();
setHeaderState();

if (currentUser) {
    hideAuthModal();
} else {
    showLandingPage();
}
