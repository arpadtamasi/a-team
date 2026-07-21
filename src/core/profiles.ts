export const PROFILE_REQUIREMENTS: Record<string, string[]> = {
  bug: ["Actual behaviour", "Expected behaviour", "Reproduction steps", "Environment", "Frequency", "Impact", "Regression-test expectation"],
  ui: ["User goal", "Entry point", "Default state", "Loading state", "Empty state", "Error state", "Success state", "Disabled state", "Responsive behaviour", "Keyboard and focus behaviour", "Accessibility expectations", "Visual reference"],
  performance: ["Measured baseline", "Target value", "Measurement environment", "Workload and data volume", "Aggregation or percentile", "Permitted variance", "Regression limits", "Before/after verification"],
  workflow: ["Actors", "Initial state", "States", "Transitions", "Triggers", "Permissions", "Error paths", "Cancellation path", "Retry and duplicate-action behaviour", "Audit and notification expectations"],
  metric: ["Decision supported by the metric", "Exact semantic definition", "Numerator and denominator", "Unit of analysis", "Time window", "Segmentation", "Source events or tables", "Exclusions", "Validation cases"],
  refactor: ["Current structural problem", "Demonstrated cost or risk", "Behavioural invariants", "Target structural property", "Excluded redesign", "Behaviour-preserving verification"],
  discovery: ["Decision to be supported", "Research question", "Hypotheses", "Method", "Time or depth limit", "Expected output", "Decision criterion"],
};

export const BRANCH_PREFIXES: Record<string, string> = {
  bug: "fix",
  feature: "feat",
  ui: "feat",
  performance: "perf",
  refactor: "refactor",
  discovery: "spike",
  documentation: "docs",
  workflow: "feat",
  metric: "feat",
};
