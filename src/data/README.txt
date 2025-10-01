Guidance data (local JSON)

Overview
- The app can read guidance for each space (Bedroom, Toilet, Kitchen, etc.) from JSON files in this folder.
- Files are matched by name (see “File names” below). Data is looked up by 16‑point compass direction.
- Two supported formats: Object keyed by compass codes OR Array rows. See examples.

Compass labels (exact)
- N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW

File names (create any that you need)
- bedroom.json
- main_entrance.json
- main_entrance_2.json
- main_entrance_3.json
- kitchen.json
- entertainment_room.json
- study_room.json
- guest_room.json
- toilet.json
- drawing_room.json
- dinning_hall.json
- ac.json
- staircase.json
- underground_watertank.json
- septik_tank.json
- inverter.json
- heater.json
- washing_area.json
- bar.json

Required fields per direction entry
- zone: string (e.g., Best/Good/Neutral/Bad). Free text allowed; app normalizes some values.
- element: string (e.g., water/fire/earth/air/space)
- remedies_primary: string[] (list of remedies)
- remedies_secondary: string[] (optional list)
- effect: string[] (list of effects)

Format A: Object keyed by compass codes (recommended)
{
  "N": {
    "zone": "Best",
    "element": "water",
    "remedies_primary": ["Use Zinc", "Avoid red sheets"],
    "remedies_secondary": ["Use blue", "Use white"],
    "effect": ["Promotes prosperity", "Peaceful sleep"]
  },
  "NNE": { "zone": "Bad", "element": "water", "remedies_primary": ["..."], "remedies_secondary": [], "effect": ["..."] }
  // ... include all 16 labels
}

Format B: Array rows (also supported)
[
  {
    "direction": "North",                     // or "North (N)" or "N"
    "compass_direction": "N",                 // if both present, this wins
    "zone": "Best",
    "element": "water",
    "remedies_primary": ["Use Zinc", "Avoid red sheets"],
    "remedies_secondary": ["Use blue"],
    "effect": ["Promotes prosperity", "Peaceful sleep"]
  },
  {
    "direction": "North-Northeast (NNE)",
    "zone": "Bad",
    "element": "water",
    "remedies_primary": ["..."],
    "remedies_secondary": [],
    "effect": ["..."]
  }
]

Notes
- The loader normalizes direction names:
  - If direction includes parentheses, e.g., "Northeast (NE)", it uses the abbreviation inside.
  - Full names like "West-Northwest" map to WNW automatically.
- Keep 16 entries per space for full coverage. Missing entries will show no guidance in the PDF.
- Arrays may contain empty strings; the app filters them out.

How the app uses this data
- In the Image tools (Stage 3), click "Load Local" to load these JSON files.
- When generating the report, each placed area’s center direction is matched to the corresponding file and direction entry.
- The PDF shows Direction, then Effects and Remedies bullets from your JSON (Zone/Element can be shown on request).

Starter
- Copy placeholder.json and rename it, then fill in all 16 compass labels.

