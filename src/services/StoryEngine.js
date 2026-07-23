/* ==========================================================================
   STORY ENGINE & GAME STATE MANAGER
   ========================================================================== */

export class StoryEngine {
  constructor() {
    this.resetState();
  }

  resetState() {
    this.activePlot = null;
    this.activeTimeline = null;
    this.activeCharacter = null;
    this.mode = "adventure"; // 'adventure' | 'educational'
    
    this.turnNumber = 1;
    this.warningCount = 0;
    this.maxWarnings = 3;

    // State Tiers: OPTIMAL (100%), STRONG (75%), WARNING (50%), CRITICAL (25%), DISASTER (0%)
    this.stateTiers = ["OPTIMAL", "STRONG", "WARNING", "CRITICAL", "DISASTER"];
    this.currentTierIndex = 0; // Starts at OPTIMAL
    this.stateHealth = 100;

    this.currentStorySegment = "";
    this.currentQuestion = "";
    
    this.timerDuration = 30; // Seconds per turn
    this.timerRemaining = 30;
    this.timerInterval = null;
    this.onTimerTick = null;
    this.onTimerExpired = null;

    this.journeyLog = [];
    this.isGameOver = false;
    this.gameOverReason = "";
  }

  startTrip({ plot, timeline, character, mode }) {
    this.resetState();
    this.activePlot = plot;
    this.activeTimeline = timeline;
    this.activeCharacter = { ...character };
    this.mode = mode || "adventure";

    this.currentStorySegment = plot.initialPrompt;
    this.currentQuestion = plot.question;

    // Log Turn 1 Initial State
    this.recordLogEntry({
      turn: 1,
      storySegment: this.currentStorySegment,
      question: this.currentQuestion,
      userResponse: "[Trip Embarked]",
      isAbsurd: false,
      isWarning: false,
      tier: this.getCurrentTier()
    });

    return {
      storySegment: this.currentStorySegment,
      question: this.currentQuestion,
      turn: 1,
      tier: this.getCurrentTier(),
      warnings: this.warningCount
    };
  }

  startTurnTimer(onTick, onExpired) {
    this.stopTurnTimer();
    this.timerRemaining = this.timerDuration;
    this.onTimerTick = onTick;
    this.onTimerExpired = onExpired;

    if (this.onTimerTick) this.onTimerTick(this.timerRemaining, this.timerDuration);

    this.timerInterval = setInterval(() => {
      this.timerRemaining--;
      if (this.onTimerTick) this.onTimerTick(this.timerRemaining, this.timerDuration);

      if (this.timerRemaining <= 0) {
        this.stopTurnTimer();
        this.triggerGameOver("Time Expired! You failed to make a decision before the countdown elapsed.");
        if (this.onTimerExpired) this.onTimerExpired();
      }
    }, 1000);
  }

  stopTurnTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Process LLM Turn Step Output and update state
   */
  processTurnResult(llmResult, userResponse) {
    this.stopTurnTimer();

    // Any absurdity or plot detour is strictly treated as a logic warning & state demotion
    const isDetourOrAbsurd = !!llmResult.isAbsurd;
    let isWarningTriggered = !!llmResult.isWarning || isDetourOrAbsurd;

    if (isDetourOrAbsurd) {
      llmResult.isWarning = true;
      if (!llmResult.warningReason) {
        llmResult.warningReason = llmResult.absurdExplanation || "Your action detoured from the mainline scenario objective.";
      }
    }

    // 1. Check Warnings
    if (isWarningTriggered) {
      this.warningCount++;
      if (this.warningCount >= this.maxWarnings) {
        this.triggerGameOver(`3 Logic Warnings! Your repeated story detours and unacceptable actions crashed the mission.`);
        return { isGameOver: true, reason: this.gameOverReason, warningCount: this.warningCount };
      }
    }

    // 2. Process State Tier Delta (Absurdities or warnings always DEMOTE state tier)
    if (isWarningTriggered || llmResult.stateTierDelta === "DEMOTE") {
      this.currentTierIndex = Math.min(this.stateTiers.length - 1, this.currentTierIndex + 1);
    } else if (llmResult.stateTierDelta === "UPGRADE") {
      this.currentTierIndex = Math.max(0, this.currentTierIndex - 1);
    }

    // Calculate Health percentage based on tier index
    this.stateHealth = Math.max(0, 100 - (this.currentTierIndex * 25));

    if (this.currentTierIndex >= this.stateTiers.length - 1) {
      this.triggerGameOver("State Critical Collapse! Your character's condition degraded beyond recovery due to story detours.");
      return { isGameOver: true, reason: this.gameOverReason, warningCount: this.warningCount };
    }

    // 3. Advance Turn
    this.turnNumber++;
    this.currentStorySegment = llmResult.storySegment;
    this.currentQuestion = llmResult.openQuestion;

    // 4. Record to Journey Log
    this.recordLogEntry({
      turn: this.turnNumber,
      storySegment: this.currentStorySegment,
      question: this.currentQuestion,
      userResponse: userResponse,
      isAbsurd: llmResult.isAbsurd,
      absurdExplanation: llmResult.absurdExplanation,
      isWarning: llmResult.isWarning,
      warningReason: llmResult.warningReason,
      tier: this.getCurrentTier(),
      educationalFeedback: llmResult.educationalFeedback
    });

    return {
      isGameOver: false,
      turn: this.turnNumber,
      storySegment: this.currentStorySegment,
      question: this.currentQuestion,
      tier: this.getCurrentTier(),
      stateHealth: this.stateHealth,
      warningCount: this.warningCount,
      isAbsurd: llmResult.isAbsurd,
      absurdExplanation: llmResult.absurdExplanation,
      isWarning: llmResult.isWarning,
      warningReason: llmResult.warningReason,
      educationalFeedback: llmResult.educationalFeedback
    };
  }

  triggerGameOver(reason) {
    this.isGameOver = true;
    this.gameOverReason = reason;
    this.stopTurnTimer();
  }

  getCurrentTier() {
    return this.stateTiers[this.currentTierIndex] || "CRITICAL";
  }

  recordLogEntry(entry) {
    this.journeyLog.push({
      ...entry,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  exportAsJson() {
    return JSON.stringify({
      plot: this.activePlot?.title,
      timeline: this.activeTimeline?.name,
      character: this.activeCharacter?.name,
      mode: this.mode,
      turnsSurvived: this.turnNumber,
      warningsCount: this.warningCount,
      finalTier: this.getCurrentTier(),
      journeyLog: this.journeyLog
    }, null, 2);
  }

  exportAsMarkdown() {
    let md = `# TEXT TRIPS LOCAL - JOURNEY TRAVELOGUE\n\n`;
    md += `**Plot:** ${this.activePlot?.title || 'Custom'}\n`;
    md += `**Timeline:** ${this.activeTimeline?.name || 'Standard'}\n`;
    md += `**Protagonist:** ${this.activeCharacter?.name} (${this.activeCharacter?.role})\n`;
    md += `**Mode:** ${this.mode.toUpperCase()}\n`;
    md += `**Turns Survived:** ${this.turnNumber} | **Final State:** ${this.getCurrentTier()}\n\n`;
    md += `---\n\n## TIMELINE TRAJECTORY\n\n`;

    this.journeyLog.forEach(item => {
      md += `### Turn #${item.turn} [${item.timestamp}]\n`;
      if (item.userResponse) md += `> **Action:** *"${item.userResponse}"*\n\n`;
      md += `${item.storySegment}\n\n`;
      if (item.question) md += `**Question:** ${item.question}\n\n`;
      if (item.isAbsurd) md += `*🌀 Absurd Answer Re-routed:* ${item.absurdExplanation}\n\n`;
      if (item.isWarning) md += `*⚠️ Logic Warning:* ${item.warningReason}\n\n`;
      md += `---\n\n`;
    });

    return md;
  }
}
