/* ==========================================================================
   TEXT TRIPS LOCAL - MASTER APPLICATION CONTROLLER
   ========================================================================== */

import { PRESET_PLOTS, PRESET_TIMELINES, PRESET_CHARACTERS } from './data/presetScenarios.js';
import { SceneManager } from './three/SceneManager.js';
import { OllamaService } from './services/OllamaService.js';
import { StoryEngine } from './services/StoryEngine.js';

class App {
  constructor() {
    this.sceneManager = null;
    this.ollamaService = new OllamaService();
    this.storyEngine = new StoryEngine();

    // Selected Matrix State
    this.selectedPlot = PRESET_PLOTS[0];
    this.selectedTimeline = PRESET_TIMELINES[0];
    this.selectedCharacter = PRESET_CHARACTERS[0];
    this.selectedMode = 'adventure'; // 'adventure' | 'educational'
    this.audioEnabled = true;

    // Web Audio Synthesizer
    this.audioCtx = null;

    this.init();
  }

  async init() {
    // 1. Initialize 3D Scene Canvas
    this.sceneManager = new SceneManager('bg-canvas');
    this.sceneManager.onNodeClickCallback = (index) => this.on3DNodeClicked(index);

    // 2. Render Selection Matrix UI
    this.renderSelectorGrid();

    // 3. Connect UI Event Listeners
    this.bindEvents();

    // 4. Check Ollama Status & Populate Model Dropdown
    await this.checkOllamaConnection();

    console.log("🚀 Text Trips Local initialized successfully.");
  }

  /* --------------------------------------------------------------------------
     AUDIO SYNTHESIZER (Web Audio API)
     -------------------------------------------------------------------------- */
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
  }

  playSound(type) {
    if (!this.audioEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'timer-tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'upgrade') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'gameover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  }

  /* --------------------------------------------------------------------------
     SELECTION MATRIX & UI RENDERING
     -------------------------------------------------------------------------- */
  renderSelectorGrid() {
    // 1. Plot Scenarios
    const plotListContainer = document.getElementById('plot-list');
    plotListContainer.innerHTML = PRESET_PLOTS.map(p => `
      <div class="select-item ${p.id === this.selectedPlot.id ? 'selected' : ''}" data-plot-id="${p.id}">
        <div class="item-title">
          <span>${p.icon}</span>
          <span>${p.title}</span>
        </div>
        <div class="item-desc">${p.summary}</div>
      </div>
    `).join('');

    // 2. Timelines
    const timelineListContainer = document.getElementById('timeline-list');
    timelineListContainer.innerHTML = PRESET_TIMELINES.map(t => `
      <div class="select-item ${t.id === this.selectedTimeline.id ? 'selected' : ''}" data-timeline-id="${t.id}">
        <div class="item-title">
          <span>${t.icon}</span>
          <span>${t.name}</span>
        </div>
        <div class="item-desc">${t.desc}</div>
      </div>
    `).join('');

    // 3. Characters
    const charListContainer = document.getElementById('character-list');
    charListContainer.innerHTML = PRESET_CHARACTERS.map(c => `
      <div class="select-item ${c.id === this.selectedCharacter.id ? 'selected' : ''}" data-char-id="${c.id}">
        <div class="item-title">
          <span>${c.avatar}</span>
          <span>${c.name}</span>
        </div>
        <div class="item-desc">${c.role}</div>
      </div>
    `).join('');
  }

  on3DNodeClicked(nodeIndex) {
    if (PRESET_PLOTS[nodeIndex]) {
      this.selectedPlot = PRESET_PLOTS[nodeIndex];
      this.sceneManager.setTheme(this.selectedPlot.theme);
      this.renderSelectorGrid();
      this.playSound('click');
    }
  }

  /* --------------------------------------------------------------------------
     OLLAMA CONNECTION & MODEL MANAGEMENT
     -------------------------------------------------------------------------- */
  async checkOllamaConnection() {
    const widget = document.getElementById('ollama-status-widget');
    const statusLabel = document.getElementById('ollama-status-label');
    const select = document.getElementById('ollama-model-select');

    statusLabel.textContent = "Checking Ollama...";
    widget.className = "status-widget status-checking";

    const res = await this.ollamaService.checkConnection();

    if (res.success) {
      statusLabel.textContent = "Ollama Active";
      widget.className = "status-widget status-online";

      select.innerHTML = res.models.map(m => `
        <option value="${m.name}" ${m.name === res.activeModel ? 'selected' : ''}>${m.name}</option>
      `).join('');
    } else {
      statusLabel.textContent = "Offline (Fallback Mode)";
      widget.className = "status-widget status-fallback";

      select.innerHTML = `<option value="procedural-fallback">Procedural Story Engine</option>`;
    }
  }

  /* --------------------------------------------------------------------------
     EVENT BINDINGS
     -------------------------------------------------------------------------- */
  bindEvents() {
    // Plot item clicks
    document.getElementById('plot-list').addEventListener('click', (e) => {
      const item = e.target.closest('[data-plot-id]');
      if (item) {
        const id = item.dataset.plotId;
        this.selectedPlot = PRESET_PLOTS.find(p => p.id === id);
        this.sceneManager.setTheme(this.selectedPlot.theme);
        document.body.className = this.selectedPlot.theme;
        this.renderSelectorGrid();
        this.playSound('click');
      }
    });

    // Custom plot input
    const customPlotInput = document.getElementById('custom-plot-input');
    customPlotInput.addEventListener('change', () => {
      if (customPlotInput.value.trim().length > 5) {
        this.selectedPlot = {
          id: 'custom-user-plot',
          title: 'Custom Pitch: ' + customPlotInput.value.trim(),
          theme: 'theme-cyberpunk',
          icon: '✨',
          summary: customPlotInput.value.trim(),
          startingLocation: 'Unknown Custom Realm',
          initialPrompt: `Your adventure begins with your custom premise: "${customPlotInput.value.trim()}". You look around as the environment crystallizes around you.`,
          question: 'What immediate single-sentence action do you take to begin your journey?'
        };
        this.playSound('click');
      }
    });

    // Timeline item clicks
    document.getElementById('timeline-list').addEventListener('click', (e) => {
      const item = e.target.closest('[data-timeline-id]');
      if (item) {
        const id = item.dataset.timelineId;
        this.selectedTimeline = PRESET_TIMELINES.find(t => t.id === id);
        this.renderSelectorGrid();
        this.playSound('click');
      }
    });

    // Character item clicks
    document.getElementById('character-list').addEventListener('click', (e) => {
      const item = e.target.closest('[data-char-id]');
      if (item) {
        const id = item.dataset.charId;
        this.selectedCharacter = PRESET_CHARACTERS.find(c => c.id === id);
        this.renderSelectorGrid();
        this.playSound('click');
      }
    });

    // Mode Buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMode = btn.dataset.mode;
        
        const badge = document.getElementById('mode-badge');
        const modeText = document.getElementById('mode-text');
        if (this.selectedMode === 'educational') {
          badge.className = "pill-badge mode-educational";
          modeText.textContent = "EDUCATIONAL MODE";
        } else {
          badge.className = "pill-badge mode-adventure";
          modeText.textContent = "ADVENTURE MODE";
        }
        this.playSound('click');
      });
    });

    // Start Trip Button
    document.getElementById('btn-start-trip').addEventListener('click', () => {
      this.startTrip();
    });

    // Response Form Submission
    const form = document.getElementById('response-form');
    const responseInput = document.getElementById('user-response-input');
    const charCounter = document.getElementById('char-counter');

    responseInput.addEventListener('input', () => {
      charCounter.textContent = `${responseInput.value.length} / 280`;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = responseInput.value.trim();
      if (val.length > 0) {
        this.handleUserAction(val);
      }
    });

    // Ollama Status Widget & Config Modal
    const ollamaModal = document.getElementById('modal-ollama-config');
    const ollamaSelect = document.getElementById('ollama-model-select');

    document.getElementById('ollama-status-widget').addEventListener('click', (e) => {
      // Don't open config modal if clicking directly on the select element inside the widget
      if (e.target === ollamaSelect) return;
      ollamaModal.classList.remove('hidden');
    });

    ollamaSelect.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.getElementById('btn-close-ollama-modal').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      ollamaModal.classList.add('hidden');
    });

    // Close modal when clicking backdrop
    ollamaModal.addEventListener('click', (e) => {
      if (e.target === ollamaModal) {
        ollamaModal.classList.add('hidden');
      }
    });

    // Close log drawer when clicking backdrop
    const logDrawer = document.getElementById('drawer-log');
    logDrawer.addEventListener('click', (e) => {
      if (e.target === logDrawer) {
        logDrawer.classList.add('hidden');
      }
    });

    // Escape key listener for closing open modals/drawers
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        ollamaModal.classList.add('hidden');
        logDrawer.classList.add('hidden');
        document.getElementById('modal-gameover').classList.add('hidden');
      }
    });

    document.getElementById('btn-test-ollama').addEventListener('click', async (e) => {
      e.preventDefault();
      const url = document.getElementById('ollama-url-input').value;
      this.ollamaService.setBaseUrl(url);
      const testStatus = document.getElementById('ollama-test-status');
      testStatus.textContent = "Connecting to " + url + "...";
      const res = await this.ollamaService.checkConnection();
      if (res.success) {
        testStatus.textContent = `Connected! ${res.models.length} models detected.`;
      } else {
        testStatus.textContent = `Connection failed. Fallback storyteller mode active.`;
      }
    });

    document.getElementById('btn-save-ollama').addEventListener('click', (e) => {
      e.preventDefault();
      const url = document.getElementById('ollama-url-input').value;
      const temp = parseFloat(document.getElementById('ollama-temp-input').value);
      this.ollamaService.setBaseUrl(url);
      this.ollamaService.temperature = temp;
      this.checkOllamaConnection();
      ollamaModal.classList.add('hidden');
      this.playSound('click');
    });

    // Model Selector Change
    ollamaSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      this.ollamaService.selectedModel = e.target.value;
      this.playSound('click');
    });

    // Audio Mute Toggle
    document.getElementById('btn-audio-toggle').addEventListener('click', () => {
      this.audioEnabled = !this.audioEnabled;
      document.getElementById('audio-icon').textContent = this.audioEnabled ? '🔊' : '🔇';
    });

    // Log Drawer Toggle
    document.getElementById('btn-log-toggle').addEventListener('click', () => {
      this.openLogDrawer();
    });
    document.getElementById('btn-close-log').addEventListener('click', () => {
      document.getElementById('drawer-log').classList.add('hidden');
    });

    // Export Log Buttons
    document.getElementById('btn-export-json').addEventListener('click', () => this.exportLog('json'));
    document.getElementById('btn-export-markdown').addEventListener('click', () => this.exportLog('markdown'));
    document.getElementById('btn-export-log-modal').addEventListener('click', () => this.exportLog('markdown'));

    // Restart Trip Button
    document.getElementById('btn-restart-trip').addEventListener('click', () => {
      document.getElementById('modal-gameover').classList.add('hidden');
      this.showScreen('screen-selector');
      this.sceneManager.transitionToSelectorCamera();
    });
  }

  /* --------------------------------------------------------------------------
     GAMEPLAY FLOW & TRIP CONTROLLER
     -------------------------------------------------------------------------- */
  startTrip() {
    this.playSound('click');
    this.showScreen('screen-gameplay');
    this.sceneManager.transitionToGameplayCamera();

    const initialState = this.storyEngine.startTrip({
      plot: this.selectedPlot,
      timeline: this.selectedTimeline,
      character: this.selectedCharacter,
      mode: this.selectedMode
    });

    // Update HUD
    document.getElementById('hud-char-avatar').textContent = this.selectedCharacter.avatar;
    document.getElementById('hud-char-name').textContent = this.selectedCharacter.name;
    document.getElementById('hud-char-role').textContent = this.selectedCharacter.role;
    document.getElementById('story-location-title').textContent = `LOCATION: ${this.selectedPlot.startingLocation.toUpperCase()}`;

    this.updateHudState();

    // Render Initial Story Segment with Typewriter Effect
    this.renderStoryText(initialState.storySegment, initialState.question, () => {
      this.enableInputAndStartTimer();
    });
  }

  enableInputAndStartTimer() {
    const input = document.getElementById('user-response-input');
    const submitBtn = document.getElementById('btn-submit-action');

    input.disabled = false;
    submitBtn.disabled = false;
    input.value = '';
    input.focus();

    // Start Countdown Timer
    this.storyEngine.startTurnTimer(
      (remaining, duration) => this.onTimerTick(remaining, duration),
      () => this.onTimerExpired()
    );
  }

  onTimerTick(remaining, total) {
    const secondsEl = document.getElementById('timer-seconds');
    const fillEl = document.getElementById('timer-bar-fill');

    secondsEl.textContent = `${remaining}s`;
    const pct = (remaining / total) * 100;
    fillEl.style.width = `${pct}%`;

    if (remaining <= 5) {
      fillEl.className = "timer-bar-fill danger";
      this.playSound('timer-tick');
    } else {
      fillEl.className = "timer-bar-fill";
    }
  }

  onTimerExpired() {
    this.playSound('gameover');
    this.disableInput();
    this.showGameOverModal("Time Expired! You failed to type your single-sentence action before the countdown reached 0.");
  }

  async handleUserAction(userActionText) {
    this.disableInput();
    this.storyEngine.stopTurnTimer();
    this.playSound('click');

    // Show LLM Thinking Indicator
    const llmIndicator = document.getElementById('llm-indicator');
    llmIndicator.classList.add('active');

    // Fetch Story Expansion from Ollama Service
    const llmResult = await this.ollamaService.generateStoryStep({
      plot: this.storyEngine.activePlot,
      timeline: this.storyEngine.activeTimeline,
      character: this.storyEngine.activeCharacter,
      mode: this.storyEngine.mode,
      turnNumber: this.storyEngine.turnNumber,
      lastStorySegment: this.storyEngine.currentStorySegment,
      lastQuestion: this.storyEngine.currentQuestion,
      userResponse: userActionText,
      currentWarningCount: this.storyEngine.warningCount,
      currentStateTier: this.storyEngine.getCurrentTier()
    });

    llmIndicator.classList.remove('active');

    // Process State Update via StoryEngine
    const turnResult = this.storyEngine.processTurnResult(llmResult, userActionText);

    if (turnResult.isGameOver) {
      this.playSound('gameover');
      this.showGameOverModal(turnResult.reason);
      return;
    }

    // Display Feedback Banners (Absurd Weaver or Logic Warning)
    this.renderFeedbackBanner(turnResult);

    // Update HUD Meters
    this.updateHudState();

    // Play Sound effect based on turn outcome
    if (turnResult.isWarning) {
      this.playSound('warning');
    } else if (turnResult.educationalFeedback && turnResult.educationalFeedback.includes('Excellent')) {
      this.playSound('upgrade');
    }

    // Render Next Story Phase
    this.renderStoryText(turnResult.storySegment, turnResult.question, () => {
      this.enableInputAndStartTimer();
    });
  }

  renderFeedbackBanner(result) {
    const banner = document.getElementById('feedback-banner');
    const icon = document.getElementById('feedback-icon');
    const title = document.getElementById('feedback-title');
    const msg = document.getElementById('feedback-message');

    if (result.isWarning) {
      banner.className = "feedback-banner warning";
      icon.textContent = "⚠️";
      title.textContent = `LOGIC WARNING (${result.warningCount}/3)`;
      msg.textContent = result.warningReason || "Your proposed action is unacceptable for the current situation.";
      banner.classList.remove('hidden');
    } else if (result.isAbsurd) {
      banner.className = "feedback-banner absurd";
      icon.textContent = "🌀";
      title.textContent = "ABSURD ACTION RE-ROUTED";
      msg.textContent = result.absurdExplanation || "Your wild response has been woven back onto the main storyline track.";
      banner.classList.remove('hidden');
    } else if (result.educationalFeedback) {
      banner.className = "feedback-banner state-upgrade";
      icon.textContent = "🎓";
      title.textContent = "SUBJECT KNOWLEDGE EVALUATION";
      msg.textContent = result.educationalFeedback;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  updateHudState() {
    // 1. Turn Number
    document.getElementById('turn-number').textContent = `#${this.storyEngine.turnNumber}`;

    // 2. Warning Dots
    const warnCount = this.storyEngine.warningCount;
    document.getElementById('warn-1').className = warnCount >= 1 ? "warn-dot active" : "warn-dot";
    document.getElementById('warn-2').className = warnCount >= 2 ? "warn-dot active" : "warn-dot";
    document.getElementById('warn-3').className = warnCount >= 3 ? "warn-dot active" : "warn-dot";
    document.getElementById('warn-count-text').textContent = `${warnCount} / 3`;

    // 3. State Tier Badge & Fill Bar
    const tier = this.storyEngine.getCurrentTier();
    const tierName = document.getElementById('tier-name');
    const tierBadge = document.getElementById('state-tier-badge');
    const fillBar = document.getElementById('state-bar-fill');

    tierName.textContent = tier;
    tierBadge.className = `state-badge tier-${tier.toLowerCase()}`;
    fillBar.style.width = `${this.storyEngine.stateHealth}%`;
  }

  renderStoryText(text, question, onComplete) {
    const textEl = document.getElementById('story-text');
    const qBox = document.getElementById('prompt-question-box');
    const qText = document.getElementById('question-text');
    const terminalBody = document.getElementById('terminal-body');

    qBox.classList.add('hidden');
    textEl.textContent = '';

    let index = 0;
    const speed = 12; // ms per char

    const type = () => {
      if (index < text.length) {
        textEl.textContent += text.charAt(index);
        index++;
        terminalBody.scrollTop = terminalBody.scrollHeight;
        setTimeout(type, speed);
      } else {
        if (question) {
          qText.textContent = question;
          qBox.classList.remove('hidden');
        }
        terminalBody.scrollTop = terminalBody.scrollHeight;
        if (onComplete) onComplete();
      }
    };

    type();
  }

  disableInput() {
    const input = document.getElementById('user-response-input');
    const submitBtn = document.getElementById('btn-submit-action');
    input.disabled = true;
    submitBtn.disabled = true;
  }

  showGameOverModal(reason) {
    document.getElementById('go-reason-text').textContent = reason;
    document.getElementById('go-stat-turns').textContent = this.storyEngine.turnNumber;
    document.getElementById('go-stat-warns').textContent = `${this.storyEngine.warningCount}/3`;
    document.getElementById('go-stat-tier').textContent = this.storyEngine.getCurrentTier();

    document.getElementById('modal-gameover').classList.remove('hidden');
  }

  openLogDrawer() {
    const container = document.getElementById('log-timeline-list');
    const log = this.storyEngine.journeyLog;

    if (log.length === 0) {
      container.innerHTML = `<div class="empty-log-msg">No story history recorded yet. Embark on a trip to create your timeline!</div>`;
    } else {
      container.innerHTML = log.map(item => `
        <div class="log-entry">
          <div class="log-turn">Turn #${item.turn} <small style="color:#64748b">(${item.timestamp})</small></div>
          ${item.userResponse ? `<div class="log-action">Action: "${item.userResponse}"</div>` : ''}
          <div class="log-segment">${item.storySegment}</div>
          ${item.isAbsurd ? `<div style="color:#c084fc;font-size:0.75rem">🌀 Absurdity Re-routed: ${item.absurdExplanation}</div>` : ''}
          ${item.isWarning ? `<div style="color:#ef4444;font-size:0.75rem">⚠️ Logic Warning: ${item.warningReason}</div>` : ''}
        </div>
      `).join('');
    }

    document.getElementById('drawer-log').classList.remove('hidden');
  }

  exportLog(format) {
    let content = "";
    let filename = "";
    let mime = "";

    if (format === 'json') {
      content = this.storyEngine.exportAsJson();
      filename = `text_trips_log_${Date.now()}.json`;
      mime = "application/json";
    } else {
      content = this.storyEngine.exportAsMarkdown();
      filename = `text_trips_log_${Date.now()}.md`;
      mime = "text/markdown";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
  }
}

// Instantiate and start app when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
