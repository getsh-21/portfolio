/**
 * ============================================================
 * Goitom Portfolio — RAG Chatbot Widget (Step 5: connected to backend)
 * ============================================================
 * getAIResponse() now makes a real fetch() call to the FastAPI
 * backend instead of returning canned text. Everything else in
 * this file — DOM building, open/close/minimize, typing
 * indicator, message rendering — is untouched from Step 1.
 * ============================================================
 */

(function () {
  "use strict";

  // ---- Config -------------------------------------------------
  const CONFIG = {
    botName: "Goitom's Assistant",
    botInitials: "GG",
    welcomeMessage:
      "Hi! I'm Goitom's AI assistant. Ask me about his projects, skills, or experience.",
    suggestedQuestions: [
      "What projects has Goitom built?",
      "What are his technical skills?",
      "How can I contact him?",
    ],
  };

  // The FastAPI backend URL. During local development this points
  // at your local uvicorn server. In Step 7 (deployment), this
  // gets changed to your real Render URL, e.g.
  // "https://goitom-rag-backend.onrender.com/api/chat"
 const BACKEND_URL = "https://goitom-rag-backend.onrender.com/api/chat"; 

  // ---- State ----------------------------------------------------
  let isOpen = false;
  let isMinimized = false;
  let hasShownSuggestions = false;
  let isWaitingForReply = false;

  // Persists across messages within this page load, so the backend
  // can eventually group a conversation together (used more heavily
  // once Step 8 adds real conversation memory).
  let sessionId = null;

  // ---- Build DOM --------------------------------------------------
  function buildWidget() {
    const root = document.createElement("div");
    root.className = "ggc-root";
    root.innerHTML = `
      <button class="ggc-launcher" id="ggcLauncher" aria-label="Open chat with Goitom's assistant" aria-expanded="false">
        <div class="ggc-pulse"></div>
        <svg class="ggc-icon-chat" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <svg class="ggc-icon-close" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="ggc-window" id="ggcWindow" role="dialog" aria-label="Chat with Goitom's assistant" aria-hidden="true">
        <div class="ggc-header">
          <div class="ggc-avatar">${CONFIG.botInitials}</div>
          <div class="ggc-header-text">
            <div class="ggc-header-title">${CONFIG.botName}</div>
            <div class="ggc-header-status"><span class="ggc-status-dot"></span>Online</div>
          </div>
          <div class="ggc-header-actions">
            <button class="ggc-icon-btn" id="ggcMinimizeBtn" aria-label="Minimize chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="ggc-icon-btn" id="ggcCloseBtn" aria-label="Close chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="ggc-body" id="ggcBody"></div>

        <div class="ggc-input-bar">
          <textarea
            class="ggc-input"
            id="ggcInput"
            placeholder="Ask about Goitom's work..."
            rows="1"
            aria-label="Type your message"
          ></textarea>
          <button class="ggc-send-btn" id="ggcSendBtn" aria-label="Send message" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div class="ggc-footer-note">Answers are generated from Goitom's portfolio content</div>
      </div>
    `;
    document.body.appendChild(root);
  }

  // ---- Element refs (populated after buildWidget) ----------------
  let launcher, windowEl, bodyEl, inputEl, sendBtn, minimizeBtn, closeBtn;

  function cacheRefs() {
    launcher = document.getElementById("ggcLauncher");
    windowEl = document.getElementById("ggcWindow");
    bodyEl = document.getElementById("ggcBody");
    inputEl = document.getElementById("ggcInput");
    sendBtn = document.getElementById("ggcSendBtn");
    minimizeBtn = document.getElementById("ggcMinimizeBtn");
    closeBtn = document.getElementById("ggcCloseBtn");
  }

  // ---- Rendering helpers ------------------------------------------
  function scrollToBottom() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function appendMessage(role, text) {
    const row = document.createElement("div");
    row.className = `ggc-row ggc-${role}`;

    const bubbleHtml = `<div class="ggc-bubble"><p>${escapeHtml(text)}</p></div>`;
    if (role === "ai") {
      row.innerHTML = `<div class="ggc-mini-avatar">${CONFIG.botInitials}</div>${bubbleHtml}`;
    } else {
      row.innerHTML = bubbleHtml;
    }
    bodyEl.appendChild(row);
    scrollToBottom();
    return row;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function showTypingIndicator() {
    const row = document.createElement("div");
    row.className = "ggc-row ggc-ai";
    row.id = "ggcTypingRow";
    row.innerHTML = `
      <div class="ggc-mini-avatar">${CONFIG.botInitials}</div>
      <div class="ggc-typing"><span></span><span></span><span></span></div>
    `;
    bodyEl.appendChild(row);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const row = document.getElementById("ggcTypingRow");
    if (row) row.remove();
  }

  function renderSuggestions() {
    if (hasShownSuggestions) return;
    hasShownSuggestions = true;

    const wrap = document.createElement("div");
    wrap.className = "ggc-suggestions";
    wrap.id = "ggcSuggestions";
    CONFIG.suggestedQuestions.forEach((q) => {
      const btn = document.createElement("button");
      btn.className = "ggc-suggestion";
      btn.type = "button";
      btn.textContent = q;
      btn.addEventListener("click", () => {
        wrap.remove();
        handleSend(q);
      });
      wrap.appendChild(btn);
    });
    bodyEl.appendChild(wrap);
    scrollToBottom();
  }

  // ---- REAL backend call (Step 5 — replaces the Step 1 stub) ------
  async function getAIResponse(userMessage) {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        session_id: sessionId, // null on first message; backend generates one
      }),
    });

    if (!response.ok) {
      // Covers HTTP-level failures (500, 422, etc.) — the server
      // responded, but with an error status. We throw here so the
      // existing try/catch in handleSend() shows the user-friendly
      // fallback message instead of a raw crash.
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = await response.json();

    // Store the session_id the backend gave us (or generated) so
    // every subsequent message in this page load stays grouped
    // into the same conversation.
    sessionId = data.session_id;

    return data.answer;
  }

  // ---- Send flow ---------------------------------------------------
  async function handleSend(overrideText) {
    const text = (overrideText ?? inputEl.value).trim();
    if (!text || isWaitingForReply) return;

    const suggestions = document.getElementById("ggcSuggestions");
    if (suggestions) suggestions.remove();

    appendMessage("user", text);
    inputEl.value = "";
    autoGrowInput();
    updateSendButtonState();

    isWaitingForReply = true;
    showTypingIndicator();

    try {
      const reply = await getAIResponse(text);
      hideTypingIndicator();
      appendMessage("ai", reply);
    } catch (err) {
      hideTypingIndicator();
      console.error("[ggc] chat request failed:", err);
      appendMessage(
        "ai",
        "Sorry, something went wrong on my end. Please try again in a moment."
      );
    } finally {
      isWaitingForReply = false;
    }
  }

  function autoGrowInput() {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + "px";
  }

  function updateSendButtonState() {
    sendBtn.disabled = inputEl.value.trim().length === 0 || isWaitingForReply;
  }

  // ---- Open / close / minimize -------------------------------------
  function openChat() {
    isOpen = true;
    isMinimized = false;
    windowEl.classList.add("ggc-visible");
    windowEl.classList.remove("ggc-minimized");
    windowEl.setAttribute("aria-hidden", "false");
    launcher.classList.add("ggc-open");
    launcher.classList.remove("ggc-attention");
    launcher.setAttribute("aria-expanded", "true");

    if (bodyEl.children.length === 0) {
      appendMessage("ai", CONFIG.welcomeMessage);
      renderSuggestions();
    }
    setTimeout(() => inputEl.focus(), 250);
  }

  function closeChat() {
    isOpen = false;
    windowEl.classList.remove("ggc-visible");
    windowEl.setAttribute("aria-hidden", "true");
    launcher.classList.remove("ggc-open");
    launcher.setAttribute("aria-expanded", "false");
  }

  function toggleChat() {
    if (isOpen) closeChat();
    else openChat();
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    windowEl.classList.toggle("ggc-minimized", isMinimized);
  }

  // ---- Wire up events ------------------------------------------------
  function attachEvents() {
    launcher.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", closeChat);
    minimizeBtn.addEventListener("click", toggleMinimize);
    sendBtn.addEventListener("click", () => handleSend());

    inputEl.addEventListener("input", () => {
      autoGrowInput();
      updateSendButtonState();
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    setTimeout(() => {
      if (!isOpen) launcher.classList.add("ggc-attention");
    }, 4000);
  }

  // ---- Init ---------------------------------------------------------
  function init() {
    console.log("[ggc] chatbot.js loaded, initializing widget...");

    if (document.querySelector(".ggc-root")) {
      console.warn("[ggc] widget already initialized, skipping duplicate init.");
      return;
    }

    buildWidget();
    cacheRefs();
    attachEvents();

    if (!launcher) {
      console.error(
        "[ggc] FAILED: launcher button not found after buildWidget(). " +
        "The DOM was not created correctly — check for a JS error above this line."
      );
      return;
    }

    const rect = launcher.getBoundingClientRect();
    const computed = window.getComputedStyle(launcher);
    console.log("[ggc] widget initialized OK.", {
      "launcher present in DOM": true,
      "position": computed.position,
      "z-index": computed.zIndex,
      "bounding box": rect,
      "backend URL": BACKEND_URL,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();