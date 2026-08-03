/**
 * Environment overrides carry the `KOTTA_` prefix after the rename; the pre-rename `A_TEAM_` name of
 * the same variable is still read, so existing scripts and CI jobs keep working (T-020 / D-006).
 */
export const ENV_PREFIX = "KOTTA_";
export const LEGACY_ENV_PREFIX = "A_TEAM_";

/** Reads `KOTTA_<name>`, falling back to `A_TEAM_<name>`. `name` is the unprefixed suffix. */
export function readEnv(name: string, environment: NodeJS.ProcessEnv = process.env): string | undefined {
  return environment[`${ENV_PREFIX}${name}`] ?? environment[`${LEGACY_ENV_PREFIX}${name}`];
}
