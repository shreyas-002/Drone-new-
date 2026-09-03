import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SelectedFieldPage from "./pages/SelectedFieldPage";
import CommunityPage from "./pages/CommunityPage";
import NewsPage from "./pages/NewsPage";
import AboutPage from "./pages/AboutPage";
import CreateProfileModal from "./components/CreateProfileModal";
import { loginUserApi } from "./services/api";

export default function App() {
  // Page states: 'dashboard' | 'field' | 'community' | 'news' | 'about' | 'login'
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [activeTab, setActiveTab] = useState("data");
  const [newsInitialTab, setNewsInitialTab] = useState("all");
  const [language, setLanguage] = useState("hi");

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: "Anant",
    location: "Ludhiana, Punjab",
    state: "Punjab",
    district: "Ludhiana",
    pincode: "141001",
    phone: "+91 98765 43210",
    isCreated: true,
  });

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
          language={language}
          onToggleLanguage={toggleLanguage}
          onLogout={handleLogout}
        />
      ) : currentPage === "about" ? (
        <AboutPage
          onNavigateHome={() => handleNavigateTab("dashboard")}
          onNavigateCommunity={() => handleNavigateTab("community")}
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
