import React, { useState } from "react";
import {
  Sprout,
  Globe,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
} from "lucide-react";
import { surveyQuestions } from "./data/surveyQuestions";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const initialAnswers = {
  crops: [],
  farmland_size: "",
  irrigation: "",
  operational_challenges: [],
  inspection_difficulty: null,
  late_discovery_frequency: "",
  advice_source: "",
  early_warning_rating: null,
  pesticide_problems: [],
  drone_spraying_value: null,
  valuable_features: [],
  krishi_samvad_usefulness: "",
  preferred_alert_method: "",
  adoption_concerns: [],
  biggest_problem: "",
};

export default function App() {
  const [lang, setLang] = useState("en"); // "en" or "hi"
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [otherTexts, setOtherTexts] = useState({});
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const totalQuestions = surveyQuestions.length;
  const currentQ = surveyQuestions[currentStep];

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "hi" : "en"));
  };

  const isOtherOption = (opt) => {
    return typeof opt === "string" && (opt.startsWith("Other") || opt.includes("अन्य"));
  };

  const isCurrentQuestionValid = () => {
    const val = answers[currentQ.key];

    if (currentQ.type === "single") {
      if (typeof val !== "string" || val.trim().length === 0) return false;
      if (isOtherOption(val) && (!otherTexts[currentQ.key] || !otherTexts[currentQ.key].trim())) {
        return false;
      }
      return true;
    }

    if (currentQ.type === "multiple") {
      if (!Array.isArray(val) || val.length === 0) return false;
      if (currentQ.maxSelection && val.length > currentQ.maxSelection) return false;
      if (val.some(isOtherOption) && (!otherTexts[currentQ.key] || !otherTexts[currentQ.key].trim())) {
        return false;
      }
      return true;
    }

    if (currentQ.type === "rating") {
      return typeof val === "number" && val >= 1 && val <= 5;
    }

    if (currentQ.type === "text") {
      return typeof val === "string" && val.trim().length > 0;
    }

    return false;
  };

  const handleSingleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [currentQ.key]: option }));
    setValidationError("");
  };

  const handleMultiSelect = (option) => {
    setValidationError("");
    const currentList = answers[currentQ.key] || [];

    if (currentList.includes(option)) {
      // Unselect
      setAnswers((prev) => ({
        ...prev,
        [currentQ.key]: currentList.filter((item) => item !== option),
      }));
    } else {
      // Check max limit (e.g. Q11 max 3)
      if (currentQ.maxSelection && currentList.length >= currentQ.maxSelection) {
        setValidationError(
          lang === "en"
            ? `You can select a maximum of ${currentQ.maxSelection} features.`
            : `आप अधिकतम ${currentQ.maxSelection} सुविधाएँ चुन सकते हैं।`
        );
        return;
      }
      setAnswers((prev) => ({
        ...prev,
        [currentQ.key]: [...currentList, option],
      }));
    }
  };

  const handleOtherTextChange = (key, text) => {
    setOtherTexts((prev) => ({ ...prev, [key]: text }));
    setValidationError("");
  };

  const handleRatingSelect = (val) => {
    setAnswers((prev) => ({ ...prev, [currentQ.key]: Number(val) }));
    setValidationError("");
  };

  const handleTextChange = (e) => {
    setAnswers((prev) => ({ ...prev, [currentQ.key]: e.target.value }));
    setValidationError("");
  };

  const handleNext = () => {
    const val = answers[currentQ.key];
    if (
      (currentQ.type === "single" && isOtherOption(val) && (!otherTexts[currentQ.key] || !otherTexts[currentQ.key].trim())) ||
      (currentQ.type === "multiple" && Array.isArray(val) && val.some(isOtherOption) && (!otherTexts[currentQ.key] || !otherTexts[currentQ.key].trim()))
    ) {
      setValidationError(
        lang === "en"
          ? "Please specify details for 'Other'."
          : "कृपया 'अन्य' का विवरण लिखें।"
      );
      return;
    }

    if (!isCurrentQuestionValid()) {
      setValidationError(
        lang === "en"
          ? "Please answer this question to proceed."
          : "आगे बढ़ने के लिए कृपया इस प्रश्न का उत्तर दें।"
      );
      return;
    }

    setValidationError("");
    if (currentStep < totalQuestions - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setValidationError("");
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "surv-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
  };

  const formatSingleVal = (key) => {
    const val = answers[key];
    if (isOtherOption(val)) {
      const custom = otherTexts[key] ? otherTexts[key].trim() : "";
      return custom ? `Other (${custom})` : val;
    }
    return val;
  };

  const formatMultiVal = (key) => {
    const list = answers[key] || [];
    return list.map((item) => {
      if (isOtherOption(item)) {
        const custom = otherTexts[key] ? otherTexts[key].trim() : "";
        return custom ? `Other (${custom})` : item;
      }
      return item;
    });
  };

  const handleSubmit = async () => {
    if (!isCurrentQuestionValid()) {
      setValidationError(
        lang === "en"
          ? "Please answer this question before submitting."
          : "प्रस्तुत करने से पहले कृपया इस प्रश्न का उत्तर दें।"
      );
      return;
    }

    setValidationError("");
    setSubmitError("");
    setSubmitting(true);

    const payload = {
      response_id: generateUUID(),
      submitted_at: new Date().toISOString(),
      crops: formatMultiVal("crops"),
      farmland_size: formatSingleVal("farmland_size"),
      irrigation: formatSingleVal("irrigation"),
      operational_challenges: formatMultiVal("operational_challenges"),
      inspection_difficulty: Number(answers.inspection_difficulty),
      late_discovery_frequency: formatSingleVal("late_discovery_frequency"),
      advice_source: formatSingleVal("advice_source"),
      early_warning_rating: Number(answers.early_warning_rating),
      pesticide_problems: formatMultiVal("pesticide_problems"),
      drone_spraying_value: Number(answers.drone_spraying_value),
      valuable_features: formatMultiVal("valuable_features"),
      krishi_samvad_usefulness: formatSingleVal("krishi_samvad_usefulness"),
      preferred_alert_method: formatSingleVal("preferred_alert_method"),
      adoption_concerns: formatMultiVal("adoption_concerns"),
      biggest_problem: answers.biggest_problem,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/survey/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        throw new Error(result.message || "Failed to submit survey");
      }
    } catch (err) {
      console.error("Survey submission error:", err);
      setSubmitError(
        lang === "en"
          ? "We couldn't submit your response. Please check your connection and try again."
          : "हम आपका उत्तर प्रस्तुत नहीं कर सके। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers(initialAnswers);
    setOtherTexts({});
    setCurrentStep(0);
    setSubmitted(false);
    setValidationError("");
    setSubmitError("");
  };

  return (
    <div className="survey-app">
      {/* Header */}
      <header className="app-header">
        <div className="brand-container">
          <div className="brand-logo" style={{ background: "transparent" }}>
            <img src="/logo.png" alt="FarmHawk Logo" style={{ height: "42px", borderRadius: "6px" }} />
          </div>
          <div className="brand-info">
            <h1>FarmHawk</h1>
            <p>
              {lang === "en"
                ? "Smart Farming & Crop Health Survey"
                : "स्मार्ट फार्मिंग एवं फसल स्वास्थ्य सर्वेक्षण"}
            </p>
          </div>
        </div>

        <button
          className="lang-toggle-btn"
          onClick={toggleLanguage}
          title="Toggle Language"
        >
          <Globe size={16} />
          <span>{lang === "en" ? "हिंदी" : "English"}</span>
        </button>
      </header>

      {/* Success View */}
      {submitted ? (
        <div className="success-card">
          <div className="success-icon-badge">
            <CheckCircle2 size={48} />
          </div>
          <h2>{lang === "en" ? "Thank You!" : "धन्यवाद!"}</h2>
          <p>
            {lang === "en"
              ? "Your FarmHawk survey response has been recorded successfully. Your feedback will help us build better smart farming and crop protection technology for farmers."
              : "आपका FarmHawk सर्वेक्षण उत्तर सफलतापूर्वक दर्ज कर लिया गया है। आपकी प्रतिक्रिया से हमें किसानों के लिए बेहतर स्मार्ट फार्मिंग तकनीक बनाने में मदद मिलेगी।"}
          </p>

          <button className="btn-reset" onClick={handleReset}>
            <RotateCcw size={18} />
            <span>
              {lang === "en"
                ? "Submit Another Response"
                : "दूसरा उत्तर जमा करें"}
            </span>
          </button>
        </div>
      ) : (
        /* Multi-Step Survey Form */
        <>
          {/* Progress Tracker */}
          <div className="progress-card">
            <div className="progress-info">
              <span>
                {lang === "en"
                  ? `Question ${currentStep + 1} of ${totalQuestions}`
                  : `प्रश्न ${currentStep + 1} / ${totalQuestions}`}
              </span>
              <span>
                {Math.round(((currentStep + 1) / totalQuestions) * 100)}%
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentStep + 1) / totalQuestions) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Question View Card */}
          <div className="question-card">
            <h2 className="question-title">
              {currentQ.question.en && currentQ.question.hi
                ? (lang === "en"
                    ? `${currentQ.question.en} (${currentQ.question.hi})`
                    : `${currentQ.question.hi} (${currentQ.question.en})`)
                : currentQ.question[lang]}
            </h2>
            {currentQ.subtitle && (
              <p className="question-subtitle">
                {currentQ.subtitle.en && currentQ.subtitle.hi
                  ? (lang === "en"
                      ? `${currentQ.subtitle.en} (${currentQ.subtitle.hi})`
                      : `${currentQ.subtitle.hi} (${currentQ.subtitle.en})`)
                  : currentQ.subtitle[lang]}
              </p>
            )}

            {/* Single Select Question */}
            {currentQ.type === "single" && (
              <div className="options-list">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.key] === opt;
                  const isOther = isOtherOption(opt);
                  return (
                    <div key={idx} className="option-card-wrapper">
                      <div
                        className={`option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSingleSelect(opt)}
                      >
                        <div className="option-indicator">
                          {isSelected && <Check size={14} />}
                        </div>
                        <span className="option-text">{opt}</span>
                      </div>

                      {isSelected && isOther && (
                        <div
                          className="other-input-container"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            className="other-text-input"
                            placeholder={
                              lang === "en"
                                ? "Please specify details for Other..."
                                : "कृपया 'अन्य' का विवरण लिखें..."
                            }
                            value={otherTexts[currentQ.key] || ""}
                            onChange={(e) =>
                              handleOtherTextChange(currentQ.key, e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Multiple Select Question */}
            {currentQ.type === "multiple" && (
              <div className="options-list">
                {currentQ.options.map((opt, idx) => {
                  const selectedList = answers[currentQ.key] || [];
                  const isSelected = selectedList.includes(opt);
                  const isOther = isOtherOption(opt);
                  return (
                    <div key={idx} className="option-card-wrapper">
                      <div
                        className={`option-card checkbox ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => handleMultiSelect(opt)}
                      >
                        <div className="option-indicator">
                          {isSelected && <Check size={14} />}
                        </div>
                        <span className="option-text">{opt}</span>
                      </div>

                      {isSelected && isOther && (
                        <div
                          className="other-input-container"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            className="other-text-input"
                            placeholder={
                              lang === "en"
                                ? "Please specify details for Other..."
                                : "कृपया 'अन्य' का विवरण लिखें..."
                            }
                            value={otherTexts[currentQ.key] || ""}
                            onChange={(e) =>
                              handleOtherTextChange(currentQ.key, e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rating Question (1 to 5) */}
            {currentQ.type === "rating" && (
              <div className="rating-container">
                <div className="rating-grid">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isSelected = answers[currentQ.key] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        className={`rating-btn ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => handleRatingSelect(val)}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
                <div className="rating-labels">
                  <span>1 — {currentQ.labels.low[lang]}</span>
                  <span>5 — {currentQ.labels.high[lang]}</span>
                </div>
              </div>
            )}

            {/* Text Input Question */}
            {currentQ.type === "text" && (
              <textarea
                className="textarea-control"
                placeholder={
                  currentQ.placeholder.en && currentQ.placeholder.hi
                    ? lang === "en"
                      ? `${currentQ.placeholder.en} (${currentQ.placeholder.hi})`
                      : `${currentQ.placeholder.hi} (${currentQ.placeholder.en})`
                    : currentQ.placeholder[lang]
                }
                value={answers[currentQ.key] || ""}
                onChange={handleTextChange}
                rows={5}
              />
            )}

            {/* Validation / Submit Errors */}
            {validationError && (
              <div className="error-alert">
                <AlertCircle size={18} />
                <span>{validationError}</span>
              </div>
            )}

            {submitError && (
              <div className="error-alert">
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="actions-bar">
            <button
              className="btn-nav btn-prev"
              onClick={handlePrev}
              disabled={currentStep === 0 || submitting}
            >
              <ChevronLeft size={18} />
              <span>{lang === "en" ? "Previous" : "पिछला"}</span>
            </button>

            {currentStep < totalQuestions - 1 ? (
              <button
                className="btn-nav btn-next"
                onClick={handleNext}
                disabled={submitting}
              >
                <span>{lang === "en" ? "Next" : "अगला"}</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                className="btn-nav btn-submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? lang === "en"
                      ? "Submitting..."
                      : "जमा हो रहा है..."
                    : lang === "en"
                    ? "Submit Response"
                    : "उत्तर जमा करें"}
                </span>
                {!submitting && <Send size={16} />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
