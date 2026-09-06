import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  Newspaper,
  Globe,
  LogOut,
  MapPin,
  Calendar,
  ExternalLink,
  Search,
  ArrowLeft,
  Building2,
  ShieldCheck,
  Tag,
  ChevronRight,
  BookOpen,
  RefreshCw,
  Sparkles,
  Info,
  BarChart3,
} from "lucide-react";
import logoImg from "../assets/logo.png";
import { getAllNewsApi, refreshDailyNewsApi } from "../services/api";
import "../styles/NewsPage.css";

export default function NewsPage({
  initialTab = "all",
  userProfile,
  onNavigateHome,
  onNavigateCommunity,
  onNavigateAbout,
  onNavigateSurvey,
  language = "hi",
  onToggleLanguage,
  onLogout,
}) {
  const isHindi = language === "hi";

  const [activeNewsTab, setActiveNewsTab] = useState(initialTab || "all"); // 'all' | 'regional' | 'national'
  const [selectedState, setSelectedState] = useState(
    userProfile?.state || "All",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (initialTab) {
      setActiveNewsTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    loadNews();
  }, [selectedState, activeNewsTab]);

  const loadNews = async () => {
    setLoading(true);
    const data = await getAllNewsApi({
      newsType: activeNewsTab,
      state: selectedState === "All" ? "" : selectedState,
      search: searchQuery,
      limit: 60,
    });

    if (data?.news) {
      setNewsArticles(data.news);
    }
    setLoading(false);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    const res = await refreshDailyNewsApi();
    if (res?.status === "success") {
      setToastMsg(
        isHindi
          ? "✓ ताजा दैनिक कृषि समाचार अपडेट हो गए हैं!"
          : "✓ Daily agriculture news updated successfully!",
      );
      setTimeout(() => setToastMsg(""), 3500);
      await loadNews();
    }
    setRefreshing(false);
  };

  const filteredNews = newsArticles.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch =
        item.title_en?.toLowerCase().includes(q) ||
        item.title_hi?.toLowerCase().includes(q);
      const summaryMatch =
        item.summary_en?.toLowerCase().includes(q) ||
        item.summary_hi?.toLowerCase().includes(q);
      const sourceMatch = item.source_name?.toLowerCase().includes(q);
      const stateMatch = item.state?.toLowerCase().includes(q);
      const tagsMatch = item.tags?.toLowerCase().includes(q);
      return (
        titleMatch || summaryMatch || sourceMatch || stateMatch || tagsMatch
      );
    }
    return true;
  });

  return (
    <div className="news-page-root">
      {/* Toast Notification */}
      {toastMsg && <div className="news-toast-notification">{toastMsg}</div>}

      {/* Top Header */}
      <header className="news-header">
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

          <button className="header-nav-btn" onClick={onNavigateCommunity}>
            <Users size={18} />
            <span>{isHindi ? "कृषि संवाद" : "Krishi Samvad"}</span>
          </button>

          <button className="header-nav-btn" onClick={onNavigateSurvey}>
            <BarChart3 size={18} />
            <span>{isHindi ? "सर्वे परिणाम" : "Survey Results"}</span>
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

      {/* Hero Banner */}
      <div className="news-hero-banner">
        <div className="news-hero-content">
          <div className="news-hero-title-group">
            <button
              className="news-back-to-community-btn"
              onClick={onNavigateCommunity}
            >
              <ArrowLeft size={16} />
              <span>
                {isHindi ? "कृषि संवाद पर वापस जाएं" : "Back to Krishi Samvad"}
              </span>
            </button>

            <div className="news-badge-top">
              <ShieldCheck size={16} />
              <span>
                {isHindi
                  ? "प्रमाणित सरकारी एवं वैज्ञानिक स्रोत (Daily Live Updates)"
                  : "Verified Govt & Scientific Sources (Daily Live Updates)"}
              </span>
            </div>

            <h1 className="news-hero-title">
              {activeNewsTab === "regional"
                ? isHindi
                  ? "क्षेत्रीय कृषि एवं मौसम समाचार"
                  : "Regional Agricultural News"
                : activeNewsTab === "national"
                  ? isHindi
                    ? "राष्ट्रीय कृषि एवं नीति समाचार"
                    : "National Agricultural News"
                  : isHindi
                    ? "दैनिक कृषि एवं मौसम समाचार पोर्टल"
                    : "Daily Agricultural & Weather News Portal"}
            </h1>

            <p className="news-hero-tagline">
              {isHindi
                ? "भारतीय कृषि अनुसंधान परिषद (ICAR), मौसम विभाग (IMD), राज्य कृषि विभागों एवं कृषि मंत्रालय से दैनिक आधिकारिक अपडेट।"
                : "Live daily advisories, MSP announcements, weather warnings, and policy notifications directly from ICAR and State Departments."}
            </p>
          </div>

          {/* Search Bar & Refresh Row */}
          <div className="news-search-refresh-bar">
            <div className="news-search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHindi
                    ? "समाचार, फसल सलाह, सरकारी योजना, एमएसपी या राज्य खोजें..."
                    : "Search news, crop advisory, MSP, schemes, or state..."
                }
              />
            </div>

            <button
              className={`news-refresh-btn ${refreshing ? "loading" : ""}`}
              onClick={handleManualRefresh}
              disabled={refreshing}
              title={isHindi ? "दैनिक समाचार अपडेट करें" : "Refresh Daily News"}
            >
              <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
              <span>
                {refreshing
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
      </div>

      {/* Filter Tabs Bar */}
      <div className="news-filter-tabs-bar">
        <div className="news-tabs-container">
          <div className="news-type-tabs">
            <button
              className={`news-tab-btn ${activeNewsTab === "all" ? "active" : ""}`}
              onClick={() => setActiveNewsTab("all")}
            >
              <Newspaper size={16} />
              <span>{isHindi ? "सभी समाचार" : "All News"}</span>
            </button>

            <button
              className={`news-tab-btn ${activeNewsTab === "regional" ? "active" : ""}`}
              onClick={() => setActiveNewsTab("regional")}
            >
              <MapPin size={16} />
              <span>{isHindi ? "क्षेत्रीय कृषि समाचार" : "Regional News"}</span>
            </button>

            <button
              className={`news-tab-btn ${activeNewsTab === "national" ? "active" : ""}`}
              onClick={() => setActiveNewsTab("national")}
            >
              <Building2 size={16} />
              <span>{isHindi ? "राष्ट्रीय कृषि समाचार" : "National News"}</span>
            </button>
          </div>

          {/* State Filter Dropdown */}
          <div className="news-state-filter">
            <label>{isHindi ? "राज्य चुनें:" : "Filter by State:"}</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
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
                {isHindi ? "मध्य प्रदेश (Madhya Pradesh)" : "Madhya Pradesh"}
              </option>
              <option value="Uttar Pradesh">
                {isHindi ? "उत्तर प्रदेश (Uttar Pradesh)" : "Uttar Pradesh"}
              </option>
              <option value="Maharashtra">
                {isHindi ? "महाराष्ट्र (Maharashtra)" : "Maharashtra"}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Main News Content Area */}
      <main className="news-main-container">
        <div className="news-results-count-bar">
          <span>
            {isHindi
              ? `कुल ${filteredNews.length} समाचार बुलेटिन उपलब्ध`
              : `Showing ${filteredNews.length} news bulletins`}
          </span>
        </div>

        {loading ? (
          <div className="news-loading-card">
            <div className="loading-spinner"></div>
            <p>
              {isHindi
                ? "आधिकारिक कृषि समाचार लोड हो रहे हैं..."
                : "Loading official agricultural news..."}
            </p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="news-empty-card">
            <BookOpen size={48} className="empty-icon" />
            <h3>
              {isHindi ? "कोई समाचार उपलब्ध नहीं है" : "No news articles found"}
            </h3>
            <p>
              {isHindi
                ? "चयनित राज्य या फ़िल्टर के लिए इस समय कोई समाचार नहीं मिला।"
                : "No news articles available for the selected filters."}
            </p>
          </div>
        ) : (
          <div className="news-articles-grid">
            {filteredNews.map((article) => (
              <article key={article.id} className="news-card-full">
                <div className="news-card-top-meta">
                  <span
                    className={`news-type-badge ${article.news_type === "regional" ? "regional" : "national"}`}
                  >
                    {article.news_type === "regional"
                      ? isHindi
                        ? `क्षेत्रीय • ${article.state || "राज्य"}`
                        : `Regional • ${article.state || "State"}`
                      : isHindi
                        ? "राष्ट्रीय समाचार"
                        : "National News"}
                  </span>

                  <span className="news-date-meta">
                    <Calendar size={13} />
                    <span>{article.published_at}</span>
                  </span>
                </div>

                <h3 className="news-card-headline">
                  {isHindi ? article.title_hi : article.title_en}
                </h3>

                <p className="news-card-excerpt">
                  {isHindi ? article.summary_hi : article.summary_en}
                </p>

                <div className="news-card-footer">
                  <div className="news-source-badge">
                    <Building2 size={14} />
                    <span>{article.source_name}</span>
                  </div>

                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="news-read-official-btn"
                  >
                    <span>
                      {isHindi ? "आधिकारिक पोर्टल" : "Official Source"}
                    </span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
