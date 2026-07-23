/* ==========================================================================
   PRESET SCENARIOS, ERAS, CHARACTERS & EDUCATIONAL TRACKS
   ========================================================================== */

export const PRESET_PLOTS = [
  {
    id: "cyberpunk-heist",
    title: "The Neo-Tokyo Data Vault Heist",
    theme: "theme-cyberpunk",
    icon: "🌆",
    category: "Sci-Fi Thriller",
    summary: "In 2099, an encrypted AI neural core containing classified memory drives is about to be wiped. You must infiltrate the megacorp vault.",
    startingLocation: "Shinjuku Subterranean Server Core",
    initialPrompt: "You crouch behind a glowing server rack in the quietest corridor of Kurogane Megacorp. Thermal security lasers sweep across the ceiling. In your hand is a cracked decryptor deck with 3% power remaining. An automated voice echoes: 'Security patrol arriving in 60 seconds.'",
    question: "How do you bypass the security sweep and access the main data vault before the patrol arrives?",
    educationalSubject: "Cybersecurity & Network Protocols"
  },
  {
    id: "ancient-alchemist",
    title: "The Lost Philosopher's Crucible",
    theme: "theme-ancient",
    icon: "🏺",
    category: "Historical Fantasy",
    summary: "Alexandria, 280 AD. In the hidden catacombs beneath the Great Library, you discover a sealed chamber housing an alchemical engine.",
    startingLocation: "Catacombs of Alexandria",
    initialPrompt: "Ancient bronze gears grind above you. Water trickles onto a glowing green pool of volatile alchemical liquid. Before you stand three stone pillars inscribed with ancient symbols and a sealed iron doorway dripping with mercury.",
    question: "Which mechanism or element will you manipulate to unseal the chamber without igniting the volatile liquid?",
    educationalSubject: "Chemistry & Elemental Reactions"
  },
  {
    id: "quantum-incident",
    title: "The Particle Accelerator Anomaly",
    theme: "theme-quantum",
    icon: "⚛️",
    category: "Quantum Physics Quest",
    summary: "CERN, 2032. High-energy collisions created a localized micro-singularity that is destabilizing space-time within sector 7.",
    startingLocation: "Large Hadron Collider Chamber 7",
    initialPrompt: "Sirens blare as blue Cherenkov radiation illuminates the vacuum chamber. A floating gravitational pocket is pulling nearby diagnostic tablets and equipment into its center. The containment field battery is dropping by 1% per second.",
    question: "What physical force or magnetic containment field adjustments do you apply to stabilize the singularity?",
    educationalSubject: "Quantum Mechanics & General Relativity"
  },
  {
    id: "deep-space-distress",
    title: "Derelict Freighter 'Prometheus-9'",
    theme: "theme-space",
    icon: "🚀",
    category: "Cosmic Sci-Fi",
    summary: "Responding to an automated distress beacon at the edge of the Kuiper Belt, you board an unmapped derelict research vessel.",
    startingLocation: "Airlock Bay 2, Prometheus-9",
    initialPrompt: "The airlock hissed open into pitch-black zero gravity. Frost coats the corridors. Your suit diagnostics warn that oxygen reserve is at 45 minutes, and an unknown bio-luminescent pulse is emanating from the hydroponics bay.",
    question: "Do you restore main power first or investigate the hydroponics bay bio-signal?",
    educationalSubject: "Astrophysics & Life Support Systems"
  },
  {
    id: "medieval-kingdom",
    title: "The Siege of Ravenhold Castle",
    theme: "theme-ancient",
    icon: "🏰",
    category: "Medieval Tactics",
    summary: "The castle walls are under heavy trebuchet bombardment. Supplies are dwindling, and an internal betrayal is suspected.",
    startingLocation: "Great Keep Council Room",
    initialPrompt: "Dust falls from the stone ceiling as another boulder strikes the outer gatehouse. Your captain of the guard insists on an immediate cavalry counter-charge, while your master engineer urges fortifying the inner courtyard breach.",
    question: "What strategic tactical command do you issue to defend the keep and catch the traitor?",
    educationalSubject: "Medieval History & Strategic Logic"
  }
];

export const PRESET_TIMELINES = [
  {
    id: "era-cyberpunk",
    name: "Neo-Dystopia (2099)",
    icon: "🏙️",
    desc: "Neon rain, high-tech cybernetics, AI monopolies, and underground netrunners."
  },
  {
    id: "era-ancient",
    name: "Classical Antiquity (300 AD)",
    icon: "🏛️",
    desc: "Ancient empires, secret alchemical scrolls, stone monuments, and forgotten gods."
  },
  {
    id: "era-space",
    name: "Deep Space Frontier (2250)",
    icon: "🌌",
    desc: "Orbital stations, zero-g anomalies, interstellar warp drives, and dark matter mysteries."
  },
  {
    id: "era-quantum",
    name: "Subatomic Lab (Present Day)",
    icon: "🧪",
    desc: "High-energy particle labs, quantum superposition, laser interferometry, and scientific breakthroughs."
  }
];

export const PRESET_CHARACTERS = [
  {
    id: "char-hacker",
    name: "Kaelen Vance",
    role: "Infiltration Specialist / Netrunner",
    avatar: "🕵️‍♂️",
    traits: ["High Tech Intellect", "Quick Reflexes", "Fragile Health"],
    stateTier: "OPTIMAL"
  },
  {
    id: "char-scholar",
    name: "Dr. Elena Rostova",
    role: "Quantum Physicist / Historian",
    avatar: "👩‍🔬",
    traits: ["Analytical Deductions", "Subject Mastery", "Resourceful"],
    stateTier: "OPTIMAL"
  },
  {
    id: "char-voyager",
    name: "Captain Jax Torean",
    role: "Deep Space Pilot & Survivalist",
    avatar: "👨‍🚀",
    traits: ["Combat Readiness", "Calm Under Pressure", "Mechanic"],
    stateTier: "OPTIMAL"
  },
  {
    id: "char-alchemist",
    name: "Master Aurelius",
    role: "Alchemist & Herbal Scholar",
    avatar: "🧙‍♂️",
    traits: ["Elemental Knowledge", "Keen Observation", "Cautious"],
    stateTier: "OPTIMAL"
  }
];
