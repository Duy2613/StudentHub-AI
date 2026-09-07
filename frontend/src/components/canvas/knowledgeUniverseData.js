/**
 * Lightweight knowledge graph data shared by the semantic view and the
 * optional WebGL enhancement. Keeping this module free of Three.js lets the
 * server-rendered shell and SVG fallback stay out of the WebGL dependency
 * graph.
 */
export const KNOWLEDGE_DOMAINS = [
  { id: "frontend", label: "Frontend", x: -2.2, y: 1.4, z: 0.2, color: "#65D8FF", domain: "Application" },
  { id: "backend", label: "Backend", x: 0.0, y: 1.8, z: -0.4, color: "#756BFF", domain: "Application" },
  { id: "database", label: "Database", x: 1.8, y: 1.2, z: 0.5, color: "#45D69A", domain: "Data & Storage" },
  { id: "security", label: "Security", x: 2.2, y: -0.5, z: -0.2, color: "#FF6377", domain: "Reliability" },
  { id: "ai", label: "AI Systems", x: -1.6, y: -0.8, z: 0.6, color: "#A78BFA", domain: "Intelligence" },
  { id: "system-design", label: "System Design", x: 0.5, y: -1.6, z: -0.5, color: "#FFB66D", domain: "Architecture" },
  { id: "cloud", label: "Cloud", x: 1.6, y: -1.8, z: 0.3, color: "#38BDF8", domain: "Platform" },
  { id: "devops", label: "DevOps", x: -0.8, y: -1.9, z: 0.4, color: "#FFCC66", domain: "Reliability" },
  { id: "embedded", label: "Embedded", x: -2.6, y: 0.2, z: -0.6, color: "#34E7C4", domain: "Hardware" },
];

export const KNOWLEDGE_RELATIONS = [
  ["frontend", "backend"],
  ["backend", "database"],
  ["backend", "security"],
  ["database", "system-design"],
  ["backend", "ai"],
  ["backend", "cloud"],
  ["cloud", "devops"],
  ["security", "system-design"],
  ["embedded", "backend"],
  ["frontend", "ai"],
];
