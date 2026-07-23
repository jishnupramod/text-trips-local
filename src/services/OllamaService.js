/* ==========================================================================
   OLLAMA REST API SERVICE & RESILIENT STORYTELLER ENGINE
   ========================================================================== */

export class OllamaService {
  constructor() {
    this.baseUrl = "http://localhost:11434";
    this.selectedModel = "auto";
    this.availableModels = [];
    this.temperature = 0.7;
    this.useFallback = true;
    this.isConnected = false;
  }

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, "");
  }

  /**
   * Check connection to Ollama server and fetch available models
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        this.availableModels = data.models || [];
        this.isConnected = true;
        
        if (this.selectedModel === "auto" && this.availableModels.length > 0) {
          this.selectedModel = this.availableModels[0].name;
        }
        return { success: true, models: this.availableModels, activeModel: this.selectedModel };
      }
    } catch (err) {
      console.warn("Ollama server not detected on", this.baseUrl, ". Fallback mode enabled.", err);
    }

    this.isConnected = false;
    return { success: false, fallback: this.useFallback };
  }

  /**
   * Generate Next Story Segment using Ollama or Fallback Engine
   */
  async generateStoryStep(context) {
    const {
      plot,
      timeline,
      character,
      mode,
      turnNumber,
      lastStorySegment,
      lastQuestion,
      userResponse,
      currentWarningCount,
      currentStateTier
    } = context;

    if (this.isConnected && this.selectedModel !== "auto") {
      try {
        const result = await this.callOllamaApi(context);
        if (result) return result;
      } catch (err) {
        console.error("Ollama API call failed, switching to fallback storyteller:", err);
      }
    }

    // Use Procedural Fallback Engine if Ollama is unreachable
    return this.proceduralFallbackStoryStep(context);
  }

  /**
   * Send structured JSON prompt request to Ollama
   */
  async callOllamaApi(context) {
    const {
      plot,
      timeline,
      character,
      mode,
      turnNumber,
      lastStorySegment,
      lastQuestion,
      userResponse,
      currentWarningCount,
      currentStateTier
    } = context;

    const systemPrompt = `You are an expert non-deterministic AI game master for an adventure game called "Text Trips Local".
Game Rules:
1. Player choice comes in as a single-sentence response: "${userResponse || 'Beginning of trip'}".
2. Current Mode: ${mode === 'educational' ? 'EDUCATIONAL MODE (evaluating subject mastery: ' + (plot.educationalSubject || 'General Science') + ')' : 'ADVENTURE STORY MODE'}.
3. Character: ${character.name} (${character.role}).
4. Current Warning Count: ${currentWarningCount}/3 (Max 3 warnings before Game Over).
5. Current State Tier: ${currentStateTier}.

STRICT ABSURDITY & PLOT DETOUR RULES:
- BE EXTREMELY STRICT. Any player action that takes even a slight detour from the main storyline, introduces unrelated topics (e.g. food, sports, pop culture, random names, unrelated trivia, or off-topic actions like "watch fifa", "burger king", "read harry potter", "a snake was once a bird", "raju went to study Arabic", "blow a balloon", "moon", etc.), or fails to directly attempt solving the current prompt MUST BE CLASSIFIED AS ABSURD AND A LOGIC WARNING.
- For ANY detour/absurd response:
  - Set "isAbsurd": true
  - Set "isWarning": true
  - Set "warningReason": "Short explanation of how this action detours from the mainline scenario objective."
  - Set "stateTierDelta": "DEMOTE"
  - ABSURDITY WEAVER: In "storySegment", weave the absurd action into the narrative in a surprising or humorous way, BUT immediately bring the story right back onto the main plot track.

- REALISTIC & PLOT-RELEVANT CHOICES:
  - Only if the player's action directly addresses the scenario prompt with a realistic tactical action:
    - Set "isAbsurd": false
    - Set "isWarning": false
    - In EDUCATIONAL MODE: score accuracy 1-5 (4-5 = "UPGRADE", 3 = "MAINTAIN", 1-2 = "DEMOTE")
    - In ADVENTURE MODE: effective action = "MAINTAIN" or "UPGRADE", dangerous action = "DEMOTE"

- Always end the storySegment with a dramatic open-ended situation, followed by a clear single-sentence "openQuestion".

You MUST return strictly valid JSON matching this schema:
{
  "storySegment": "Detailed narrative paragraph describing what happens next...",
  "openQuestion": "What single sentence action do you take now?",
  "isAbsurd": boolean,
  "absurdExplanation": "String explaining how the absurd response was re-routed",
  "isWarning": boolean,
  "warningReason": "String rationale if warning issued",
  "educationalScore": number (1-5),
  "educationalFeedback": "Brief feedback on answer validity",
  "stateTierDelta": "UPGRADE" | "MAINTAIN" | "DEMOTE"
}`;

    const prompt = `Turn #${turnNumber}
Previous Story Context: ${lastStorySegment || plot.initialPrompt}
Previous Question: ${lastQuestion || plot.question}
Player Single-Sentence Action: ${userResponse || 'I prepare my gear and take a deep breath.'}

Generate next story phase in JSON format:`;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.selectedModel,
        prompt: `${systemPrompt}\n\n${prompt}`,
        format: "json",
        options: {
          temperature: this.temperature,
          num_predict: 512
        },
        stream: false
      })
    });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();

    try {
      const parsed = JSON.parse(data.response);
      return {
        storySegment: parsed.storySegment || "The adventure continues as the timeline shifts.",
        openQuestion: parsed.openQuestion || "What is your next move?",
        isAbsurd: !!parsed.isAbsurd,
        absurdExplanation: parsed.absurdExplanation || "",
        isWarning: !!parsed.isWarning || !!parsed.isAbsurd,
        warningReason: parsed.warningReason || (parsed.isAbsurd ? "Action detoured from the mainline scenario." : ""),
        educationalScore: parsed.educationalScore || 3,
        educationalFeedback: parsed.educationalFeedback || "",
        stateTierDelta: parsed.isAbsurd ? "DEMOTE" : (parsed.stateTierDelta || "MAINTAIN"),
        source: "ollama"
      };
    } catch (parseErr) {
      console.warn("Raw LLM response was not valid JSON, returning fallback parser:", data.response);
      return {
        storySegment: data.response.replace(/\{[\s\S]*\}/, '').trim() || data.response,
        openQuestion: "How do you respond to this new development?",
        isAbsurd: false,
        isWarning: false,
        stateTierDelta: "MAINTAIN",
        source: "ollama-raw"
      };
    }
  }

  /**
   * Procedural Fallback Engine (Runs locally when Ollama server is offline)
   */
  proceduralFallbackStoryStep(context) {
    const { userResponse, turnNumber, mode, plot } = context;
    const lowerInput = (userResponse || "").toLowerCase();

    let isAbsurd = false;
    let absurdExplanation = "";
    let isWarning = false;
    let warningReason = "";
    let stateTierDelta = "MAINTAIN";
    let educationalFeedback = "";

    // Heuristics for off-topic/absurd detours (pop culture, food, sports, random trivia, nonsensical phrases)
    const detourKeywords = [
      "pizza", "burger", "fries", "food", "banana", "dance", "sing", "unicorn", "fluffy", 
      "tiktok", "nuke", "sleep", "fly away", "harry potter", "fifa", "world cup", "arabic", 
      "radha", "raju", "balloon", "giraffe", "elephant", "lion", "snake", "bird", "lol", 
      "laughing out loud", "moon", "star", "movie", "game", "timer"
    ];

    // Scenario plot keywords that show genuine tactical intent
    const relevantKeywords = [
      "hack", "deck", "laser", "decrypt", "tunnel", "quantum", "bypass", "shield", "power", 
      "vault", "server", "console", "scan", "signal", "override", "chamber", "stabilize", 
      "catenary", "device", "gear", "circuit", "frequency"
    ];

    const containsDetour = detourKeywords.some(kw => lowerInput.includes(kw));
    const containsRelevant = relevantKeywords.some(kw => lowerInput.includes(kw));

    if (containsDetour || (!containsRelevant && lowerInput.length > 0 && turnNumber > 1)) {
      isAbsurd = true;
      isWarning = true;
      stateTierDelta = "DEMOTE";
      warningReason = `Your choice ("${userResponse}") detoured from the core scenario objective, creating a dangerous distraction.`;
      absurdExplanation = `Your off-topic response ("${userResponse}") was woven into the narrative, but cost you valuable tactical standing.`;
    }

    // Danger / Self-Sabotage heuristics
    const warningKeywords = ["do nothing", "give up", "die", "jump off", "ignore", "explode myself", "destroy controls"];
    if (warningKeywords.some(kw => lowerInput.includes(kw))) {
      isWarning = true;
      warningReason = `Surrendering or recklessly sabotaging vital controls ("${userResponse}") endangers your mission.`;
      stateTierDelta = "DEMOTE";
    }

    // Educational Mode Evaluation
    if (mode === 'educational') {
      if (containsRelevant && !isAbsurd) {
        stateTierDelta = "UPGRADE";
        educationalFeedback = "Excellent application of technical reasoning! Your understanding of the underlying principles strengthens your operational status.";
      } else {
        stateTierDelta = "DEMOTE";
        educationalFeedback = "Weak technical foundation. Precise scientific or tactical reasoning is required to elevate your state.";
      }
    }

    // Dynamic story branching segments
    const narrativeTemplates = [
      `Reacting to your action ("${userResponse}"), the environmental telemetry spikes. Metallic panels resonate with electromagnetic hums, revealing a hidden bypass hatch behind the central console.`,
      `As you execute your decision, an unexpected power surge ripples through the corridor. The ambient glow turns sharp amber as sub-routines recalculate your trajectory.`,
      `Your action creates an immediate ripple effect. Sensors recalibrate, and a low-frequency hum indicates secondary containment systems are engaging.`
    ];

    const segmentIndex = (turnNumber - 1) % narrativeTemplates.length;
    let storyText = narrativeTemplates[segmentIndex];

    if (isAbsurd) {
      storyText = `${absurdExplanation}\n\n${storyText}`;
    }

    const questionTemplates = [
      "Do you manually override the emergency breaker or re-route power through the backup auxiliary bus?",
      "Will you scan the thermal signatures ahead or attempt to force open the pressure valve?",
      "How do you deploy your remaining equipment to secure this sector before time expires?"
    ];

    return {
      storySegment: storyText,
      openQuestion: questionTemplates[turnNumber % questionTemplates.length],
      isAbsurd,
      absurdExplanation,
      isWarning,
      warningReason,
      educationalScore: stateTierDelta === 'UPGRADE' ? 5 : (stateTierDelta === 'DEMOTE' ? 2 : 1),
      educationalFeedback,
      stateTierDelta,
      source: "procedural-fallback"
    };
  }
}
