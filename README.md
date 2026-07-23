# 🌌 Text Trips Local

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Three.js](https://img.shields.io/badge/Built%20with-Three.js-00f0ff.svg)](https://threejs.org/)
[![Powered by Ollama](https://img.shields.io/badge/Powered%20by-Ollama-7000ff.svg)](https://ollama.com/)

> **Text Trips Local** is an interactive, non-deterministic text adventure and educational RPG powered by local LLMs via **Ollama**, wrapped in an immersive, dynamic 3D visual environment built with **Three.js**.

---

## ⚡ Built with Gemini 3.6 Flash (< 30 Minutes)

This entire application—from the Three.js 3D selector matrix, dynamic WebGL particle background, Web Audio API synthesizer, Ollama REST API integration, state tier engine, warning & absurdity weaver, to full export capabilities—was designed, implemented, and verified in **less than 30 minutes** as a rapid test of **Gemini 3.6 Flash (High)**.

---

## 🎮 Game Concept & Mechanics

Text Trips Local re-imagines classic text adventure games by replacing static decision trees with dynamic, open-ended LLM story generation:

- **Timer-Based Decision Loop**: Each turn presents an open-ended scenario question with a countdown timer (e.g. 30 seconds). Players must type a concise, single-sentence action before time expires. Failing to act before the timer reaches zero results in an instant Game Over.
- **Absurdity Weaver & Re-routing Engine**: If a player inputs an out-of-context or absurd response (e.g. *"I go to McDonald's for chicken wings"* or *"I read Harry Potter"* during a sci-fi vault heist), the AI game master creatively weaves the absurd action into the story to bring the narrative back on track—while issuing a **Logic Warning** and **demoting the player's state**.
- **Warning Meter & Health Tiers**: Accumulating **3 Logic Warnings** or letting your character state collapse to **DISASTER** triggers a Game Over.
- **Educational RPG Mode**: Designed with immense potential for interactive learning. Scenarios test real subject knowledge (Physics, Chemistry, Cybersecurity, History). Optimal technical answers elevate player state (unlocking better equipment and advantages), while flawed reasoning degrades status—motivating players to learn and answer precisely.

---

## 🧪 Local Model Performance & Benchmarks

Gameplay was extensively tested using the **`granite4.1:3b`** model running locally via **Ollama**:

- **Model**: `granite4.1:3b`
- **Hardware**: Apple Silicon **M5 Max MacBook Pro**
- **Average Generation Throughput**: **~110 tokens/second** ⚡
- **Experience**: Performed remarkably well despite its compact 3B parameter footprint. Achieving an average generation throughput of **110 tokens/sec** provided near-instantaneous narrative turn expansion, seamless absurdity re-routing, and instant real-time response evaluations.

> 💡 **Offline Resiliency**: A built-in **Procedural Local Fallback Engine** allows playing immediately even if Ollama is offline or downloading models.

---

## 🎨 3D UI & Visual Architecture

- **Interactive 3D Matrix**: Select plots, timelines/eras, protagonists, and game modes via interactive 3D celestial nodes and glassmorphic cards.
- **Dynamic WebGL Themes**: Ambient particle lattices, grid planes, and lighting dynamically shift between visual themes (*Cyberpunk Neon Grid*, *Ancient Relic Runes*, *Deep Space Nebula*, *Quantum Lab Lattice*).
- **⚡ Real-Time Generation Throughput Widget**: Integrated top-nav and terminal header widgets that display live generation speed (`tokens/sec`), evaluated token counts (`eval_count`), and evaluation latency (`eval_duration`) for every LLM story expansion turn.
- **Cyber-Terminal HUD**: Glassmorphic HUD overlay featuring typewriter text animation, location headers, status lights, state health bars, warning indicators, and Web Audio sound synthesis.
- **Travelogue Export**: Download your entire timeline history as formatted **Markdown** or **JSON** logs (including token throughput records per turn).

---

## 🚀 Getting Started

### 1. Clone & Run Web App

```bash
git clone git@github.com:jishnupramod/text-trips-local.git
cd text-trips-local
python3 -m http.server 8080
```

Open **[http://localhost:8080](http://localhost:8080)** in any modern web browser.

### 2. Connect Local Ollama (Optional but Recommended)

1. Install and start [Ollama](https://ollama.com/):
   ```bash
   ollama serve
   ```
2. Pull a lightweight local LLM model (e.g. `granite4.1:3b`, `llama3`, `mistral`, `gemma`, `phi3`):
   ```bash
   ollama pull granite4.1:3b
   ```
3. Allow web app origins if running into CORS issues:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```
4. Click the **Ollama Status Widget** in the top navigation bar to select your model or configure server settings (`http://localhost:11434`).

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
