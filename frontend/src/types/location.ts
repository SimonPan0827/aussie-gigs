export const AU_STATES = [
  { code: "ACT", label: "Australian Capital Territory" },
  { code: "NSW", label: "New South Wales" },
  { code: "NT", label: "Northern Territory" },
  { code: "QLD", label: "Queensland" },
  { code: "SA", label: "South Australia" },
  { code: "TAS", label: "Tasmania" },
  { code: "VIC", label: "Victoria" },
  { code: "WA", label: "Western Australia" },
] as const;

export type AustralianState = (typeof AU_STATES)[number]["code"];
