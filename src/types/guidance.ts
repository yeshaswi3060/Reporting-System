export type GuidanceEntry = {
  zone: string;
  element: string;
  remedies_primary: string[];
  remedies_secondary: string[];
  effect: string[];
};

// roomType -> compassDirection -> entry
export type GuidanceMap = Record<string, Record<string, GuidanceEntry>>;


