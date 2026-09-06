import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  RefreshCw,
  Trash2,
  Upload,
  Camera,
  Bug,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Sliders,
  Smartphone,
  Monitor,
  Zap,
  Radio,
} from "lucide-react";
import {
  getFieldDetectionsApi,
  clearFieldDetectionsApi,
  analyzeFieldFrameApi,
  launchDesktopFeedApi,
  testDatasetSampleApi,
} from "../services/api";

const API_BASE_URL = "http://localhost:5001/api";

export default function LiveFeedView({ field, isHindi = false }) {
  // Feed Engine: 'browser' (HTML5 WebCam + Live CNN Loop) or 'backend' (OpenCV MJPEG Stream)
  const [feedMode, setFeedMode] = useState("browser");
  const [isFeedActive, setIsFeedActive] = useState(false);
  const [confidenceThresh, setConfidenceThresh] = useState(0.35);

  // Available camera video inputs (Mac webcam vs iPhone Continuity Camera)
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // Backend OpenCV camera index (0 = Mac, 1 = iPhone)
  const [backendCamIdx, setBackendCamIdx] = useState(0);

  // Detections list (max 25 values)
  const [detections, setDetections] = useState([]);
  const [loadingDetections, setLoadingDetections] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Browser Camera Refs
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const loopIntervalRef = useRef(null);

  // Snapshot / File upload state
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState(null);
  const fileInputRef = useRef(null);

  // Error and status state
  const [cameraError, setCameraError] = useState("");
  const [streamKey, setStreamKey] = useState(Date.now());
  const [fps, setFps] = useState(0);
  const [activeDetectionsCount, setActiveDetectionsCount] = useState({ insects: 0, pests: 0 });

  // Enumerate video devices on mount
  useEffect(() => {
    enumerateCameras();
    if (field?.id) {
      loadDetections();
    }
    return () => {
      stopBrowserCamera();
    };
  }, [field?.id]);

  // Periodic table auto-refresh
  useEffect(() => {
    let intervalId;
    if (autoRefresh && field?.id) {
      intervalId = setInterval(() => {
        loadDetections(false);
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, field?.id]);

  const enumerateCameras = async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn("Could not enumerate camera devices:", err);
    }
  };

  const loadDetections = async (showLoading = true) => {
    if (!field?.id) return;
    if (showLoading) setLoadingDetections(true);
    try {
      const res = await getFieldDetectionsApi(field.id, 25);
      if (res && Array.isArray(res.detections)) {
        setDetections(res.detections.slice(0, 25));
      }
    } catch (err) {
      console.error("Error loading detections:", err);
    } finally {
      if (showLoading) setLoadingDetections(false);
    }
  };

  const handleClearDetections = async () => {
    if (!field?.id) return;
    const confirmClear = window.confirm(
      isHindi
        ? "क्या आप निश्चित रूप से इस खेत का पहचान इतिहास मिटाना चाहते हैं?"
        : "Are you sure you want to clear detection telemetry for this field?"
    );
    if (!confirmClear) return;

    try {
      await clearFieldDetectionsApi(field.id);
      setDetections([]);
      setAnalyzedResult(null);
      clearOverlay();
    } catch (err) {
      console.error("Error clearing detections:", err);
    }
  };

  // --- Browser Camera Engine ---
  const startBrowserCamera = async () => {
    setCameraError("");
    try {
      const constraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startInferenceLoop();
        };
      }
      setIsFeedActive(true);
      // Re-enumerate cameras in case iPhone continuity camera was unlocked
      enumerateCameras();
    } catch (err) {
      console.error("getUserMedia error:", err);
      let errMsg = isHindi
        ? "ब्राउज़र कैमरा चालू नहीं हो सका। कृपया कैमरा अनुमति की जांच करें।"
        : "Could not access camera. Please check camera permissions in your browser.";
      if (err.name === "NotAllowedError") {
        errMsg = isHindi
          ? "कैमरा अनुमति अस्वीकृत है। कृपया ब्राउज़र सेटिंग्स में कैमरा चालू करें।"
          : "Camera permission was denied. Please allow camera access in browser address bar.";
      }
      setCameraError(errMsg);
      setIsFeedActive(false);
    }
  };

  const stopBrowserCamera = () => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    clearOverlay();
    setIsFeedActive(false);
  };

  const clearOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setActiveDetectionsCount({ insects: 0, pests: 0 });
  };

  // Real-time CNN frame analysis loop (runs every ~600ms while camera is active)
  const startInferenceLoop = () => {
    if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);

    let lastFrameTime = Date.now();

    loopIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || isAnalyzingRef.current) return;

      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;
      if (!vWidth || !vHeight) return;

      // Sync overlay canvas resolution
      const overlay = overlayCanvasRef.current;
      if (overlay && (overlay.width !== vWidth || overlay.height !== vHeight)) {
        overlay.width = vWidth;
        overlay.height = vHeight;
      }

      // Draw to hidden capture canvas
      if (!captureCanvasRef.current) {
        captureCanvasRef.current = document.createElement("canvas");
      }
      const capCanvas = captureCanvasRef.current;
      capCanvas.width = vWidth;
      capCanvas.height = vHeight;
      const capCtx = capCanvas.getContext("2d");
      capCtx.drawImage(video, 0, 0, vWidth, vHeight);

      // Measure FPS
      const now = Date.now();
      const calculatedFps = Math.round(1000 / Math.max(1, now - lastFrameTime));
      lastFrameTime = now;
      setFps(calculatedFps);

      isAnalyzingRef.current = true;
      try {
        capCanvas.toBlob(
          async (blob) => {
            if (!blob) {
              isAnalyzingRef.current = false;
              return;
            }
            try {
              const formData = new FormData();
              formData.append("file", blob, "live_frame.jpg");
              const res = await analyzeFieldFrameApi(field.id, formData, confidenceThresh);
              if (res && Array.isArray(res.detections)) {
                drawBoundingBoxes(res.detections, vWidth, vHeight);
                // If threats were detected, refresh detections list
                if (res.detections.length > 0) {
                  loadDetections(false);
                }
              } else {
                clearOverlay();
              }
            } catch (err) {
              console.warn("Frame analysis tick error:", err);
            } finally {
              isAnalyzingRef.current = false;
            }
          },
          "image/jpeg",
          0.75
        );
      } catch (err) {
        isAnalyzingRef.current = false;
      }
    }, 600);
  };

  // Draw styled bounding boxes on the overlay canvas
  const drawBoundingBoxes = (items, width, height) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    let insectCount = 0;
    let pestCount = 0;

    items.forEach((item) => {
      const isInsect = item.detection_type === "INSECT";
      if (isInsect) insectCount++;
      else pestCount++;

      const [x1, y1, x2, y2] = item.bbox || [40, 40, 200, 200];
      const boxW = x2 - x1;
      const boxH = y2 - y1;

      // Color scheme: Blue for Insect, Red for Pest
      const color = isInsect ? "#2563eb" : "#dc2626";
      const label = `${isInsect ? "[INSECT]" : "[PEST]"} ${item.disease_or_pest_name} ${item.accuracy_pct}%`;

      // Draw box
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.strokeRect(x1, y1, boxW, boxH);

      // Draw header badge
      ctx.font = "bold 14px sans-serif";
      const textWidth = ctx.measureText(label).width;
      const tabH = 24;
      const tabY = Math.max(0, y1 - tabH);

      ctx.fillStyle = color;
      ctx.fillRect(x1, tabY, textWidth + 14, tabH);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x1 + 6, tabY + 17);
    });

    setActiveDetectionsCount({ insects: insectCount, pests: pestCount });
  };

  // Toggle Live Feed Power
  const toggleFeed = () => {
    if (isFeedActive) {
      if (feedMode === "browser") {
        stopBrowserCamera();
      } else {
        setIsFeedActive(false);
      }
    } else {
      setCameraError("");
      setAnalyzedResult(null);
      if (feedMode === "browser") {
        startBrowserCamera();
      } else {
        setStreamKey(Date.now());
        setIsFeedActive(true);
      }
    }
  };

  // Handle Image Upload / Snapshot Test
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !field?.id) return;

    setAnalyzingImage(true);
    setAnalyzedResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await analyzeFieldFrameApi(field.id, formData, confidenceThresh);
      if (res) {
        setAnalyzedResult(res);
        loadDetections(false);
      }
    } catch (err) {
      console.error("Error analyzing frame:", err);
    } finally {
      setAnalyzingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLaunchDesktop = async () => {
    try {
      await launchDesktopFeedApi(field?.id, backendCamIdx);
      alert(isHindi ? "डेस्कटॉप लाइव फीड विंडो शुरू हो गई है!" : "Desktop OpenCV live feed window launched!");
    } catch (err) {
      console.error("Could not launch desktop feed:", err);
    }
  };

  const handleTestSample = async (sampleType) => {
    if (!field?.id) return;
    setAnalyzingImage(true);
    setAnalyzedResult(null);
    try {
      const res = await testDatasetSampleApi(field.id, sampleType, confidenceThresh);
      if (res) {
        setAnalyzedResult(res);
        loadDetections(false);
      }
    } catch (err) {
      console.error("Error testing sample:", err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "--";
    try {
      const d = new Date(isoString.includes("Z") ? isoString : isoString + "Z");
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const backendStreamUrl = `${API_BASE_URL}/fields/${field?.id}/live-feed/stream?camera=${backendCamIdx}&conf=${confidenceThresh}&t=${streamKey}`;

  return (
    <div className="livefeed-container">
      {/* Top Banner & Instructions */}
      <div className="livefeed-header-card">
        <div className="livefeed-header-left">
          <div className="livefeed-badge-group">
            <span className="livefeed-model-tag">
              <Zap size={14} />
              <span>crop-disease-pest-detector / best_model.pt (35 Classes)</span>
            </span>
            <span className={`livefeed-status-pill ${isFeedActive ? "active" : "standby"}`}>
              <span className="status-dot"></span>
              {isFeedActive
                ? isHindi
                  ? "लाइव कैमरा सक्रिय"
                  : "Live Camera Active"
                : isHindi
                ? "कैमरा स्टैंडबाय"
                : "Camera Standby"}
            </span>
          </div>
          <h2 className="livefeed-title">
            {isHindi ? "खेत लाइव निगरानी एवं कीट/रोग पहचान" : "Field Live Video & Threat Detection Feed"}
          </h2>
          <p className="livefeed-subtitle">
            {isHindi
              ? "स्मार्ट कैमरा द्वारा रीयल-टाइम में कीट (ब्लू रो) एवं रोग (रेड रो) की पहचान व रिकॉर्डिंग।"
              : "Real-time AI monitoring detects Insects (Blue rows) and Pests/Diseases (Red rows) with confidence scores."}
          </p>
        </div>

        {/* Live Controls Bar */}
        <div className="livefeed-header-controls">
          {/* Mode Selector: Browser WebCam vs Backend OpenCV Stream */}
          <div className="camera-toggle-group">
            <button
              className={`camera-btn ${feedMode === "browser" ? "selected" : ""}`}
              onClick={() => {
                if (isFeedActive) stopBrowserCamera();
                setFeedMode("browser");
              }}
              title="Browser HD Camera (Instant & Responsive)"
            >
              <Camera size={15} />
              <span>Webcam HD</span>
            </button>
            <button
              className={`camera-btn ${feedMode === "backend" ? "selected" : ""}`}
              onClick={() => {
                if (isFeedActive) stopBrowserCamera();
                setFeedMode("backend");
              }}
              title="OpenCV Backend Stream"
            >
              <Radio size={15} />
              <span>Backend Stream</span>
            </button>
          </div>

          {/* Camera Device Selector (If multiple cameras detected) */}
          {feedMode === "browser" && videoDevices.length > 1 && (
            <select
              className="camera-select-dropdown"
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                if (isFeedActive) {
                  stopBrowserCamera();
                  setTimeout(() => startBrowserCamera(), 100);
                }
              }}
            >
              {videoDevices.map((dev, i) => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          {feedMode === "backend" && (
            <div className="camera-toggle-group">
              <button
                className={`camera-btn ${backendCamIdx === 0 ? "selected" : ""}`}
                onClick={() => {
                  setBackendCamIdx(0);
                  setStreamKey(Date.now());
                }}
              >
                <Monitor size={14} />
                <span>Mac (0)</span>
              </button>
              <button
                className={`camera-btn ${backendCamIdx === 1 ? "selected" : ""}`}
                onClick={() => {
                  setBackendCamIdx(1);
                  setStreamKey(Date.now());
                }}
              >
                <Smartphone size={14} />
                <span>iPhone (1)</span>
              </button>
            </div>
          )}

          {/* Start / Stop Stream Button */}
          <button
            className={`feed-power-btn ${isFeedActive ? "stop" : "start"}`}
            onClick={toggleFeed}
          >
            {isFeedActive ? (
              <>
                <VideoOff size={18} />
                <span>{isHindi ? "कैमरा बंद करें" : "Stop Live Feed"}</span>
              </>
            ) : (
              <>
                <Video size={18} />
                <span>{isHindi ? "लाइव फीड शुरू करें" : "Start Live Feed"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Video Viewport & Detections Table */}
      <div className="livefeed-grid">
        {/* Left Column: Live Video Box */}
        <div className="livefeed-viewport-card">
          <div className="viewport-header">
            <div className="viewport-title">
              <Camera size={18} />
              <span>
                {isHindi ? "लाइव वीडियो स्ट्रीम" : "Live Video Stream Viewport"}
                {isFeedActive && <span className="fps-indicator">({fps || 24} FPS)</span>}
              </span>
            </div>
            <div className="viewport-legend">
              <span className="legend-item insect">
                <span className="legend-box blue"></span>
                <span>{isHindi ? "कीट (Insect) - ब्लू" : "Insect (Blue)"}</span>
              </span>
              <span className="legend-item pest">
                <span className="legend-box red"></span>
                <span>{isHindi ? "रोग/कीट (Pest) - रेड" : "Pest/Disease (Red)"}</span>
              </span>
            </div>
          </div>

          <div className="video-display-area">
            {/* Browser WebCam Mode Viewport */}
            {feedMode === "browser" && (
              <div
                className="browser-camera-stage"
                style={{ display: isFeedActive ? "block" : "none" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="live-video-stream"
                />
                <canvas ref={overlayCanvasRef} className="live-overlay-canvas" />
                <div className="stream-live-indicator">
                  <span className="rec-dot"></span>
                  <span>LIVE AI • Insects: {activeDetectionsCount.insects} | Pests: {activeDetectionsCount.pests}</span>
                </div>
              </div>
            )}

            {/* Backend OpenCV Stream Mode Viewport */}
            {feedMode === "backend" && isFeedActive && (
              <div className="stream-wrapper">
                <img
                  src={backendStreamUrl}
                  alt="Live Crop Feed"
                  className="live-video-stream"
                  onError={() => {
                    setCameraError("Backend video stream connection failed. Ensure backend is running.");
                    setIsFeedActive(false);
                  }}
                />
                <div className="stream-live-indicator">
                  <span className="rec-dot"></span>
                  <span>BACKEND STREAM • {backendCamIdx === 1 ? "iPhone (1)" : "Mac (0)"}</span>
                </div>
              </div>
            )}

            {/* Snapshot analysis display if user uploaded a photo */}
            {!isFeedActive && analyzedResult?.annotated_image && (
              <div className="stream-wrapper">
                <img
                  src={analyzedResult.annotated_image}
                  alt="Analyzed Snapshot"
                  className="live-video-stream"
                />
                <div className="stream-live-indicator snapshot">
                  <span>SNAPSHOT ANALYSIS</span>
                </div>
              </div>
            )}

            {/* Standby Placeholder when camera is inactive */}
            {!isFeedActive && !analyzedResult?.annotated_image && (
              <div className="video-standby-placeholder">
                <div className="standby-content">
                  <Video size={52} className="standby-icon" />
                  <h4>
                    {cameraError
                      ? isHindi
                        ? "कैमरा प्रारंभ नहीं हो सका"
                        : "Camera Notice"
                      : isHindi
                      ? "लाइव कैमरा वर्तमान में बंद है"
                      : "Live Camera is Currently Inactive"}
                  </h4>
                  <p>
                    {cameraError ||
                      (isHindi
                        ? "'लाइव फीड शुरू करें' पर क्लिक करें या नीचे किसी पत्ती की फोटो अपलोड करें।"
                        : "Click 'Start Live Feed' above or upload a crop leaf image below to run CNN inference.")}
                  </p>
                  <button onClick={toggleFeed} className="start-feed-btn">
                    <Video size={16} />
                    <span>{isHindi ? "कैमरा चालू करें" : "Start Live Camera"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Bottom Toolbar */}
          <div className="video-toolbar-row">
            <div className="conf-slider-wrapper">
              <Sliders size={16} className="slider-icon" />
              <span className="slider-label">
                {isHindi ? "संवेदनशीलता (Conf):" : "Confidence Threshold:"}
              </span>
              <input
                type="range"
                min="0.15"
                max="0.85"
                step="0.05"
                value={confidenceThresh}
                onChange={(e) => {
                  setConfidenceThresh(parseFloat(e.target.value));
                  if (isFeedActive && feedMode === "backend") setStreamKey(Date.now());
                }}
                className="conf-slider"
              />
              <span className="slider-value">{Math.round(confidenceThresh * 100)}%</span>
            </div>

            <div className="snapshot-actions">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <button
                className="upload-frame-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzingImage}
                title="Upload any leaf photo to run inference with best_model.pt"
              >
                {analyzingImage ? (
                  <>
                    <Activity size={15} className="spin-icon" />
                    <span>{isHindi ? "विश्लेषण हो रहा है..." : "Analyzing..."}</span>
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    <span>{isHindi ? "पत्ती फोटो जांचें" : "Upload Test Image"}</span>
                  </>
                )}
              </button>

              <button
                className="sample-test-btn sample-insect"
                onClick={() => handleTestSample("insect")}
                disabled={analyzingImage}
                title="Run best_model.pt on IP102 Rice Leaf Roller test image"
              >
                <Bug size={14} />
                <span>Test Rice Roller</span>
              </button>

              <button
                className="sample-test-btn sample-pest"
                onClick={() => handleTestSample("pest")}
                disabled={analyzingImage}
                title="Run best_model.pt on PlantDoc Powdery Mildew test image"
              >
                <ShieldAlert size={14} />
                <span>Test Mildew</span>
              </button>

              <button
                className="launch-desktop-btn"
                onClick={handleLaunchDesktop}
                title="Launch native OpenCV webcam window on Mac"
              >
                <Monitor size={14} />
                <span>Desktop Feed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detections Telemetry Table (Max 25 Rows) */}
        <div className="livefeed-telemetry-card">
          <div className="telemetry-header">
            <div className="telemetry-title-group">
              <Activity size={19} className="telemetry-icon" />
              <div>
                <h3 className="telemetry-heading">
                  {isHindi ? "पहचाने गए कीट एवं रोग" : "Detected Threats Telemetry"}
                </h3>
                <span className="telemetry-count-pill">
                  {detections.length} / 25 {isHindi ? "रिकॉर्ड्स" : "Values (Max 25)"}
                </span>
              </div>
            </div>

            <div className="telemetry-btn-group">
              <button
                className="telemetry-refresh-btn"
                onClick={() => loadDetections(true)}
                disabled={loadingDetections}
                title="Refresh Table"
              >
                <RefreshCw size={15} className={loadingDetections ? "spin-icon" : ""} />
                <span>{isHindi ? "रिफ्रेश" : "Refresh"}</span>
              </button>

              <button
                className="telemetry-clear-btn"
                onClick={handleClearDetections}
                disabled={detections.length === 0}
                title="Clear Detections"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Auto-Refresh Status Bar */}
          <div className="auto-refresh-bar">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span>{isHindi ? "ऑटो-रिफ्रेश (3 सेकंड)" : "Auto-refresh feed data (every 3s)"}</span>
            </label>
            <span className="color-code-hint">
              <span className="hint-blue">● Blue: Insect</span>
              <span className="hint-red">● Red: Pest/Disease</span>
            </span>
          </div>

          {/* Detections Table View */}
          <div className="detections-table-container">
            {detections.length === 0 ? (
              <div className="empty-detections-box">
                <CheckCircle2 size={40} className="empty-icon" />
                <p className="empty-title">
                  {isHindi ? "अभी तक कोई खतरा नहीं पाया गया" : "No Threats Detected Yet"}
                </p>
                <p className="empty-desc">
                  {isHindi
                    ? "लाइव कैमरा शुरू करें। जैसे ही कोई कीट या रोग कैमरे के सामने आएगा, वह यहाँ नीले या लाल रंग में दर्ज हो जाएगा।"
                    : "Start the live feed. Detected insects will appear in Blue rows and pests/diseases in Red rows."}
                </p>
              </div>
            ) : (
              <table className="detections-table">
                <thead>
                  <tr>
                    <th style={{ width: "38px" }}>#</th>
                    <th>{isHindi ? "प्रकार" : "Type"}</th>
                    <th>{isHindi ? "पहचाना गया नाम" : "Detected Threat Name"}</th>
                    <th>{isHindi ? "सटीकता (Conf)" : "Accuracy %"}</th>
                    <th>{isHindi ? "समय" : "Time"}</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map((item, idx) => {
                    const isInsect =
                      item.detection_type?.toUpperCase() === "INSECT" ||
                      item.disease_or_pest_name?.toLowerCase().includes("beetle") ||
                      item.disease_or_pest_name?.toLowerCase().includes("roller") ||
                      item.disease_or_pest_name?.toLowerCase().includes("bug");

                    const rowClass = isInsect
                      ? "detection-row-insect"
                      : "detection-row-pest";

                    const confPct = Math.min(
                      100,
                      Math.round((item.confidence || 0.5) * 100)
                    );

                    return (
                      <tr key={item.id || idx} className={`detection-table-row ${rowClass}`}>
                        <td className="row-num">{idx + 1}</td>
                        <td>
                          {isInsect ? (
                            <span className="threat-pill insect-pill">
                              <Bug size={13} />
                              <span>{isHindi ? "कीट (Insect)" : "Insect"}</span>
                            </span>
                          ) : (
                            <span className="threat-pill pest-pill">
                              <ShieldAlert size={13} />
                              <span>{isHindi ? "रोग/पेस्ट (Pest)" : "Pest"}</span>
                            </span>
                          )}
                        </td>
                        <td className="threat-name-cell">
                          <span className="threat-name-text">
                            {item.disease_or_pest_name || "Unknown Threat"}
                          </span>
                        </td>
                        <td className="confidence-cell">
                          <div className="confidence-meter-container">
                            <div className="confidence-meter-bar">
                              <div
                                className={`confidence-meter-fill ${
                                  isInsect ? "fill-blue" : "fill-red"
                                }`}
                                style={{ width: `${confPct}%` }}
                              ></div>
                            </div>
                            <span className="confidence-text">{confPct}%</span>
                          </div>
                        </td>
                        <td className="timestamp-cell">
                          {formatTime(item.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
