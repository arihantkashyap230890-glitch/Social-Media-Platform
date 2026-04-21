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
const hypeBandTrack = document.getElementById("hypeBandTrack");
const engagementPulseValue = document.getElementById("engagementPulseValue");
const trendVelocityValue = document.getElementById("trendVelocityValue");
const creatorStreakValue = document.getElementById("creatorStreakValue");
const spotlightTopic = document.getElementById("spotlightTopic");
const spotlightDescription = document.getElementById("spotlightDescription");
const launchChallengeBtn = document.getElementById("launchChallengeBtn");

const searchInput = document.getElementById("searchInput");
const exploreBtn = document.getElementById("exploreBtn");
const explorePage = document.getElementById("explorePage");
const exploreSearchInput = document.getElementById("exploreSearchInput");
const exploreGrid = document.getElementById("exploreGrid");
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
const aiClarity = document.getElementById("aiClarity");
const aiReadTime = document.getElementById("aiReadTime");
const aiSummary = document.getElementById("aiSummary");
const aiTip = document.getElementById("aiTip");
const aiStrengths = document.getElementById("aiStrengths");
const aiActions = document.getElementById("aiActions");
const aiRewrite = document.getElementById("aiRewrite");
const aiHashtags = document.getElementById("aiHashtags");
const aiInsightStatus = document.getElementById("aiInsightStatus");
const recommendedFeed = document.getElementById("recommendedFeed");
const applyRewriteBtn = document.getElementById("applyRewriteBtn");
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
const chatbotBtn = document.getElementById("chatbotBtn");
const chatbotModal = document.getElementById("chatbotModal");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const nsfwBtn = document.getElementById("nsfwBtn");
const ageVerificationModal = document.getElementById("ageVerificationModal");
const nsfwModal = document.getElementById("nsfwModal");
const confirm18Plus = document.getElementById("confirm18Plus");
const under18 = document.getElementById("under18");
const nsfwFeed = document.getElementById("nsfwFeed");
const nsfwContent = document.getElementById("nsfwContent");
const postNsfwBtn = document.getElementById("postNsfwBtn");

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

const API_BASE = window.location.origin;
const AI_API_BASE = `${API_BASE}/api/ai`;
const CHATBOT_STARTERS = [
    "How do recommendations work?",
    "Help me improve my current draft",
    "How do I create a post?"
];
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const MOTION_TARGET_SELECTOR = ".hero-copy, .hero-preview, .feature, .about-container, .composer-card, .ai-panel, .feed-shell, .recommended-card, .post, .empty-state";

let revealObserver = null;
let engagementLoop = null;

// Neural Background State
let neuralCanvas, neuralCtx, particles = [];
let neuralAnimationFrame;
let mouse = { x: null, y: null, radius: 150 };

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
        comments: Number(post && post.comments) || 0,
        serverManaged: Boolean(post && post.serverManaged)
    };
}

function normalizeApiPost(post) {
    const author = post && post.author ? post.author : {};
    const likedBy = Array.isArray(post && post.liked_by)
        ? post.liked_by.map((user) => user && user.id).filter(Boolean)
        : Array.isArray(post && post.likedBy)
            ? post.likedBy
            : [];

    return normalizePost({
        id: post && post.id,
        userId: (post && post.author_id) || (author && author.id) || null,
        username: (author && author.username) || (post && post.username) || "Unknown",
        content: (post && post.content) || "",
        category: (post && post.category) || "",
        image: (post && (post.image_url || post.image)) || null,
        createdAt: (post && (post.created_at || post.createdAt)) || new Date().toISOString(),
        likes: Number((post && post.likes_count) || (post && post.likes) || likedBy.length || 0),
        likedBy,
        comments: Number((post && post.comments_count) || (Array.isArray(post && post.comments) ? post.comments.length : 0)),
        serverManaged: true
    });
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

function ensureRevealObserver() {
    if (reduceMotionQuery.matches || revealObserver) {
        return;
    }

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px"
    });
}

function queueMotionTarget(element, index = 0) {
    if (!element) {
        return;
    }

    element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 420)}ms`);

    if (reduceMotionQuery.matches) {
        element.classList.add("is-visible");
        return;
    }

    element.classList.add("reveal-on-scroll");
    ensureRevealObserver();
    revealObserver.observe(element);

    // Apply floating animation to key landing page visuals
    if (element.matches(".hero-preview, .recommended-card, .feature-image")) {
        element.style.animation = `float ${3 + Math.random() * 2}s ease-in-out infinite alternate`;
    }
}

function refreshMotionTargets(scope = document) {
    const targets = scope.querySelectorAll
        ? scope.querySelectorAll(MOTION_TARGET_SELECTOR)
        : [];

    targets.forEach((element, index) => {
        if (element.dataset.motionReady === "true") {
            return;
        }

        element.dataset.motionReady = "true";
        queueMotionTarget(element, index % 7);
    });
}

function animateCount(element, nextValue) {
    if (!element) {
        return;
    }

    const safeValue = Number(nextValue) || 0;
    const previousValue = Number(element.dataset.value || 0);

    if (reduceMotionQuery.matches || previousValue === safeValue) {
        element.textContent = safeValue.toLocaleString();
        element.dataset.value = String(safeValue);
        return;
    }

    const duration = 650;
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(previousValue + (safeValue - previousValue) * eased);
        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
            window.requestAnimationFrame(step);
            return;
        }

        element.textContent = safeValue.toLocaleString();
        element.dataset.value = String(safeValue);
    }

    window.requestAnimationFrame(step);
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
    window.requestAnimationFrame(() => refreshMotionTargets(mainContainer));
    stopNeuralBackground();
    window.removeEventListener("scroll", handleLandingParallax);
}

/**
 * Handles parallax and depth effects for landing page elements
 */
function handleLandingParallax() {
    if (landingPage.style.display === "none") return;
    const scrolled = window.scrollY;
    
    const heroPreview = landingPage.querySelector(".hero-preview");
    const heroCopy = landingPage.querySelector(".hero-copy");

    if (heroPreview) {
        heroPreview.style.transform = `translateY(${scrolled * 0.15}px)`;
    }
    if (heroCopy) {
        heroCopy.style.transform = `translateY(${scrolled * 0.05}px)`;
        heroCopy.style.opacity = Math.max(0, 1 - scrolled / 600);
    }
}

function showLandingPage() {
    landingPage.style.display = "block";
    authModal.style.display = "none";
    mainContainer.style.display = "none";
    explorePage.style.display = "none";
    userInfo.style.display = "none";
    currentUserSpan.textContent = "";
    updateStats();
    renderRecommendations();
    window.requestAnimationFrame(() => refreshMotionTargets(landingPage));
    initNeuralBackground();
    window.addEventListener("scroll", handleLandingParallax, { passive: true });
}

function showExplorePage() {
    if (!explorePage) return;
    explorePage.style.display = "block";
    authModal.style.display = "none";
    landingPage.style.display = "none";
    loadExploreGrid();
    explorePage.scrollIntoView({ behavior: "smooth" });
}

function loadExploreGrid() {
    if (!exploreGrid) return;

    const query = exploreSearchInput?.value.trim().toLowerCase() || "";
    const sampleCards = posts.length > 0 ? posts.slice(0, 12).map((post) => ({
        title: post.username || "Community post",
        description: post.content.slice(0, 120),
        category: post.category || "general"
    })) : [
        { title: "Meet the community", description: "Explore trending topics, AI advice, and meaningful conversations.", category: "general" },
        { title: "AI Studio tips", description: "Get writing help, hashtags, and draft coaching from your assistant.", category: "tech" },
        { title: "Creator stories", description: "Discover simple ways to share more thoughtful posts with clarity.", category: "lifestyle" }
    ];

    const filtered = sampleCards.filter((item) => {
        if (!query) return true;
        return `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query);
    });

    exploreGrid.innerHTML = filtered.map((item) => `
        <article class="explore-card">
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.description)}</p>
            <span class="explore-tag">${escapeHtml(item.category)}</span>
        </article>
    `).join("");
}

function closeModals() {
    profileModal.style.display = "none";
    commentsModal.style.display = "none";
    notificationsModal.style.display = "none";
    settingsModal.style.display = "none";
    dmModal.style.display = "none";
    authModal.style.display = "none";
    chatbotModal.style.display = "none";
    ageVerificationModal.style.display = "none";
    nsfwModal.style.display = "none";
    emojiPicker.style.display = "none";

    if (!currentUser) {
        showLandingPage();
    } else {
        stopNeuralBackground();
        window.removeEventListener("scroll", handleLandingParallax);
    }
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        const token = data.access_token;
        const user = data.user;

        // Store token
        localStorage.setItem('access_token', token);

        currentUser = {
            id: user.id,
            name: user.full_name || user.username,
            email: user.email,
            username: user.username,
            avatar: user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase(),
            joined: user.created_at,
            is_admin: user.is_admin || false,
            followers: [],
            following: []
        };

        syncCurrentUserRecord();
        saveCurrentUser();
        hideAuthModal();
        showToast(`Welcome back, ${currentUser.name}.`, "success");
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

async function signup(username, name, email, password) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                full_name: name,
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            return false;
        }

        const user = await response.json();

        // Auto-login after signup
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const token = loginData.access_token;
            localStorage.setItem('access_token', token);

            currentUser = {
                id: user.id,
                name: user.full_name || user.username,
                email: user.email,
                username: user.username,
                avatar: user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase(),
                joined: user.created_at,
                is_admin: user.is_admin || false,
                followers: [],
                following: []
            };

            syncCurrentUserRecord();
            saveCurrentUser();
            hideAuthModal();
            showToast(`Account created for ${currentUser.name}.`, "success");
            return true;
        }

        return false;
    } catch (error) {
        console.error('Signup error:', error);
        return false;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('access_token');
    saveCurrentUser();
    closeModals();
    showLandingPage();
    showToast("You have been logged out.", "info");
}

async function deletePost(postId) {
    try {
        const post = posts.find((item) => item.id === postId);
        const isLocalOnlyPost = post && !post.serverManaged;

        if (isLocalOnlyPost) {
            posts = posts.filter(p => p.id !== postId);
            comments = comments.filter(c => c.postId !== postId);
            savePosts();
            saveComments();
            updateStats();
            loadPosts();
            showToast("Post deleted successfully.", "success");
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            showToast("You must be logged in to delete server posts.", "error");
            return;
        }

        let confirmationToken = null;
        if (!currentUser.is_admin) {
            confirmationToken = await requestConfirmationToken("delete_post", postId);
            if (!confirmationToken) {
                showToast("Could not confirm the delete action.", "error");
                return;
            }
        }

        const endpoint = currentUser.is_admin ? `${API_BASE}/api/posts/${postId}` : `${API_BASE}/api/posts/${postId}/user`;
        
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: currentUser.is_admin ? null : JSON.stringify({
                confirmation_token: confirmationToken
            })
        });

        if (response.ok) {
            posts = posts.filter(p => p.id !== postId);
            comments = comments.filter(c => c.postId !== postId);
            savePosts();
            saveComments();
            updateStats();
            loadPosts();
            showToast("Post deleted successfully.", "success");
        } else {
            const error = await response.json().catch(() => ({ detail: "Unknown error" }));
            showToast(`Failed to delete post: ${error.detail || 'Unknown error'}`, "error");
        }
    } catch (error) {
        console.error('Delete post error:', error);
        showToast("Failed to delete post.", "error");
    }
}

async function requestConfirmationToken(action, resourceId) {
    const token = localStorage.getItem("access_token");
    if (!token) {
        return null;
    }

    const response = await fetch(`${API_BASE}/api/auth/confirm-action`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action,
            resource_id: resourceId
        })
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.confirmation_token || null;
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
    animateCount(totalUsersEl, users.length);
    animateCount(totalPostsEl, posts.length);
    animateCount(totalLikesEl, posts.reduce((sum, post) => sum + (post.likes || 0), 0));
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
    return String(text || "")
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

function vectorizeKeywords(text, limit = 8) {
    const counts = {};

    extractKeywords(text, limit * 2).forEach((word) => {
        counts[word] = (counts[word] || 0) + 1;
    });

    tokenizeContent(text).forEach((token) => {
        if (token.length > 3 && !token.startsWith("#")) {
            counts[token] = (counts[token] || 0) + 1;
        }
    });

    return Object.entries(counts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, limit)
        .reduce((vector, [word, count]) => {
            vector[word] = count;
            return vector;
        }, {});
}

function normalizeVectorMap(vector) {
    const magnitude = Math.sqrt(Object.values(vector).reduce((sum, value) => sum + value * value, 0));
    return magnitude || 1;
}

function computeKeywordSimilarity(profile, vector) {
    const overlapScore = Object.entries(vector).reduce((sum, [word, weight]) => {
        return sum + ((profile[word] || 0) * weight);
    }, 0);

    return overlapScore / (normalizeVectorMap(profile) * normalizeVectorMap(vector));
}

function detectCategoryFromKeywords(category, keywords) {
    if (category) {
        return category;
    }

    const keywordSet = new Set(keywords);
    const categoryHints = {
        tech: ["ai", "analytics", "app", "api", "build", "cloud", "code", "data", "dbms", "ml", "python", "software", "tech"],
        news: ["announce", "breaking", "headline", "launch", "news", "release", "update"],
        lifestyle: ["daily", "health", "home", "journey", "life", "mindset", "routine", "travel", "wellness"],
        general: ["community", "idea", "people", "share", "story", "thought"]
    };

    return Object.entries(categoryHints)
        .map(([label, hints]) => ({
            label,
            score: hints.filter((hint) => keywordSet.has(hint)).length
        }))
        .sort((left, right) => right.score - left.score)[0]?.label || "general";
}

function buildRewrite(content, category, hasCallToAction) {
    const cleaned = content.replace(/\s+/g, " ").trim();
    if (!cleaned) {
        return "";
    }

    const leadMap = {
        tech: "Quick build update:",
        news: "Quick update:",
        lifestyle: "Small life note:",
        general: "Thought for today:"
    };
    const hasHook = /^(quick|thought|small|update|today|here)\b/i.test(cleaned);
    let rewritten = hasHook ? cleaned : `${leadMap[category] || leadMap.general} ${cleaned}`;

    if (!/[.!?]$/.test(rewritten)) {
        rewritten += ".";
    }

    if (!hasCallToAction) {
        const ctaMap = {
            tech: "What would you improve next?",
            news: "What stands out to you most?",
            lifestyle: "Would you try something similar?",
            general: "What do you think?"
        };
        rewritten = `${rewritten} ${ctaMap[category] || ctaMap.general}`;
    }

    if (rewritten.length > 280) {
        rewritten = `${rewritten.slice(0, 277).replace(/[ ,.;:]+$/, "")}...`;
    }

    return rewritten;
}

function buildLocalDraftAnalysis(content, category) {
    const positiveWords = new Set([
        "amazing",
        "awesome",
        "build",
        "celebrate",
        "clear",
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
        "confused",
        "fail",
        "frustrated",
        "issue",
        "problem",
        "sad",
        "slow",
        "stuck",
        "stress",
        "tired",
        "unclear"
    ]);
    const ctaWords = new Set([
        "comment",
        "drop",
        "let",
        "reply",
        "share",
        "tell",
        "thoughts",
        "vote",
        "what",
        "which"
    ]);

    const tokens = tokenizeContent(content);
    const keywords = extractKeywords(content, 5);
    const positiveHits = tokens.filter((token) => positiveWords.has(token)).length;
    const negativeHits = tokens.filter((token) => negativeWords.has(token)).length;
    const sentimentScore = (positiveHits - negativeHits) / Math.max(positiveHits + negativeHits, 1);
    const sentiment = sentimentScore > 0.2 ? "Positive" : sentimentScore < -0.2 ? "Negative" : "Neutral";
    const inferredCategory = detectCategoryFromKeywords(category, keywords);
    const sentences = content.trim()
        ? content.trim().split(/(?<=[.!?])\s+/).filter(Boolean)
        : [];
    const averageSentenceLength = tokens.length / Math.max(sentences.length || 1, 1);
    const uniqueRatio = new Set(tokens).size / Math.max(tokens.length, 1);
    const hasCallToAction = content.includes("?") || tokens.some((token) => ctaWords.has(token)) || content.toLowerCase().includes("let me know");
    const engagement = Math.max(
        20,
        Math.min(
            100,
            Math.round(
                34 +
                positiveHits * 7 -
                negativeHits * 5 +
                (content.includes("?") ? 10 : 0) +
                (hasCallToAction ? 8 : 0) +
                Math.min(content.length / 14, 18) +
                (sentences.length >= 1 && sentences.length <= 3 ? 6 : 0)
            )
        )
    );
    const clarity = Math.max(
        32,
        Math.min(
            98,
            Math.round(
                88 -
                Math.max(averageSentenceLength - 16, 0) * 2.3 -
                (content.length > 320 ? 10 : 0) -
                (content.length < 35 ? 7 : 0) +
                uniqueRatio * 10 +
                (/[.!?]/.test(content) ? 4 : -4)
            )
        )
    );
    const hashtags = [`#${inferredCategory}`, ...keywords.slice(0, 4).map((word) => `#${word}`)].filter(
        (tag, index, array) => array.indexOf(tag) === index
    );
    const strengths = [];
    const actions = [];

    if (sentimentScore > 0.15) {
        strengths.push("The tone feels upbeat and approachable.");
    }
    if (clarity >= 78) {
        strengths.push("The message is clear enough to scan quickly.");
    }
    if (keywords.length) {
        strengths.push(`Your main focus comes through in ${keywords.slice(0, 3).join(", ")}.`);
    }
    if (hasCallToAction) {
        strengths.push("You already have a conversation-friendly hook.");
    }
    if (content.length >= 80) {
        strengths.push("There is enough detail here to feel useful.");
    }

    if (content.length < 80) {
        actions.push("Add one concrete detail, example, or result.");
    }
    if (clarity < 72) {
        actions.push("Shorten one sentence so the point lands faster.");
    }
    if (negativeHits > positiveHits) {
        actions.push("Shift toward a constructive takeaway instead of staying on the problem.");
    }
    if (!hasCallToAction) {
        actions.push("End with a question to invite replies.");
    }
    if (content.length > 220) {
        actions.push("Trim a few words so the strongest point appears earlier.");
    }
    if (!strengths.length) {
        strengths.push("The draft already has a clear starting point to build on.");
    }
    if (!actions.length) {
        actions.push("You can publish this as is or add one short call to action.");
    }

    const tip = actions[0];
    const readTime = Math.max(15, Math.round((tokens.length / 190) * 60));
    const rewrite = buildRewrite(content, inferredCategory, hasCallToAction);

    return {
        sentiment,
        sentimentScore,
        engagement,
        category: inferredCategory,
        hashtags,
        summary: keywords.length
            ? `This draft centers on ${keywords.slice(0, 3).join(", ")} and should work best in ${inferredCategory}.`
            : "Your draft is ready for AI-assisted improvements.",
        tip,
        clarity,
        readTime,
        strengths: strengths.slice(0, 4),
        actions: actions.slice(0, 4),
        rewrite,
        source: "local"
    };
}

function normalizeAnalysisResponse(data) {
    const sentiment = String(data?.sentiment || "neutral");
    const recommendedCategory = String(data?.recommended_category || data?.category || "general");
    const suggestedHashtags = Array.isArray(data?.suggested_hashtags)
        ? data.suggested_hashtags
        : Array.isArray(data?.hashtags)
            ? data.hashtags
            : [];

    return {
        sentiment: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
        sentimentScore: Number(data?.sentiment_score ?? data?.sentimentScore ?? 0),
        engagement: Math.round(Number(data?.engagement_score ?? data?.engagement ?? 0)),
        category: recommendedCategory,
        hashtags: suggestedHashtags,
        summary: String(data?.summary || "Your draft is ready for AI-assisted improvements."),
        tip: String(data?.improvement_tip || data?.tip || "Add a short call to action at the end."),
        clarity: Math.round(Number(data?.clarity_score ?? data?.clarity ?? 0)),
        readTime: Math.max(0, Math.round(Number(data?.estimated_read_time_seconds ?? data?.readTime ?? 0))),
        strengths: Array.isArray(data?.strengths) ? data.strengths : [],
        actions: Array.isArray(data?.action_items)
            ? data.action_items
            : Array.isArray(data?.actions)
                ? data.actions
                : [],
        rewrite: String(data?.rewritten_draft || data?.rewrite || ""),
        source: data?.source || "server"
    };
}

function renderAIList(container, items, fallback) {
    container.innerHTML = "";

    (items.length ? items : [fallback]).forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        container.appendChild(listItem);
    });
}

function resetAIInsights() {
    currentAIAnalysis = null;
    aiSentiment.textContent = "Waiting for analysis";
    aiEngagement.textContent = "0";
    aiCategory.textContent = "general";
    aiClarity.textContent = "0";
    aiReadTime.textContent = "0s";
    aiSummary.textContent = "Write a draft and run analysis to see AI-generated insights here.";
    aiTip.textContent = "Tips will appear after analysis.";
    aiRewrite.textContent = "Analyze a draft to generate a stronger rewrite.";
    aiHashtags.innerHTML = "";
    renderAIList(aiStrengths, [], "Your strongest points will show up here.");
    renderAIList(aiActions, [], "Actionable coaching will appear after analysis.");
    applyRewriteBtn.disabled = true;
}

async function requestDraftAnalysis(content, category) {
    const fallback = buildLocalDraftAnalysis(content, category);

    try {
        const response = await fetch(`${AI_API_BASE}/analyze-draft`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content,
                category: category || null,
                goal: "engagement"
            })
        });

        if (!response.ok) {
            throw new Error(`Draft analysis failed with ${response.status}`);
        }

        return {
            ...normalizeAnalysisResponse(await response.json()),
            source: "server"
        };
    } catch (error) {
        console.error("Draft analysis fallback:", error);
        return fallback;
    }
}

function renderAIInsights(analysis) {
    currentAIAnalysis = analysis;
    
    // Advanced Visualization Injection
    aiSentiment.innerHTML = `<span class="sentiment-badge ${analysis.sentiment.toLowerCase()}">${analysis.sentiment}</span>`;
    aiEngagement.innerHTML = createGaugeSVG(analysis.engagement, "engagement-gauge");
    aiClarity.innerHTML = createGaugeSVG(analysis.clarity, "clarity-gauge");
    
    aiCategory.textContent = formatCategoryLabel(analysis.category);
    aiReadTime.textContent = `${analysis.readTime}s`;

    renderTypewriterEffect(aiSummary, analysis.summary);
    renderTypewriterEffect(aiTip, analysis.tip);
    aiRewrite.textContent = analysis.rewrite || "Awaiting neural processing...";
    
    aiHashtags.innerHTML = "";
    renderAIList(aiStrengths, analysis.strengths || [], "Your strongest points will show up here.");
    renderAIList(aiActions, analysis.actions || [], "Actionable coaching will appear after analysis.");
    applyRewriteBtn.disabled = !analysis.rewrite;

    analysis.hashtags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "ai-chip";
        chip.textContent = tag;
        aiHashtags.appendChild(chip);
    });
}

function renderTypewriterEffect(element, text) {
    element.textContent = "";
    let i = 0;
    const speed = 15;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Chatbot functions
function showChatbotModal() {
    chatbotModal.style.display = "flex";
    chatMessages.innerHTML = "";
    addChatMessage(
        "Hello! I can help with posting, AI Studio, recommendations, inbox, and improving the draft in your composer.",
        false,
        { suggestions: CHATBOT_STARTERS }
    );
    chatInput.focus();
}

function closeChatbotModal() {
    chatbotModal.style.display = "none";
    chatInput.value = "";
}

function addChatMessage(message, isUser = false, options = {}) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${isUser ? "user" : "bot"}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);

    if (!isUser && Array.isArray(options.suggestions) && options.suggestions.length) {
        const suggestionsRow = document.createElement("div");
        suggestionsRow.className = "chat-suggestions";

        options.suggestions.slice(0, 3).forEach((suggestion) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chat-suggestion";
            button.textContent = suggestion;
            button.addEventListener("click", () => {
                chatInput.value = suggestion;
                sendChatMessage();
            });
            suggestionsRow.appendChild(button);
        });

        chatMessages.appendChild(suggestionsRow);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getChatbotResponse(question) {
    const q = question.toLowerCase().trim();
    const activeDraft = postContent.value.trim();

    if (activeDraft && /(draft|rewrite|improve|caption|post help)/.test(q)) {
        const analysis = buildLocalDraftAnalysis(activeDraft, categorySelect.value);
        return {
            response: `Your draft looks ${analysis.sentiment.toLowerCase()} with clarity at ${analysis.clarity}/100. ${analysis.tip}`,
            suggestions: [
                "Use the rewrite from AI Studio",
                "How do recommendations work?",
                "How do I create a post?"
            ],
            draftInsights: analysis,
            source: "local"
        };
    }

    if ((q.includes("draft") || q.includes("rewrite") || q.includes("improve")) && !activeDraft) {
        return {
            response: "Write something in the composer first, then ask me to improve your draft and I will coach it.",
            suggestions: CHATBOT_STARTERS,
            source: "local"
        };
    }

    if (q.includes("what") && q.includes("connect hub")) {
        return {
            response: "Connect Hub is a social platform focused on thoughtful sharing, clean discovery, and built-in AI help for drafting, rewrites, hashtags, and recommendations.",
            suggestions: CHATBOT_STARTERS,
            source: "local"
        };
    }

    if (q.includes("how") && (q.includes("sign up") || q.includes("login") || q.includes("account"))) {
        return {
            response: "Click Join the Community to create an account, then sign in with your email and password to unlock posting, following, and personalized features.",
            suggestions: ["How do I create a post?", "What can AI Studio do?", "How do recommendations work?"],
            source: "local"
        };
    }

    if (q.includes("ai") || q.includes("studio")) {
        return {
            response: "AI Studio analyzes tone, clarity, engagement potential, hashtags, and a suggested rewrite so you can polish a post before publishing.",
            suggestions: ["Help me improve my current draft", "How do recommendations work?", "How do I create a post?"],
            source: "local"
        };
    }

    if (q.includes("post") || q.includes("create") || q.includes("publish")) {
        return {
            response: "Use the composer on the left to write a post, choose a category, optionally add an image, run Analyze Draft if you want AI guidance, and then publish.",
            suggestions: ["What can AI Studio do?", "How do recommendations work?", "Help me improve my current draft"],
            source: "local"
        };
    }

    if (q.includes("recommend") || q.includes("personalized") || q.includes("for you")) {
        return {
            response: "Recommendations learn from what you write, like, and who you follow, then combine topic match, social signals, and freshness to surface stronger posts.",
            suggestions: ["What can AI Studio do?", "How do I create a post?", "Help me improve my current draft"],
            source: "local"
        };
    }

    if (q.includes("feed") || q.includes("discover")) {
        return {
            response: "The feed shows posts from all users. Use tabs to switch between All Posts, Following, and Trending, then sort or search to narrow what you see.",
            suggestions: ["How do recommendations work?", "What can AI Studio do?", "How do I create a post?"],
            source: "local"
        };
    }

    if (q.includes("message") || q.includes("dm") || q.includes("inbox")) {
        return {
            response: "Open Inbox to continue conversations, view recent threads, and message people in your network directly.",
            suggestions: ["How do recommendations work?", "How do I create a post?", "What can AI Studio do?"],
            source: "local"
        };
    }

    if (q.includes("follow") || q.includes("unfollow")) {
        return {
            response: "Open a profile or use the follow button on a post to follow someone. Your recommendation feed learns from those network connections too.",
            suggestions: ["How do recommendations work?", "How do I create a post?", "What can AI Studio do?"],
            source: "local"
        };
    }

    if (q.includes("delete") || q.includes("remove")) {
        return {
            response: "You can delete your own posts from the post menu, and Connect Hub keeps a confirmation step in front of risky actions.",
            suggestions: ["How do I create a post?", "What can AI Studio do?", "How do recommendations work?"],
            source: "local"
        };
    }

    if (q.includes("creator") || q.includes("arihant")) {
        return {
            response: "Connect Hub was created by Arihant Kashyap with a focus on calmer, more meaningful social experiences.",
            suggestions: ["What can AI Studio do?", "How do recommendations work?", "How do I create a post?"],
            source: "local"
        };
    }

    return {
        response: "I can help with posting, AI Studio, recommendations, inbox, or improving the draft in your composer.",
        suggestions: CHATBOT_STARTERS,
        source: "local"
    };
}

function normalizeChatResponse(data) {
    return {
        response: String(data?.response || "I can help with posting, AI Studio, recommendations, inbox, or improving the draft in your composer."),
        suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
        draftInsights: data?.draft_insights
            ? normalizeAnalysisResponse(data.draft_insights)
            : data?.draftInsights
                ? normalizeAnalysisResponse(data.draftInsights)
                : null,
        source: data?.source || "server"
    };
}

async function requestChatbotResponse(message) {
    const fallback = getChatbotResponse(message);

    try {
        const response = await fetch(`${AI_API_BASE}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                draft: postContent.value.trim() || null,
                signed_in: Boolean(currentUser)
            })
        });

        if (!response.ok) {
            throw new Error(`Chatbot request failed with ${response.status}`);
        }

        return {
            ...normalizeChatResponse(await response.json()),
            source: "server"
        };
    } catch (error) {
        console.error("Chatbot fallback:", error);
        return fallback;
    }
}

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addChatMessage(message, true);
    chatInput.value = "";

    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-message bot";
    typingDiv.textContent = "Thinking...";
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const data = await requestChatbotResponse(message);

        if (typingDiv.parentNode) {
            typingDiv.parentNode.removeChild(typingDiv);
        }

        addChatMessage(data.response, false, { suggestions: data.suggestions });

        if (data.draftInsights) {
            renderAIInsights(data.draftInsights);
            aiInsightStatus.textContent = data.source === "server"
                ? "Draft coached by the assistant."
                : "Draft coached using local fallback.";
        }
    } catch (error) {
        if (typingDiv.parentNode) {
            typingDiv.parentNode.removeChild(typingDiv);
        }
        addChatMessage("Sorry, I ran into a problem while answering that.", false, { suggestions: CHATBOT_STARTERS });
        console.error("Chatbot error:", error);
    }
}

// NSFW functions
let isAgeVerified = localStorage.getItem("ageVerified") === "true";

function showAgeVerification() {
    ageVerificationModal.style.display = "flex";
}

function showNsfwModal() {
    if (!isAgeVerified) {
        showAgeVerification();
        return;
    }
    nsfwModal.style.display = "flex";
    loadNsfwPosts();
}

function loadNsfwPosts() {
    fetch(`${API_BASE}/api/nsfw/`)
    .then(response => response.json())
    .then(apiPosts => {
        nsfwFeed.innerHTML = "";
        apiPosts.map(normalizeApiPost).forEach(post => {
            const postElement = createPostElement(post, true);
            nsfwFeed.appendChild(postElement);
        });
    })
    .catch(error => {
        console.error("Error loading NSFW posts:", error);
        showToast("Failed to load NSFW content.", "error");
    });
}

function postNsfwContent() {
    const content = nsfwContent.value.trim();
    if (!content) {
        showToast("Please enter some content.", "info");
        return;
    }

    const postData = {
        content: content,
        is_nsfw: true
    };

    fetch(`${API_BASE}/api/nsfw/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(postData)
    })
    .then(async response => {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Unknown error" }));
            throw new Error(error.detail || "Unknown error");
        }
        return response.json();
    })
    .then(() => {
        nsfwContent.value = "";
        loadNsfwPosts();
        showToast("NSFW post created!", "success");
    })
    .catch(error => {
        console.error('Error posting NSFW content:', error);
        showToast("Failed to post NSFW content.", "error");
    });
}

function revealNsfwButton() {
    // Hidden way to access NSFW - triple click on the brand name
    let clicks = 0;
    const brand = document.querySelector(".brand-line h1");
    brand.addEventListener("click", () => {
        clicks++;
        if (clicks === 3) {
            nsfwBtn.style.display = "inline-block";
            showToast("NSFW space unlocked! 🔥", "info");
            clicks = 0;
        }
        setTimeout(() => clicks = 0, 1000);
    });
}

function mergeInterestSignal(profile, text, weight = 1, limit = 8) {
    extractKeywords(text, limit).forEach((keyword) => {
        profile[keyword] = (profile[keyword] || 0) + weight;
    });
}

function buildInterestProfile() {
    if (!currentUser) {
        return {};
    }

    const profile = {};

    posts.forEach((post) => {
        if (post.userId === currentUser.id) {
            mergeInterestSignal(profile, post.content, 5);
            if (post.category) {
                profile[post.category] = (profile[post.category] || 0) + 6;
            }
        }

        if (post.likedBy.includes(currentUser.id)) {
            mergeInterestSignal(profile, post.content, 3);
            if (post.category) {
                profile[post.category] = (profile[post.category] || 0) + 4;
            }
        }

        if (currentUser.following.includes(post.userId)) {
            mergeInterestSignal(profile, post.content, 2);
            if (post.category) {
                profile[post.category] = (profile[post.category] || 0) + 3;
            }
        }
    });

    if (!Object.keys(profile).length) {
        mergeInterestSignal(profile, currentUser.name, 2, 4);
    }

    return profile;
}

function computeFreshnessBoost(createdAt) {
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) {
        return 0;
    }

    const ageHours = Math.max(0, (Date.now() - created.getTime()) / 3600000);
    return Math.max(0, Math.round(10 - Math.min(ageHours / 6, 10)));
}

function getRecommendedPosts() {
    if (!currentUser) {
        return [];
    }

    const profile = buildInterestProfile();

    return posts
        .filter((post) => post.userId !== currentUser.id)
        .map((post) => {
            const postVector = vectorizeKeywords(post.content, 8);
            const overlap = Object.keys(postVector)
                .filter((keyword) => profile[keyword])
                .sort((left, right) => (profile[right] || 0) - (profile[left] || 0));
            const similarity = computeKeywordSimilarity(profile, postVector);
            const followingBoost = currentUser.following.includes(post.userId) ? 14 : 0;
            const popularityBoost = Math.min(24, (post.likes || 0) * 2 + (post.comments || 0) * 1.5);
            const freshnessBoost = computeFreshnessBoost(post.createdAt);
            const categoryBoost = post.category && profile[post.category] ? Math.min(profile[post.category], 10) : 0;
            const explorationBoost = similarity < 0.08 && popularityBoost >= 6 ? 4 : 0;
            const score = similarity * 70 + overlap.length * 5 + followingBoost + popularityBoost + freshnessBoost + categoryBoost + explorationBoost;
            const match = Math.max(
                52,
                Math.min(
                    99,
                    Math.round(similarity * 100 + overlap.length * 6 + followingBoost + categoryBoost + (freshnessBoost / 2))
                )
            );
            const reasons = [];

            if (overlap.length) {
                reasons.push(`Strong topic match: ${overlap.slice(0, 3).join(", ")}`);
            }
            if (followingBoost) {
                reasons.push("From someone in your network");
            }
            if (popularityBoost >= 6) {
                reasons.push("Already getting strong community engagement");
            }
            if (freshnessBoost >= 6) {
                reasons.push("Fresh post with current momentum");
            }
            if (!reasons.length) {
                reasons.push("Useful exploration pick outside your usual lane");
            }

            return {
                ...post,
                score: Math.round(score),
                match,
                reasons: reasons.slice(0, 3),
                overlap: overlap.slice(0, 4)
            };
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
        refreshMotionTargets(recommendedFeed);
        return;
    }

    recommendations.forEach((post) => {
        const card = document.createElement("div");
        card.className = "recommended-card";
        card.innerHTML = `
            ${post.image ? `
                <div class="recommended-image">
                    <img src="${post.image}" alt="Content preview" loading="lazy" />
                </div>
            ` : ""}
            <div class="recommended-meta">
                <strong>${escapeHtml(post.username)}</strong>
                <span>Match ${post.match}%</span>
            </div>
            <p>${escapeHtml(post.content)}</p>
            <div class="recommended-reasons">
                <span class="recommended-reason">${escapeHtml(formatCategoryLabel(post.category || "general"))}</span>
                ${post.overlap.map((keyword) => `<span class="recommended-reason">${escapeHtml(keyword)}</span>`).join("")}
            </div>
            <div class="recommended-reasons">
                ${post.reasons.map((reason) => `<span class="recommended-reason">${escapeHtml(reason)}</span>`).join("")}
            </div>
        `;
        recommendedFeed.appendChild(card);
    });

    refreshMotionTargets(recommendedFeed);
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
            ${currentUser && (post.userId === currentUser.id || currentUser.is_admin) ? `<button class="delete-btn" data-id="${post.id}">Delete</button>` : ""}
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

function showFeedSkeleton() {
    feed.innerHTML = Array(3).fill(0).map(() => `
        <div class="skeleton-post">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-content"></div>
        </div>
    `).join('');
}

function loadPosts() {
    if (!currentUser) {
        feed.innerHTML = "";
        renderRecommendations();
        return;
    }

    // Simulate high-speed data parsing with skeleton
    if (posts.length > 10) showFeedSkeleton();

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
    
    setTimeout(() => {
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
        refreshMotionTargets(feed);
    }, posts.length > 10 ? 300 : 0);

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
    renderImagePreview();
    resetAIInsights();
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

let analysisTimeout;
postContent.addEventListener("input", () => {
    updateCharCount();
    // Advanced "Live Insight" Logic: Auto-trigger light analysis after pause
    clearTimeout(analysisTimeout);
    analysisTimeout = setTimeout(() => {
        if (postContent.value.length > 20) {
            aiInsightStatus.textContent = "AI is evaluating your draft structure...";
        }
    }, 2000);
});

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
                deletePost(post.id);
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

    if (!requireAuth("Sign in to publish a post.")) {
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

loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (await login(username, password)) {
        loginError.textContent = "";
    } else {
        loginError.textContent = "Invalid username or password.";
    }
});

signupBtn.addEventListener("click", async () => {
    const username = document.getElementById("signupUsername").value.trim();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!username || !name || !email || !password) {
        signupError.textContent = "All fields are required.";
        return;
    }

    if (password.length < 8) {
        signupError.textContent = "Password must be at least 8 characters.";
        return;
    }

    if (await signup(username, name, email, password)) {
        signupError.textContent = "";
    } else {
        signupError.textContent = "Username or email already exists.";
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

analyzeDraftBtn.addEventListener("click", async () => {
    const content = postContent.value.trim();

    if (!content) {
        showToast("Write something first so the AI can analyze it.", "info");
        return;
    }

    const analysis = await requestDraftAnalysis(content, categorySelect.value);
    renderAIInsights(analysis);
    aiInsightStatus.textContent = analysis.source === "server"
        ? "Draft analyzed successfully."
        : "Draft analyzed using local fallback.";
    showToast(
        analysis.source === "server" ? "Draft analysis complete." : "Draft analysis complete with local fallback.",
        "success"
    );
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

applyRewriteBtn.addEventListener("click", () => {
    if (!currentAIAnalysis || !currentAIAnalysis.rewrite) {
        showToast("Analyze a draft first to generate a rewrite.", "info");
        return;
    }

    postContent.value = currentAIAnalysis.rewrite;
    updateCharCount();
    showToast("AI rewrite applied to your draft.", "success");
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
exploreBtn.addEventListener("click", showExplorePage);
exploreSearchInput?.addEventListener("input", loadExploreGrid);
launchChallengeBtn?.addEventListener("click", () => {
    if (!currentUser) {
        showAuthModal();
        showToast("Sign in to jump into the challenge.", "info");
        return;
    }

    mainContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    postContent.focus();
    postContent.placeholder = "Write a sharp, conversation-starting post...";
    showToast("Challenge unlocked. Make it bold.", "success");
});

// Chatbot event listeners
chatbotBtn.addEventListener("click", showChatbotModal);
sendChatBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendChatMessage();
    }
});

// NSFW event listeners
nsfwBtn.addEventListener("click", showNsfwModal);
confirm18Plus.addEventListener("click", () => {
    isAgeVerified = true;
    localStorage.setItem("ageVerified", "true");
    ageVerificationModal.style.display = "none";
    showNsfwModal();
});
under18.addEventListener("click", () => {
    ageVerificationModal.style.display = "none";
    showToast("You must be 18+ to access NSFW content.", "error");
});
postNsfwBtn.addEventListener("click", postNsfwContent);
revealNsfwButton();

loadTheme();
updateCharCount();
renderImagePreview();
resetAIInsights();
updateDMBadge();
updateNotificationsBadge();
updateStats();
setHeaderState();
startSystemPulse();
startEngagementLoop();
refreshMotionTargets(document);

if (currentUser) {
    hideAuthModal();
} else {
    showLandingPage();
}

/**
 * Advanced SVG Gauge Generator for AI Metrics
 */
function createGaugeSVG(value, colorClass = "primary") {
    const percent = Math.min(100, Math.max(0, value));
    return `
        <div class="ai-gauge-wrapper">
            <svg viewBox="0 0 36 36" class="circular-chart ${colorClass}">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="circle" stroke-dasharray="${percent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" class="percentage">${percent}%</text>
            </svg>
        </div>
    `;
}

/**
 * Simulated "System Pulse" to make the UI feel alive
 */
function startSystemPulse() {
    const events = ["Node optimized", "Vector sync complete", "Neutralizing noise", "Buffering feed..."];
    setInterval(() => {
        const event = events[Math.floor(Math.random() * events.length)];
        if (aiInsightStatus) aiInsightStatus.textContent = `[PULSE] ${event} | ${new Date().toLocaleTimeString()}`;
    }, 8000);
}

function startEngagementLoop() {
    if (engagementLoop) {
        clearInterval(engagementLoop);
    }

    const spotlights = [
        {
            topic: "AI-assisted storytelling is surging.",
            description: "Creators are mixing personality, clarity, and visual polish to stand out fast."
        },
        {
            topic: "Short-form opinion posts are getting more replies.",
            description: "A sharper hook and one strong question are outperforming longer generic updates."
        },
        {
            topic: "Behind-the-scenes creator drops are trending.",
            description: "People stay longer when posts feel personal, unfinished, and slightly exclusive."
        },
        {
            topic: "Visual-first posts are pulling stronger engagement.",
            description: "Richer previews and stronger hierarchy make images feel more clickable and memorable."
        }
    ];

    let index = 0;
    const updateSpotlight = () => {
        const spotlight = spotlights[index % spotlights.length];
        const pulse = 72 + Math.round(Math.random() * 25);
        const velocity = 8 + Math.round(Math.random() * 9);
        const streak = 3 + Math.round(Math.random() * 11);

        if (engagementPulseValue) {
            engagementPulseValue.textContent = `${pulse}%`;
        }
        if (trendVelocityValue) {
            trendVelocityValue.textContent = `${velocity}x`;
        }
        if (creatorStreakValue) {
            creatorStreakValue.textContent = `${streak} days`;
        }
        if (spotlightTopic) {
            spotlightTopic.textContent = spotlight.topic;
        }
        if (spotlightDescription) {
            spotlightDescription.textContent = spotlight.description;
        }
        if (hypeBandTrack) {
            hypeBandTrack.style.setProperty("--ticker-tilt", `${(Math.random() * 2 - 1).toFixed(2)}deg`);
        }

        index += 1;
    };

    updateSpotlight();
    engagementLoop = setInterval(updateSpotlight, 4800);
}

/**
 * Neural Connectivity Background Engine with Bloom
 */
function initNeuralBackground() {
    if (!landingPage || neuralAnimationFrame) return;

    neuralCanvas = document.getElementById('neuralCanvas');
    if (!neuralCanvas) {
        neuralCanvas = document.createElement('canvas');
        neuralCanvas.id = 'neuralCanvas';
        neuralCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:0.6;';
        landingPage.prepend(neuralCanvas);
    }

    neuralCtx = neuralCanvas.getContext('2d');
    resizeNeuralCanvas();
    
    particles = [];
    const numberOfParticles = (window.innerWidth * window.innerHeight) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
    }

    window.addEventListener('resize', resizeNeuralCanvas);
    window.addEventListener('mousemove', handleNeuralMouse);
    animateNeuralBackground();
}

function stopNeuralBackground() {
    cancelAnimationFrame(neuralAnimationFrame);
    neuralAnimationFrame = null;
    window.removeEventListener('resize', resizeNeuralCanvas);
    window.removeEventListener('mousemove', handleNeuralMouse);
    if (neuralCanvas) neuralCanvas.style.display = 'none';
}

function resizeNeuralCanvas() {
    if (neuralCanvas) {
        neuralCanvas.width = window.innerWidth;
        neuralCanvas.height = window.innerHeight;
    }
}

function handleNeuralMouse(event) {
    mouse.x = event.x;
    mouse.y = event.y;
}

class Particle {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > window.innerWidth || this.x < 0) this.speedX *= -1;
        if (this.y > window.innerHeight || this.y < 0) this.speedY *= -1;

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
            if (mouse.x < this.x && this.x < window.innerWidth - 10) this.x += 2;
            if (mouse.x > this.x && this.x > 10) this.x -= 2;
            if (mouse.y < this.y && this.y < window.innerHeight - 10) this.y += 2;
            if (mouse.y > this.y && this.y > 10) this.y -= 2;
        }
    }
    draw(color) {
        neuralCtx.shadowBlur = 15;
        neuralCtx.shadowColor = color;
        neuralCtx.fillStyle = color;
        neuralCtx.beginPath();
        neuralCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        neuralCtx.fill();
    }
}

function animateNeuralBackground() {
    if (landingPage.style.display === 'none') return;
    neuralCanvas.style.display = 'block';
    
    const color = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#6366f1';
    neuralCtx.globalCompositeOperation = 'source-over';
    neuralCtx.clearRect(0, 0, neuralCanvas.width, neuralCanvas.height);
    neuralCtx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(color);
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
                neuralCtx.shadowBlur = 8;
                neuralCtx.shadowColor = color;
                neuralCtx.strokeStyle = color;
                neuralCtx.globalAlpha = 1 - (distance / 100);
                neuralCtx.lineWidth = 0.5;
                neuralCtx.beginPath();
                neuralCtx.moveTo(particles[i].x, particles[i].y);
                neuralCtx.lineTo(particles[j].x, particles[j].y);
                neuralCtx.stroke();
            }
        }
    }
    neuralCtx.globalAlpha = 1;
    neuralAnimationFrame = requestAnimationFrame(animateNeuralBackground);
}
