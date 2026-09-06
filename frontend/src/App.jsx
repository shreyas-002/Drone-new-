import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SelectedFieldPage from "./pages/SelectedFieldPage";
import CommunityPage from "./pages/CommunityPage";
import NewsPage from "./pages/NewsPage";
import AboutPage from "./pages/AboutPage";
import SurveyInsightsPage from "./pages/SurveyInsightsPage";
import CreateProfileModal from "./components/CreateProfileModal";
import { loginUserApi } from "./services/api";

export default function App() {
  // Page states: 'dashboard' | 'field' | 'community' | 'news' | 'about' | 'survey' | 'login'
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem("farmhawk_current_page") || "dashboard";
  });

  const [selectedFieldId, setSelectedFieldId] = useState(() => {
    const saved = localStorage.getItem("farmhawk_selected_field_id");
    return saved ? Number(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("farmhawk_active_tab") || "data";
  });

  const [newsInitialTab, setNewsInitialTab] = useState(() => {
    return localStorage.getItem("farmhawk_news_tab") || "all";
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("farmhawk_language") || "hi";
  });

  // User Profile State with local storage persistence
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem("farmhawk_user_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (e) {}
    }
    return {
      name: "",
      location: "",
      state: "",
      district: "",
      pincode: "",
      phone: "+91 9981087718",
      phone: "",
      isCreated: false,
    };
  });

  // Persist navigation & preferences to localStorage
  useEffect(() => {
    localStorage.setItem("farmhawk_current_page", currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (selectedFieldId !== null && selectedFieldId !== undefined) {
      localStorage.setItem(
        "farmhawk_selected_field_id",
        String(selectedFieldId),
      );
    } else {
      localStorage.removeItem("farmhawk_selected_field_id");
    }
  }, [selectedFieldId]);

  useEffect(() => {
    localStorage.setItem("farmhawk_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("farmhawk_news_tab", newsInitialTab);
  }, [newsInitialTab]);

  useEffect(() => {
    localStorage.setItem("farmhawk_language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("farmhawk_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  // Profile modal control
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLoginSuccess = async (loginData) => {
    await loginUserApi(loginData.email, loginData.password);
    setCurrentPage("dashboard");
    setSelectedFieldId(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (newProfile) => {
    setUserProfile(newProfile);
    setShowProfileModal(false);
  };

  const handleLogout = () => {
    setCurrentPage("login");
    setSelectedFieldId(null);
    localStorage.removeItem("farmhawk_selected_field_id");
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "hi" ? "en" : "hi"));
  };

  const handleNavigateNews = (tab = "all") => {
    setNewsInitialTab(tab);
    setCurrentPage("news");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateTab = (tabName) => {
    if (tabName === "dashboard") {
      setCurrentPage("dashboard");
      setSelectedFieldId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabName === "community") {
      setCurrentPage("community");
      setSelectedFieldId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabName === "about") {
      setCurrentPage("about");
      setSelectedFieldId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabName === "survey") {
      setCurrentPage("survey");
      setSelectedFieldId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tabName === "news") {
      setNewsInitialTab("all");
      setCurrentPage("news");
      setSelectedFieldId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setCurrentPage("field");
      setActiveTab(tabName);
    }
  };

  const handleSelectField = (fieldId) => {
    setSelectedFieldId(fieldId);
    setCurrentPage("field");
    setActiveTab("data");
  };

  return (
    <div className="app-root">
      {currentPage === "login" ? (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          language={language}
          onToggleLanguage={toggleLanguage}
        />
      ) : currentPage === "community" ? (
        <CommunityPage
          userProfile={userProfile}
          onNavigateHome={() => handleNavigateTab("dashboard")}
          onNavigateNews={handleNavigateNews}
          onNavigateAbout={() => handleNavigateTab("about")}
          onNavigateSurvey={() => handleNavigateTab("survey")}
          language={language}
          onToggleLanguage={toggleLanguage}
          onLogout={handleLogout}
        />
      ) : currentPage === "survey" ? (
        <SurveyInsightsPage
          onNavigateHome={() => handleNavigateTab("dashboard")}
          onNavigateCommunity={() => handleNavigateTab("community")}
          onNavigateAbout={() => handleNavigateTab("about")}
          language={language}
          onToggleLanguage={toggleLanguage}
          onLogout={handleLogout}
        />
      ) : currentPage === "about" ? (
        <AboutPage
          onNavigateHome={() => handleNavigateTab("dashboard")}
          onNavigateCommunity={() => handleNavigateTab("community")}
          onNavigateSurvey={() => handleNavigateTab("survey")}
          language={language}
          onToggleLanguage={toggleLanguage}
          onLogout={handleLogout}
        />
      ) : currentPage === "news" ? (
        <NewsPage
          initialTab={newsInitialTab}
          userProfile={userProfile}
          onNavigateHome={() => handleNavigateTab("dashboard")}
          onNavigateCommunity={() => handleNavigateTab("community")}
          onNavigateAbout={() => handleNavigateTab("about")}
          onNavigateSurvey={() => handleNavigateTab("survey")}
          language={language}
          onToggleLanguage={toggleLanguage}
          onLogout={handleLogout}
        />
      ) : currentPage === "field" ? (
        <SelectedFieldPage
          fieldId={selectedFieldId}
          onBack={() => handleNavigateTab("dashboard")}
          language={language}
          onToggleLanguage={toggleLanguage}
          onLogout={handleLogout}
          farmerName={userProfile.name}
          initialTab={activeTab}
          onNavigateTab={handleNavigateTab}
        />
      ) : (
        <DashboardPage
          userProfile={userProfile}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onLogout={handleLogout}
          language={language}
          onToggleLanguage={toggleLanguage}
          onSelectField={handleSelectField}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* Profile Creation / Completion Modal */}
      {showProfileModal && (
        <CreateProfileModal
          initialProfile={userProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileModal(false)}
          language={language}
        />
      )}
    </div>
  );
}
