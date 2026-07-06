const scale = [
  { max: 5, bg: "#5b7a94" },
  { max: 10, bg: "#6f8ba3" },
  { max: 16, bg: "#7c9c8c" },
  { max: 21, bg: "#97a173" },
  { max: 25, bg: "#b39a63" },
  { max: 29, bg: "#b47f5c" },
  { max: Infinity, bg: "#a8614f" }
];

export function getTempColor(avgTempC: number): { bg: string; text: string } {
  const step = scale.find((entry) => avgTempC <= entry.max) ?? scale[scale.length - 1];
  return { bg: step.bg, text: "#f5f2ee" };
}
