export type GlossaryEntry = {
  term: string;
  definition: string;
  emoji: string;
};

const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Dissolved Oxygen",
    definition: "The amount of oxygen mixed into the water. Fish and other animals breathe this to survive — like how we need oxygen in the air.",
    emoji: "💨",
  },
  {
    term: "Estuary",
    definition: "A place where a river meets the ocean. The water is a mix of fresh and salt water. Long Island Sound is a big estuary!",
    emoji: "🌊",
  },
  {
    term: "pH",
    definition: "A scale from 0–14 that measures if water is acidic or basic. 7 is neutral. Ocean water is usually around 8.",
    emoji: "⚗️",
  },
  {
    term: "CFU/100mL",
    definition: "Colony-Forming Units per 100 milliliters — a way to count bacteria in water. Higher numbers mean more bacteria.",
    emoji: "🦠",
  },
  {
    term: "Hypoxia",
    definition: "When water has very little dissolved oxygen. This can create 'dead zones' where fish and crabs can't survive.",
    emoji: "☠️",
  },
  {
    term: "Nitrogen",
    definition: "A nutrient that plants need to grow. Too much in water causes algae blooms that use up all the oxygen.",
    emoji: "🌿",
  },
  {
    term: "Algae Bloom",
    definition: "When tiny water plants (algae) grow out of control because of too many nutrients. The water can turn green.",
    emoji: "🟢",
  },
  {
    term: "Monitoring Station",
    definition: "A specific spot where scientists regularly collect water samples to test quality.",
    emoji: "📍",
  },
  {
    term: "Trend",
    definition: "The direction something is changing over time — getting better (improving), getting worse (declining), or staying the same (stable).",
    emoji: "📈",
  },
  {
    term: "mg/L",
    definition: "Milligrams per liter — a common unit for measuring how much of a substance is dissolved in water.",
    emoji: "💧",
  },
  {
    term: "Bacteria",
    definition: "Tiny organisms found everywhere. In water, certain types (like E. coli) indicate pollution from human or animal waste.",
    emoji: "🦠",
  },
  {
    term: "Enterococcus",
    definition: "A type of bacteria used to test if ocean or Sound water is safe for swimming. High levels mean possible sewage contamination.",
    emoji: "🔬",
  },
  {
    term: "Fecal Coliform",
    definition: "Bacteria from the intestines of warm-blooded animals. Their presence in water suggests contamination from sewage or animal waste.",
    emoji: "⚠️",
  },
  {
    term: "Nitrate",
    definition: "A form of nitrogen that often comes from fertilizer runoff. Too much nitrate feeds algae and can harm water quality.",
    emoji: "🧪",
  },
  {
    term: "Ocean Acidification",
    definition: "When the ocean absorbs CO₂ from the atmosphere and becomes more acidic. This makes it harder for shellfish to build their shells.",
    emoji: "🐚",
  },
  {
    term: "Dead Zone",
    definition: "An area of water with so little oxygen that most marine life can't survive. Often caused by excess nutrients and algae blooms.",
    emoji: "💀",
  },
  {
    term: "Stormwater Runoff",
    definition: "Rainwater that flows over streets, lawns, and parking lots, picking up pollutants like oil, fertilizer, and bacteria before entering waterways.",
    emoji: "🌧️",
  },
  {
    term: "Water Temperature",
    definition: "How warm or cold the water is. Cold water holds more oxygen than warm water, so temperature affects everything in the ecosystem.",
    emoji: "🌡️",
  },
  {
    term: "Nutrient Pollution",
    definition: "When too many nutrients (especially nitrogen and phosphorus) enter the water, causing algae blooms and oxygen depletion.",
    emoji: "🚱",
  },
  {
    term: "Watershed",
    definition: "An area of land where all the water drains to the same place — like a giant funnel for rain and streams.",
    emoji: "🏔️",
  },
];

export default GLOSSARY;

/**
 * Find a glossary entry by term (case-insensitive).
 */
export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
  return GLOSSARY.find(
    (e) => e.term.toLowerCase() === term.toLowerCase(),
  );
}

