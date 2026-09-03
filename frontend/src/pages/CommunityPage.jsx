import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  Users,
  Search,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Bookmark,
  ShieldCheck,
  Award,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  HelpCircle,
  Clock,
  TrendingUp,
  UserCheck,
  UserPlus,
  Send,
  CornerDownRight,
  Filter,
  X,
  Camera,
  Image as ImageIcon,
  Check,
  Flag,
  Globe,
  LogOut,
  ChevronDown,
  ChevronRight,
  Layers,
  Sprout,
  Building2,
  ExternalLink,
  RefreshCw,
  BookOpen,
  Newspaper,
  Info,
} from "lucide-react";
import logoImg from "../assets/logo.png";
import {
  getCommunityPostsApi,
  getCommunityCategoriesApi,
  getCommunityCropsApi,
  createCommunityPostApi,
  voteCommunityPostApi,
  getPostCommentsApi,
  addPostCommentApi,
  markSolutionFoundApi,
  toggleBookmarkPostApi,
  toggleFollowFarmerApi,
  getFarmerPublicProfileApi,
  reportCommunityContentApi,
  uploadCommunityMediaApi,
  getAllNewsApi,
  getRegionalNewsApi,
  getNationalNewsApi,
  refreshDailyNewsApi,
} from "../services/api";
import { translateProfileText } from "../utils/transliterate";
import "../styles/CommunityPage.css";

export default function CommunityPage({
  userProfile,
  onNavigateHome,
  onNavigateNews,
  onNavigateAbout,
  language = "hi",
  onToggleLanguage,
  onLogout,
}) {
  const isHindi = language === "hi";

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState("latest"); // 'latest' | 'popular' | 'unanswered' | 'solved' | 'following' | 'saved'
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Data States
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [crops, setCrops] = useState([]);
  const [regionalNews, setRegionalNews] = useState([]);
  const [nationalNews, setNationalNews] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);

  // Loading & Action States
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingNews, setLoadingNews] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyParentId, setReplyParentId] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Profile & Lightbox & Report Modals
  const [viewProfileId, setViewProfileId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [reportModalData, setReportModalData] = useState(null);
  const [reportReason, setReportReason] = useState("misinformation");
  const [toastMessage, setToastMessage] = useState("");

  // News Modal State (Opens when clicking regional/national news or view all)
  const [newsModal, setNewsModal] = useState({
    isOpen: false,
    activeTab: "all", // 'all' | 'regional' | 'national'
    selectedState: userProfile?.state || "All",
    searchQuery: "",
    articles: [],
    loading: false,
    refreshing: false,
  });

  // Create Post Form
  const [postForm, setPostForm] = useState({
    title: "",
    description: "",
    category_id: 1,
    crop: "",
    tags: "",
    region: userProfile?.location || "Ludhiana, Punjab",
    media_urls: [],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Toast alert trigger
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const loadCategoriesAndCrops = async () => {
    const catData = await getCommunityCategoriesApi();
    if (catData?.categories) setCategories(catData.categories);

    const cropData = await getCommunityCropsApi();
    if (cropData?.crops) setCrops(cropData.crops);
  };

  const loadSidebarNews = async () => {
    setLoadingNews(true);
    const userState = userProfile?.state || "Punjab";
    const [regData, natData] = await Promise.all([
      getRegionalNewsApi(userState),
      getNationalNewsApi(),
    ]);
    if (regData?.news) setRegionalNews(regData.news.slice(0, 3));
    if (natData?.news) setNationalNews(natData.news.slice(0, 3));
    setLoadingNews(false);
  };

  // Load initial categories, crops, sidebar news
  useEffect(() => {
    loadCategoriesAndCrops();
    loadSidebarNews();
  }, []);

  // Load feed whenever filters change
  useEffect(() => {
    loadPosts();
  }, [activeTab, selectedCrop, selectedCategory, searchQuery]);

  const loadPosts = async () => {
    setLoadingPosts(true);
    const data = await getCommunityPostsApi({
      tab: activeTab,
      crop: selectedCrop,
      categoryId: selectedCategory?.id || "",
      search: searchQuery,
    });
    if (data?.posts) {
      setPosts(data.posts);
      setTotalPosts(data.total || data.posts.length);
    } else {
      setPosts([]);
      setTotalPosts(0);
    }
    setLoadingPosts(false);
  };

  // Open Full News Modal with specific tab
  const handleOpenNewsModal = async (tab = "all") => {
    setNewsModal((prev) => ({
      ...prev,
      isOpen: true,
      activeTab: tab,
      loading: true,
    }));

    const userState =
      newsModal.selectedState === "All" ? "" : newsModal.selectedState;
    const data = await getAllNewsApi({
      newsType: tab,
      state: userState,
      limit: 60,
    });

    setNewsModal((prev) => ({
      ...prev,
      articles: data?.news || [],
      loading: false,
    }));
  };

  const handleNewsModalTabChange = async (tab) => {
    setNewsModal((prev) => ({ ...prev, activeTab: tab, loading: true }));
    const userState =
      newsModal.selectedState === "All" ? "" : newsModal.selectedState;
    const data = await getAllNewsApi({
      newsType: tab,
      state: userState,
      search: newsModal.searchQuery,
      limit: 60,
    });
    setNewsModal((prev) => ({
      ...prev,
      articles: data?.news || [],
      loading: false,
    }));
  };

  const handleNewsModalStateChange = async (st) => {
    setNewsModal((prev) => ({ ...prev, selectedState: st, loading: true }));
    const userState = st === "All" ? "" : st;
    const data = await getAllNewsApi({
      newsType: newsModal.activeTab,
      state: userState,
      search: newsModal.searchQuery,
      limit: 60,
    });
    setNewsModal((prev) => ({
      ...prev,
      articles: data?.news || [],
      loading: false,
    }));
  };

  const handleRefreshDailyNews = async () => {
    setNewsModal((prev) => ({ ...prev, refreshing: true }));
    const res = await refreshDailyNewsApi();
    if (res?.status === "success") {
      showToast(
        isHindi
          ? "✓ ताजा दैनिक कृषि समाचार अपडेट हो गए हैं!"
          : "✓ Daily agriculture news updated successfully!",
      );
      await loadSidebarNews();
      const userState =
        newsModal.selectedState === "All" ? "" : newsModal.selectedState;
      const data = await getAllNewsApi({
        newsType: newsModal.activeTab,
        state: userState,
        limit: 60,
      });
      setNewsModal((prev) => ({
        ...prev,
        articles: data?.news || [],
        refreshing: false,
      }));
    } else {
      setNewsModal((prev) => ({ ...prev, refreshing: false }));
    }
  };

  // Vote on Post
  const handleVotePost = async (postId, currentVote, targetVote) => {
    const res = await voteCommunityPostApi(postId, targetVote);
    if (res?.status === "success") {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                upvotes: res.upvotes,
                downvotes: res.downvotes,
                user_vote: res.user_vote,
              }
            : p,
        ),
      );
    }
  };

  // Toggle Comments Drawer
  const handleToggleComments = async (postId) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    setReplyParentId(null);
    setCommentInput("");

    if (!commentsMap[postId]) {
      setLoadingComments(true);
      const data = await getPostCommentsApi(postId);
      if (data?.comments) {
        setCommentsMap((prev) => ({ ...prev, [postId]: data.comments }));
      }
      setLoadingComments(false);
    }
  };

  // Submit Comment / Reply
  const handleSubmitComment = async (postId) => {
    if (!commentInput.trim()) return;

    setSubmittingComment(true);
    const res = await addPostCommentApi(postId, {
      content: commentInput,
      parent_id: replyParentId,
    });
    if (res?.status === "success") {
      setCommentInput("");
      setReplyParentId(null);
      showToast(
        isHindi ? "टिप्पणी सफलतापूर्वक जोड़ी गई" : "Comment added successfully",
      );

      const data = await getPostCommentsApi(postId);
      if (data?.comments) {
        setCommentsMap((prev) => ({ ...prev, [postId]: data.comments }));
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p,
        ),
      );
    }
    setSubmittingComment(false);
  };

  // Mark Comment as Accepted Solution
  const handleMarkSolution = async (postId, commentId) => {
    const res = await markSolutionFoundApi(postId, commentId);
    if (res?.status === "success") {
      showToast(
        isHindi
          ? "समाधान स्वीकृत और चिह्नित किया गया!"
          : "Solution marked and accepted!",
      );

      const data = await getPostCommentsApi(postId);
      if (data?.comments) {
        setCommentsMap((prev) => ({ ...prev, [postId]: data.comments }));
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, has_solution: true } : p)),
      );
    }
  };

  // Bookmark Post
  const handleBookmarkPost = async (postId) => {
    const res = await toggleBookmarkPostApi(postId);
    if (res?.status === "success") {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_bookmarked: res.is_bookmarked } : p,
        ),
      );
      showToast(
        res.is_bookmarked
          ? isHindi
            ? "पोस्ट सुरक्षित की गई"
            : "Post saved to bookmarks"
          : isHindi
            ? "पोस्ट बुकमार्क से हटाई गई"
            : "Post removed from bookmarks",
      );
    }
  };

  // Toggle Follow Author
  const handleToggleFollow = async (farmerId) => {
    const res = await toggleFollowFarmerApi(farmerId);
    if (res?.status === "success") {
      showToast(res.message);
      setPosts((prev) =>
        prev.map((p) =>
          p.author.id === farmerId
            ? { ...p, author: { ...p.author, is_following: res.is_following } }
            : p,
        ),
      );
    }
  };

  // Open Farmer Profile
  const handleOpenProfile = async (farmerId) => {
    setViewProfileId(farmerId);
    setLoadingProfile(true);
    const data = await getFarmerPublicProfileApi(farmerId);
    if (data?.profile) {
      setProfileData(data.profile);
    }
    setLoadingProfile(false);
  };

  // Upload Crop Image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast(
        isHindi
          ? "फ़ाइल 10MB से कम होनी चाहिए"
          : "File size must be under 10MB",
      );
      return;
    }

    setUploadingImage(true);
    const res = await uploadCommunityMediaApi(file);
    if (res?.status === "success" && res.url) {
      setPostForm((prev) => ({
        ...prev,
        media_urls: [...prev.media_urls, res.url],
      }));
      showToast(isHindi ? "तस्वीर अपलोड हो गई" : "Image uploaded");
    }
    setUploadingImage(false);
  };

  // Submit New Post
  const handleCreatePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.description.trim()) {
      showToast(
        isHindi
          ? "कृपया शीर्षक और विवरण भरें"
          : "Please fill title and description",
      );
      return;
    }

    setCreatingPost(true);
    const res = await createCommunityPostApi(postForm);
    if (res?.status === "success") {
      setShowCreateModal(false);
      setPostForm({
        title: "",
        description: "",
        category_id: 1,
        crop: "",
        tags: "",
        region: userProfile?.location || "Ludhiana, Punjab",
        media_urls: [],
      });
      showToast(
        isHindi
          ? "पोस्ट सफलतापूर्वक प्रकाशित हो गई!"
          : "Post published successfully!",
      );
      await loadPosts();
      await loadCategoriesAndCrops();
    }
    setCreatingPost(false);
  };

  // Share Post
  const handleSharePost = (post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: `${post.title} - Krishi Samvad (FarmHawk)`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(
        `${post.title}\n${window.location.origin}/community#post-${post.id}`,
      );
      showToast(
        isHindi
          ? "पोस्ट लिंक कॉपी किया गया!"
          : "Post link copied to clipboard!",
      );
    }
  };

  // Submit Content Report
  const handleSubmitReport = async () => {
    if (!reportModalData) return;
    await reportCommunityContentApi({
      target_type: reportModalData.targetType,
      target_id: reportModalData.targetId,
      reason: reportReason,
    });
    setReportModalData(null);
    showToast(
      isHindi
        ? "रिपोर्ट सबमिट हो गई। धन्यवाद।"
        : "Report submitted for review. Thank you.",
    );
  };

  // Filtered Articles inside News Modal
  const modalFilteredArticles = newsModal.articles.filter((item) => {
    if (newsModal.searchQuery.trim()) {
      const q = newsModal.searchQuery.toLowerCase();
      const titleMatch =
        item.title_en?.toLowerCase().includes(q) ||
        item.title_hi?.toLowerCase().includes(q);
      const summaryMatch =
        item.summary_en?.toLowerCase().includes(q) ||
        item.summary_hi?.toLowerCase().includes(q);
      const sourceMatch = item.source_name?.toLowerCase().includes(q);
      const stateMatch = item.state?.toLowerCase().includes(q);
      return titleMatch || summaryMatch || sourceMatch || stateMatch;
    }
    return true;
  });

  return (
    <div className="community-page-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="community-toast-banner">{toastMessage}</div>
      )}

      {/* Top Header Bar */}
      <header className="community-header">
        <div className="header-left">
          <div className="header-logo-container">
            <img
              src={logoImg}
              alt="FarmHawk Logo"
              className="header-logo-img"
            />
          </div>

          <button className="header-nav-btn" onClick={onNavigateHome}>
            <Home size={18} />
            <span>{isHindi ? "डैशबोर्ड" : "Dashboard"}</span>
          </button>

          <button className="header-nav-btn active">
            <Users size={18} />
            <span>{isHindi ? "कृषि संवाद" : "Krishi Samvad"}</span>
          </button>

          <button className="header-nav-btn" onClick={onNavigateAbout}>
            <Info size={18} />
            <span>{isHindi ? "हमारे बारे में" : "About"}</span>
          </button>
        </div>

        <div className="header-right">
          <button onClick={onToggleLanguage} className="lang-toggle-btn">
            <Globe size={18} />
            <span>{isHindi ? "English" : "हिन्दी"}</span>
          </button>

          <button onClick={onLogout} className="logout-header-btn">
            <LogOut size={18} />
            <span>{isHindi ? "लॉगआउट" : "Logout"}</span>
          </button>
        </div>
      </header>

      {/* Hero Banner with Search & Create Post */}
      <div className="community-hero-banner">
        <div className="community-hero-content">
          <div className="hero-text-block">
            <h1 className="hero-heading">
              {isHindi ? "कृषि संवाद" : "Krishi Samvad"}
            </h1>
            <p className="hero-subheading">
              {isHindi
                ? "किसानों की बात, किसानों के साथ — फसल समस्या, समाधान एवं अनुभव साझा करें"
                : "Farmer-to-Farmer Agricultural Knowledge & Problem Solving"}
            </p>
          </div>

          <div className="hero-actions-row">
            <div className="community-search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder={
                  isHindi
                    ? "फसल रोग, कीट, खाद या सवाल खोजें..."
                    : "Search crop diseases, pests, fertilizers..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-create-post-hero"
            >
              <Plus size={18} />
              <span>{isHindi ? "नया सवाल पूछें" : "Create Post"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="community-tabs-bar">
        <div className="tabs-wrapper">
          <button
            className={`tab-chip ${activeTab === "latest" ? "active" : ""}`}
            onClick={() => setActiveTab("latest")}
          >
            <Clock size={15} />
            <span>{isHindi ? "नवीनतम" : "Latest"}</span>
          </button>

          <button
            className={`tab-chip ${activeTab === "popular" ? "active" : ""}`}
            onClick={() => setActiveTab("popular")}
          >
            <TrendingUp size={15} />
            <span>{isHindi ? "लोकप्रिय" : "Popular"}</span>
          </button>

          <button
            className={`tab-chip ${activeTab === "unanswered" ? "active" : ""}`}
            onClick={() => setActiveTab("unanswered")}
          >
            <HelpCircle size={15} />
            <span>{isHindi ? "बिना उत्तर के" : "Unanswered"}</span>
          </button>

          <button
            className={`tab-chip ${activeTab === "solved" ? "active" : ""}`}
            onClick={() => setActiveTab("solved")}
          >
            <CheckCircle2 size={15} />
            <span>{isHindi ? "समाधान मिला" : "Solution Found"}</span>
          </button>

          <button
            className={`tab-chip ${activeTab === "following" ? "active" : ""}`}
            onClick={() => setActiveTab("following")}
          >
            <UserCheck size={15} />
            <span>{isHindi ? "फॉलो किए गए" : "Following"}</span>
          </button>

          <button
            className={`tab-chip ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            <Bookmark size={15} />
            <span>{isHindi ? "सुरक्षित पोस्ट" : "Saved"}</span>
          </button>
        </div>

        {/* Active Filters Bar */}
        {(selectedCrop || selectedCategory) && (
          <div className="active-filters-strip">
            <span className="filter-label">
              {isHindi ? "सक्रिय फ़िल्टर:" : "Active Filters:"}
            </span>

            {selectedCrop && (
              <span className="filter-pill">
                <Sprout size={13} />
                <span>{translateProfileText(selectedCrop, language)}</span>
                <X size={12} onClick={() => setSelectedCrop("")} />
              </span>
            )}

            {selectedCategory && (
              <span className="filter-pill">
                <Layers size={13} />
                <span>
                  {isHindi
                    ? selectedCategory.name_hi
                    : selectedCategory.name_en}
                </span>
                <X size={12} onClick={() => setSelectedCategory(null)} />
              </span>
            )}

            <button
              className="clear-all-filters"
              onClick={() => {
                setSelectedCrop("");
                setSelectedCategory(null);
              }}
            >
              {isHindi ? "सभी हटाएं" : "Clear All"}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout (Feed + Right Sidebar) */}
      <div className="community-main-layout">
        {/* LEFT FEED COLUMN */}
        <div className="community-feed-column">
          {/* Quick Create Prompt Card */}
          <div
            className="quick-create-card"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="user-avatar-placeholder">
              {userProfile?.name?.charAt(0) || "A"}
            </div>
            <span className="quick-create-prompt">
              {isHindi
                ? "क्या आपकी फसल में कोई कीट या समस्या है? यहां सवाल पूछें..."
                : "Have a crop problem or question? Ask the community..."}
            </span>
            <button className="quick-create-btn">
              <Plus size={16} />
              <span>{isHindi ? "पोस्ट करें" : "Post"}</span>
            </button>
          </div>

          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="feed-loading-state">
              <div className="loading-spinner"></div>
              <span>
                {isHindi
                  ? "कृषि संवाद पोस्ट लोड हो रहे हैं..."
                  : "Loading community discussions..."}
              </span>
            </div>
          ) : posts.length === 0 ? (
            <div className="feed-empty-state">
              <Sprout size={48} className="empty-icon" />
              <h3>
                {isHindi
                  ? "इस फ़िल्टर में कोई पोस्ट नहीं मिली"
                  : "No posts found matching filters"}
              </h3>
              <p>
                {isHindi
                  ? "अपनी फसल से संबंधित पहला सवाल पूछें और साथी किसानों व विशेषज्ञों से समाधान पाएं।"
                  : "Be the first to ask a farming question and get expert advice."}
              </p>
              <button
                className="btn-create-post-empty"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                <span>
                  {isHindi ? "पहला सवाल पूछें" : "Ask First Question"}
                </span>
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                id={`post-${post.id}`}
                className="community-post-card"
              >
                {/* Solution Found Banner */}
                {post.has_solution && (
                  <div className="solution-found-badge">
                    <CheckCircle2 size={16} />
                    <span>{isHindi ? "समाधान मिला" : "Solution Found"}</span>
                  </div>
                )}

                {/* Post Author Header */}
                <div className="post-header-row">
                  <div className="author-info-group">
                    <div
                      className="author-avatar"
                      onClick={() => handleOpenProfile(post.author.id)}
                    >
                      {post.author.name?.charAt(0) || "F"}
                    </div>

                    <div className="author-details">
                      <div className="author-name-row">
                        <span
                          className="author-name"
                          onClick={() => handleOpenProfile(post.author.id)}
                        >
                          {translateProfileText(post.author.name, language)}
                        </span>

                        {post.author.is_verified_expert && (
                          <span
                            className="expert-badge"
                            title="Verified Agricultural Expert"
                          >
                            <ShieldCheck size={13} />
                            <span>{isHindi ? "विशेषज्ञ" : "Expert"}</span>
                          </span>
                        )}

                        <span className="reputation-badge">
                          <Award size={13} />
                          <span>{post.author.reputation}</span>
                        </span>
                      </div>

                      <div className="post-meta-row">
                        <span className="post-time">
                          <Calendar
                            size={12}
                            style={{ display: "inline", marginRight: "4px" }}
                          />
                          {post.created_at}
                        </span>
                        {post.region && (
                          <>
                            <span>•</span>
                            <span className="post-region">
                              <MapPin
                                size={12}
                                style={{
                                  display: "inline",
                                  marginRight: "3px",
                                }}
                              />
                              {translateProfileText(post.region, language)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  {userProfile && post.author.id !== userProfile.id && (
                    <button
                      className={`btn-follow ${post.author.is_following ? "following" : ""}`}
                      onClick={() => handleToggleFollow(post.author.id)}
                    >
                      {post.author.is_following ? (
                        <>
                          <UserCheck size={14} />
                          <span>{isHindi ? "फॉलो किया" : "Following"}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>{isHindi ? "फॉलो करें" : "Follow"}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Post Tags & Crop */}
                <div className="post-tags-row">
                  {post.crop && (
                    <span
                      className="tag-crop-chip"
                      onClick={() => setSelectedCrop(post.crop)}
                    >
                      <Sprout size={13} />
                      <span>{translateProfileText(post.crop, language)}</span>
                    </span>
                  )}

                  {post.category && (
                    <span
                      className="tag-category-chip"
                      onClick={() => setSelectedCategory(post.category)}
                    >
                      <Layers size={13} />
                      <span>
                        {isHindi
                          ? post.category.name_hi
                          : post.category.name_en}
                      </span>
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h2 className="post-title">{post.title}</h2>
                <p className="post-description">{post.description}</p>

                {/* Media Image Grid */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div
                    className={`post-media-grid count-${Math.min(post.media_urls.length, 4)}`}
                  >
                    {post.media_urls.map((url, idx) => (
                      <div
                        key={idx}
                        className="media-item-box"
                        onClick={() => setLightboxImg(url)}
                      >
                        <img
                          src={url}
                          alt="Crop Problem"
                          className="post-media-img"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Bar (Voting, Comments, Bookmark, Share, Report) */}
                <div className="post-actions-bar">
                  <div className="vote-actions-group">
                    <button
                      className={`vote-btn ${post.user_vote === 1 ? "upvoted" : ""}`}
                      onClick={() => handleVotePost(post.id, post.user_vote, 1)}
                      title={isHindi ? "उपयोगी (Upvote)" : "Upvote"}
                    >
                      <ThumbsUp
                        size={16}
                        fill={post.user_vote === 1 ? "currentColor" : "none"}
                      />
                      <span>{post.upvotes}</span>
                    </button>
                    <button
                      className={`vote-btn ${post.user_vote === -1 ? "downvoted" : ""}`}
                      onClick={() =>
                        handleVotePost(post.id, post.user_vote, -1)
                      }
                      title={isHindi ? "अनुपयोगी (Downvote)" : "Downvote"}
                    >
                      <ThumbsDown
                        size={16}
                        fill={post.user_vote === -1 ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <button
                    className={`btn-action-pill ${activeCommentsPostId === post.id ? "active" : ""}`}
                    onClick={() => handleToggleComments(post.id)}
                  >
                    <MessageSquare size={16} />
                    <span>
                      {post.comments_count}{" "}
                      {isHindi ? "टिप्पणियां" : "Comments"}
                    </span>
                  </button>

                  <button
                    className={`btn-action-icon ${post.is_bookmarked ? "bookmarked" : ""}`}
                    onClick={() => handleBookmarkPost(post.id)}
                    title={isHindi ? "सहेजें" : "Bookmark"}
                  >
                    <Bookmark
                      size={17}
                      fill={post.is_bookmarked ? "currentColor" : "none"}
                    />
                  </button>

                  <button
                    className="btn-action-icon"
                    onClick={() => handleSharePost(post)}
                    title={isHindi ? "साझा करें" : "Share"}
                  >
                    <Share2 size={17} />
                  </button>

                  <button
                    className="btn-action-icon report"
                    onClick={() =>
                      setReportModalData({
                        targetType: "post",
                        targetId: post.id,
                      })
                    }
                    title={isHindi ? "रिपोर्ट करें" : "Report"}
                  >
                    <Flag size={15} />
                  </button>
                </div>

                {/* Threaded Comments Drawer */}
                {activeCommentsPostId === post.id && (
                  <div className="comments-drawer">
                    <div className="comments-header">
                      <h4>
                        <MessageSquare size={16} />
                        <span>
                          {isHindi
                            ? "किसान चर्चा एवं समाधान"
                            : "Farmer Discussions & Solutions"}{" "}
                          ({post.comments_count})
                        </span>
                      </h4>
                    </div>

                    {/* Add Comment Box */}
                    <div className="comment-input-box">
                      {replyParentId && (
                        <div className="replying-to-banner">
                          <span>
                            <CornerDownRight size={14} />{" "}
                            {isHindi
                              ? "जवाब दिया जा रहा है"
                              : "Replying to comment"}
                          </span>
                          <button onClick={() => setReplyParentId(null)}>
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <textarea
                        rows={2}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder={
                          isHindi
                            ? "अपना उपयोगी सुझाव या समाधान यहां लिखें..."
                            : "Write your helpful advice or solution here..."
                        }
                      />
                      <div className="comment-submit-row">
                        <button
                          className="btn-submit-comment"
                          disabled={submittingComment || !commentInput.trim()}
                          onClick={() => handleSubmitComment(post.id)}
                        >
                          <Send size={16} />
                          <span>{isHindi ? "उत्तर भेजें" : "Post Reply"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {loadingComments ? (
                      <div className="comments-loading">
                        <div className="loading-spinner small"></div>
                        <span>
                          {isHindi
                            ? "टिप्पणियां लोड हो रही हैं..."
                            : "Loading comments..."}
                        </span>
                      </div>
                    ) : !commentsMap[post.id] ||
                      commentsMap[post.id].length === 0 ? (
                      <div className="no-comments-prompt">
                        <p>
                          {isHindi
                            ? "अभी कोई टिप्पणी नहीं है। क्या आपको इसका समाधान पता है? पहला उत्तर लिखें!"
                            : "No comments yet. Know the solution? Be the first to answer!"}
                        </p>
                      </div>
                    ) : (
                      <div className="comments-tree">
                        {commentsMap[post.id].map((comm) => (
                          <div
                            key={comm.id}
                            className={`comment-node ${comm.is_solution ? "accepted-solution" : ""}`}
                          >
                            {comm.is_solution && (
                              <div className="solution-indicator-badge">
                                <CheckCircle2 size={16} />
                                <span>
                                  {isHindi
                                    ? "स्वीकृत समाधान"
                                    : "Accepted Solution"}
                                </span>
                              </div>
                            )}

                            <div className="comment-author-bar">
                              <div
                                className="comment-avatar"
                                onClick={() =>
                                  handleOpenProfile(comm.author.id)
                                }
                              >
                                {comm.author.name?.charAt(0) || "F"}
                              </div>
                              <div className="comment-author-text">
                                <div className="comment-author-name-row">
                                  <span
                                    className="comment-author-name"
                                    onClick={() =>
                                      handleOpenProfile(comm.author.id)
                                    }
                                  >
                                    {translateProfileText(
                                      comm.author.name,
                                      language,
                                    )}
                                  </span>

                                  {comm.author.is_verified_expert && (
                                    <span className="expert-badge mini">
                                      <ShieldCheck size={12} />
                                      <span>
                                        {isHindi ? "विशेषज्ञ" : "Expert"}
                                      </span>
                                    </span>
                                  )}

                                  <span className="reputation-badge mini">
                                    <Award size={12} />
                                    <span>{comm.author.reputation}</span>
                                  </span>
                                </div>
                                <span className="comment-time">
                                  {comm.created_at}
                                </span>
                              </div>
                            </div>

                            <p className="comment-body">{comm.content}</p>

                            <div className="comment-footer-actions">
                              <button
                                className="reply-trigger-btn"
                                onClick={() => {
                                  setReplyParentId(comm.id);
                                  setCommentInput(`@${comm.author.name} `);
                                }}
                              >
                                <CornerDownRight size={13} />
                                <span>{isHindi ? "जवाब दें" : "Reply"}</span>
                              </button>

                              {!post.has_solution && (
                                <button
                                  className="mark-solution-btn"
                                  onClick={() =>
                                    handleMarkSolution(post.id, comm.id)
                                  }
                                >
                                  <CheckCircle2 size={14} />
                                  <span>
                                    {isHindi
                                      ? "समाधान चुनें"
                                      : "Mark as Solution"}
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Nested Replies */}
                            {comm.replies && comm.replies.length > 0 && (
                              <div className="nested-replies-list">
                                {comm.replies.map((rep) => (
                                  <div
                                    key={rep.id}
                                    className="nested-reply-item"
                                  >
                                    <div className="comment-author-bar">
                                      <div
                                        className="comment-avatar mini"
                                        onClick={() =>
                                          handleOpenProfile(rep.author.id)
                                        }
                                      >
                                        {rep.author.name?.charAt(0) || "F"}
                                      </div>
                                      <div className="comment-author-text">
                                        <span
                                          className="comment-author-name"
                                          onClick={() =>
                                            handleOpenProfile(rep.author.id)
                                          }
                                        >
                                          {translateProfileText(
                                            rep.author.name,
                                            language,
                                          )}
                                        </span>
                                        <span className="comment-time">
                                          {rep.created_at}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="comment-body">
                                      {rep.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {/* RIGHT SIDEBAR (Regional News, National News, Crops, Categories, Safety) */}
        <aside className="community-sidebar-column">
          {/* Regional Agriculture News Card */}
          <div className="sidebar-card news-card">
            <div
              className="sidebar-card-header clickable-header"
              onClick={() =>
                onNavigateNews
                  ? onNavigateNews("regional")
                  : handleOpenNewsModal("regional")
              }
            >
              <MapPin size={18} className="header-icon" />
              <h4>
                {isHindi
                  ? "क्षेत्रीय कृषि समाचार"
                  : "Regional Agriculture News"}
              </h4>
            </div>

            {loadingNews ? (
              <div className="sidebar-loading">
                {isHindi ? "समाचार लोड हो रहे हैं..." : "Loading news..."}
              </div>
            ) : regionalNews.length === 0 ? (
              <p className="no-news-text">
                {isHindi
                  ? "समाचार उपलब्ध नहीं हैं।"
                  : "No regional news available."}
              </p>
            ) : (
              <div className="news-items-list">
                {regionalNews.map((n, idx) => (
                  <div
                    key={`reg-news-${n.id || idx}`}
                    className="news-article-item clickable"
                    onClick={() =>
                      onNavigateNews
                        ? onNavigateNews("regional")
                        : handleOpenNewsModal("regional")
                    }
                  >
                    <span className="news-state-tag">{n.state}</span>
                    <h5 className="news-article-title">
                      {isHindi ? n.title_hi : n.title_en}
                    </h5>
                    <p className="news-article-summary">
                      {isHindi ? n.summary_hi : n.summary_en}
                    </p>
                    <div className="news-source-row">
                      <span
                        className="news-source-name"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Building2 size={13} style={{ flexShrink: 0 }} />
                        <span>{n.source_name}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="view-all-news-link-btn"
              onClick={() =>
                onNavigateNews
                  ? onNavigateNews("regional")
                  : handleOpenNewsModal("regional")
              }
            >
              <span>
                {isHindi
                  ? "सभी क्षेत्रीय समाचार देखें"
                  : "View All Regional News"}
              </span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* National Agriculture News Card */}
          <div className="sidebar-card news-card">
            <div
              className="sidebar-card-header clickable-header"
              onClick={() =>
                onNavigateNews
                  ? onNavigateNews("national")
                  : handleOpenNewsModal("national")
              }
            >
              <Building2 size={18} className="header-icon" />
              <h4>
                {isHindi
                  ? "राष्ट्रीय कृषि समाचार"
                  : "National Agriculture News"}
              </h4>
            </div>

            {loadingNews ? (
              <div className="sidebar-loading">
                {isHindi ? "समाचार लोड हो रहे हैं..." : "Loading news..."}
              </div>
            ) : nationalNews.length === 0 ? (
              <p className="no-news-text">
                {isHindi
                  ? "समाचार उपलब्ध नहीं हैं।"
                  : "No national news available."}
              </p>
            ) : (
              <div className="news-items-list">
                {nationalNews.map((n, idx) => (
                  <div
                    key={`nat-news-${n.id || idx}`}
                    className="news-article-item clickable"
                    onClick={() =>
                      onNavigateNews
                        ? onNavigateNews("national")
                        : handleOpenNewsModal("national")
                    }
                  >
                    <span className="news-nat-tag">
                      {isHindi ? "राष्ट्रीय" : "National"}
                    </span>
                    <h5 className="news-article-title">
                      {isHindi ? n.title_hi : n.title_en}
                    </h5>
                    <p className="news-article-summary">
                      {isHindi ? n.summary_hi : n.summary_en}
                    </p>
                    <div className="news-source-row">
                      <span
                        className="news-source-name"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Building2 size={13} style={{ flexShrink: 0 }} />
                        <span>{n.source_name}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="view-all-news-link-btn"
              onClick={() =>
                onNavigateNews
                  ? onNavigateNews("national")
                  : handleOpenNewsModal("national")
              }
            >
              <span>
                {isHindi
                  ? "सभी राष्ट्रीय समाचार देखें"
                  : "View All National News"}
              </span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Popular Crops Chips */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <Sprout size={18} className="header-icon" />
              <h4>{isHindi ? "लोकप्रिय फसलें" : "Popular Crops"}</h4>
            </div>
            <div className="crop-chips-cloud">
              {crops.map((c) => (
                <button
                  key={c.crop}
                  className={`crop-chip-btn ${selectedCrop === c.crop ? "active" : ""}`}
                  onClick={() =>
                    setSelectedCrop((prev) => (prev === c.crop ? "" : c.crop))
                  }
                >
                  <span>{translateProfileText(c.crop, language)}</span>
                  <span className="count-tag">{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories List */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <Layers size={18} className="header-icon" />
              <h4>{isHindi ? "कृषि श्रेणियां" : "Agriculture Categories"}</h4>
            </div>
            <div className="categories-list-sidebar">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`category-item-row ${selectedCategory?.id === cat.id ? "active" : ""}`}
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev?.id === cat.id ? null : cat,
                    )
                  }
                >
                  <span className="cat-name">
                    {isHindi ? cat.name_hi : cat.name_en}
                  </span>
                  <span className="cat-count">{cat.post_count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Misinformation Notice */}
          <div className="sidebar-card safety-notice-card">
            <div className="safety-title">
              <ShieldCheck size={18} />
              <span>
                {isHindi ? "कृषि सुरक्षा दिशानिर्देश" : "Community Guidelines"}
              </span>
            </div>
            <p>
              {isHindi
                ? "रासायनिक कीटनाशकों का प्रयोग केवल वैज्ञानिकों की सलाह पर ही करें। किसी भी भ्रामक जानकारी की रिपोर्ट करें।"
                : "Always verify pesticide usage with certified experts. Report misleading or harmful farming advice."}
            </p>
          </div>
        </aside>
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-card create-post-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <Plus size={22} className="modal-icon" />
                <h2>
                  {isHindi
                    ? "नया सवाल या अनुभव साझा करें"
                    : "Create Community Post"}
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreatePostSubmit}
              className="create-post-form"
            >
              <div className="form-group">
                <label>
                  {isHindi ? "सवाल या विषय का मुख्य शीर्षक *" : "Title *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isHindi
                      ? "उदा. गेहूं की पत्तियों पर पीले धब्बे दिख रहे हैं, क्या करें?"
                      : "e.g. Yellow spots on wheat leaves, what organic remedy to use?"
                  }
                  value={postForm.title}
                  onChange={(e) =>
                    setPostForm({ ...postForm, title: e.target.value })
                  }
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>{isHindi ? "श्रेणी *" : "Category *"}</label>
                  <select
                    value={postForm.category_id}
                    onChange={(e) =>
                      setPostForm({
                        ...postForm,
                        category_id: parseInt(e.target.value),
                      })
                    }
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isHindi ? c.name_hi : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    {isHindi ? "फसल (वैकल्पिक)" : "Crop (Optional)"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isHindi
                        ? "उदा. गेहूं, धान, कपास"
                        : "e.g. Wheat, Rice, Cotton"
                    }
                    value={postForm.crop}
                    onChange={(e) =>
                      setPostForm({ ...postForm, crop: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  {isHindi
                    ? "समस्या का विस्तृत विवरण *"
                    : "Detailed Description *"}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    isHindi
                      ? "लक्षण, फसल की उम्र, मिट्टी का प्रकार और आप क्या उपाय कर चुके हैं..."
                      : "Describe symptoms, crop age, soil type, and any remedies already tried..."
                  }
                  value={postForm.description}
                  onChange={(e) =>
                    setPostForm({ ...postForm, description: e.target.value })
                  }
                />
              </div>

              {/* Upload Images */}
              <div className="form-group">
                <label>
                  {isHindi ? "फसल की तस्वीर जोड़ें" : "Upload Crop Images"}
                </label>
                <div className="upload-media-box">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    className="btn-upload-trigger"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Camera size={18} />
                    <span>
                      {uploadingImage
                        ? isHindi
                          ? "अपलोड हो रहा है..."
                          : "Uploading..."
                        : isHindi
                          ? "गैलरी / कैमरे से तस्वीर चुनें"
                          : "Select Crop Photo"}
                    </span>
                  </button>

                  {postForm.media_urls.length > 0 && (
                    <div className="uploaded-preview-row">
                      {postForm.media_urls.map((url, i) => (
                        <div key={i} className="preview-thumb-wrap">
                          <img src={url} alt="Upload" />
                          <button
                            type="button"
                            onClick={() =>
                              setPostForm({
                                ...postForm,
                                media_urls: postForm.media_urls.filter(
                                  (_, idx) => idx !== i,
                                ),
                              })
                            }
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  {isHindi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="btn-publish"
                  disabled={creatingPost || uploadingImage}
                >
                  <Send size={16} />
                  <span>
                    {creatingPost
                      ? isHindi
                        ? "प्रकाशित हो रहा है..."
                        : "Publishing..."
                      : isHindi
                        ? "पोस्ट प्रकाशित करें"
                        : "Publish Post"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL NEWS MODAL / DRAWER INSIDE KRISHI SAMVAD */}
      {newsModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setNewsModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="modal-card news-in-community-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <BookOpen size={24} className="modal-icon" />
                <h2>
                  {isHindi
                    ? "दैनिक कृषि एवं मौसम समाचार"
                    : "Daily Agriculture & Weather News"}
                </h2>
              </div>
              <button
                onClick={() =>
                  setNewsModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* News Modal Sub-header / Tabs & Filters */}
            <div className="news-modal-controls-bar">
              <div className="news-modal-tab-buttons">
                <button
                  className={`news-tab-chip ${newsModal.activeTab === "all" ? "active" : ""}`}
                  onClick={() => handleNewsModalTabChange("all")}
                >
                  <Newspaper size={15} />
                  <span>{isHindi ? "सभी समाचार" : "All News"}</span>
                </button>
                <button
                  className={`news-tab-chip ${newsModal.activeTab === "regional" ? "active" : ""}`}
                  onClick={() => handleNewsModalTabChange("regional")}
                >
                  <MapPin size={15} />
                  <span>{isHindi ? "क्षेत्रीय समाचार" : "Regional"}</span>
                </button>
                <button
                  className={`news-tab-chip ${newsModal.activeTab === "national" ? "active" : ""}`}
                  onClick={() => handleNewsModalTabChange("national")}
                >
                  <Building2 size={15} />
                  <span>{isHindi ? "राष्ट्रीय समाचार" : "National"}</span>
                </button>
              </div>

              <div className="news-modal-right-actions">
                <select
                  value={newsModal.selectedState}
                  onChange={(e) => handleNewsModalStateChange(e.target.value)}
                  className="news-state-modal-select"
                >
                  <option value="All">
                    {isHindi ? "सभी राज्य (All India)" : "All India"}
                  </option>
                  <option value="Punjab">
                    {isHindi ? "पंजाब (Punjab)" : "Punjab"}
                  </option>
                  <option value="Rajasthan">
                    {isHindi ? "राजस्थान (Rajasthan)" : "Rajasthan"}
                  </option>
                  <option value="Haryana">
                    {isHindi ? "हरियाणा (Haryana)" : "Haryana"}
                  </option>
                  <option value="Madhya Pradesh">
                    {isHindi ? "मध्य प्रदेश (MP)" : "Madhya Pradesh"}
                  </option>
                  <option value="Uttar Pradesh">
                    {isHindi ? "उत्तर प्रदेश (UP)" : "Uttar Pradesh"}
                  </option>
                  <option value="Maharashtra">
                    {isHindi ? "महाराष्ट्र (MH)" : "Maharashtra"}
                  </option>
                </select>

                <button
                  className={`news-sync-btn ${newsModal.refreshing ? "loading" : ""}`}
                  onClick={handleRefreshDailyNews}
                  disabled={newsModal.refreshing}
                  title={
                    isHindi ? "दैनिक समाचार रीफ्रेश करें" : "Refresh Daily News"
                  }
                >
                  <RefreshCw
                    size={15}
                    className={newsModal.refreshing ? "spin-icon" : ""}
                  />
                  <span>
                    {newsModal.refreshing
                      ? isHindi
                        ? "अपडेट हो रहा है..."
                        : "Syncing..."
                      : isHindi
                        ? "ताजा समाचार रीफ्रेश करें"
                        : "Refresh Live News"}
                  </span>
                </button>
              </div>
            </div>

            {/* News Modal Search */}
            <div className="news-modal-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={newsModal.searchQuery}
                onChange={(e) =>
                  setNewsModal((prev) => ({
                    ...prev,
                    searchQuery: e.target.value,
                  }))
                }
                placeholder={
                  isHindi
                    ? "समाचार, फसल सलाह, एमएसपी या राज्य खोजें..."
                    : "Search news, MSP, crop advisories, or state..."
                }
              />
            </div>

            {/* News Modal Articles List */}
            <div className="news-modal-articles-scroll">
              {newsModal.loading ? (
                <div className="modal-loading-state">
                  <div className="loading-spinner"></div>
                  <p>
                    {isHindi
                      ? "दैनिक कृषि समाचार लोड हो रहे हैं..."
                      : "Loading agriculture news..."}
                  </p>
                </div>
              ) : modalFilteredArticles.length === 0 ? (
                <div className="modal-empty-state">
                  <BookOpen size={40} />
                  <p>
                    {isHindi
                      ? "इस फ़िल्टर के लिए कोई समाचार उपलब्ध नहीं है।"
                      : "No news articles available for this filter."}
                  </p>
                </div>
              ) : (
                <div className="news-modal-cards-grid">
                  {modalFilteredArticles.map((art) => (
                    <div key={art.id} className="news-in-modal-card">
                      <div className="news-in-modal-meta">
                        <span
                          className={`news-state-chip ${art.news_type === "regional" ? "regional" : "national"}`}
                        >
                          {art.news_type === "regional"
                            ? art.state || "Regional"
                            : isHindi
                              ? "राष्ट्रीय"
                              : "National"}
                        </span>
                        <span className="news-date-meta">
                          <Calendar size={12} />
                          <span>{art.published_at}</span>
                        </span>
                      </div>

                      <h4 className="news-in-modal-title">
                        {isHindi ? art.title_hi : art.title_en}
                      </h4>
                      <p className="news-in-modal-summary">
                        {isHindi ? art.summary_hi : art.summary_en}
                      </p>

                      <div className="news-in-modal-footer">
                        <span className="news-source-badge">
                          <Building2 size={13} />
                          <span>{art.source_name}</span>
                        </span>

                        <a
                          href={art.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="news-official-link-btn"
                        >
                          <span>
                            {isHindi ? "आधिकारिक पोर्टल" : "Official Link"}
                          </span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR IMAGES */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Enlarged" className="lightbox-image" />
          <button
            className="lightbox-close-btn"
            onClick={() => setLightboxImg(null)}
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* REPORT CONTENT MODAL */}
      {reportModalData && (
        <div className="modal-overlay" onClick={() => setReportModalData(null)}>
          <div
            className="modal-card report-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <Flag size={20} className="modal-icon" />
                <h2>
                  {isHindi ? "सामग्री की रिपोर्ट करें" : "Report Content"}
                </h2>
              </div>
              <button
                onClick={() => setReportModalData(null)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="report-modal-body">
              <p>
                {isHindi
                  ? "कृपया रिपोर्ट करने का उचित कारण चुनें। हमारी कृषि विशेषज्ञ टीम इसकी जांच करेगी:"
                  : "Please choose a reason. Our moderation team will investigate:"}
              </p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="report-select"
              >
                <option value="misinformation">
                  {isHindi
                    ? "भ्रामक या गलत कृषि सलाह"
                    : "Misleading or incorrect farming advice"}
                </option>
                <option value="harmful_chemicals">
                  {isHindi
                    ? "हानिकारक या प्रतिबंधित रसायन की सिफारिश"
                    : "Harmful or banned chemical recommendation"}
                </option>
                <option value="spam">
                  {isHindi
                    ? "स्पैम या अनुचित विज्ञापन"
                    : "Spam or irrelevant advertising"}
                </option>
                <option value="abusive">
                  {isHindi
                    ? "अभद्र भाषा या दुर्व्यवहार"
                    : "Abusive language or harassment"}
                </option>
              </select>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setReportModalData(null)}
              >
                {isHindi ? "रद्द करें" : "Cancel"}
              </button>
              <button
                type="button"
                className="btn-publish"
                onClick={handleSubmitReport}
              >
                {isHindi ? "रिपोर्ट भेजें" : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FARMER PROFILE MODAL */}
      {viewProfileId && (
        <div className="modal-overlay" onClick={() => setViewProfileId(null)}>
          <div
            className="modal-card profile-preview-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <Users size={20} className="modal-icon" />
                <h2>{isHindi ? "किसान प्रोफाइल" : "Farmer Profile"}</h2>
              </div>
              <button
                onClick={() => setViewProfileId(null)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {loadingProfile ? (
              <div className="profile-loading">
                <div className="loading-spinner"></div>
                <p>
                  {isHindi ? "प्रोफाइल लोड हो रही है..." : "Loading profile..."}
                </p>
              </div>
            ) : profileData ? (
              <div className="profile-preview-content">
                <div className="profile-top-hero">
                  <div className="profile-avatar-big">
                    {profileData.name?.charAt(0) || "F"}
                  </div>
                  <div className="profile-main-meta">
                    <h3>{translateProfileText(profileData.name, language)}</h3>
                    {profileData.is_verified_expert && (
                      <span className="expert-badge-big">
                        <ShieldCheck size={16} />
                        <span>
                          {profileData.expert_title ||
                            (isHindi
                              ? "सत्यापित कृषि विशेषज्ञ"
                              : "Verified Agri Expert")}
                        </span>
                      </span>
                    )}
                    <p className="profile-loc">
                      <MapPin size={13} />
                      <span>
                        {translateProfileText(profileData.location, language)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="profile-stats-grid">
                  <div className="stat-box">
                    <span className="stat-val">{profileData.reputation}</span>
                    <span className="stat-lbl">
                      {isHindi ? "प्रतिष्ठा अंक" : "Reputation"}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">{profileData.posts_count}</span>
                    <span className="stat-lbl">
                      {isHindi ? "पूछे गए सवाल" : "Posts"}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {profileData.solutions_count}
                    </span>
                    <span className="stat-lbl">
                      {isHindi ? "स्वीकृत समाधान" : "Solutions"}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {profileData.followers_count}
                    </span>
                    <span className="stat-lbl">
                      {isHindi ? "फॉलोअर्स" : "Followers"}
                    </span>
                  </div>
                </div>

                {!profileData.is_me && (
                  <button
                    className={`btn-profile-follow ${profileData.is_following ? "following" : ""}`}
                    onClick={() => handleToggleFollow(profileData.id)}
                  >
                    {profileData.is_following ? (
                      <>
                        <UserCheck size={16} />
                        <span>{isHindi ? "फॉलो किया गया" : "Following"}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>
                          {isHindi ? "किसान को फॉलो करें" : "Follow Farmer"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p>{isHindi ? "प्रोफाइल नहीं मिली" : "Profile not found"}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
