import fs from "node:fs";

const cssPath = new URL("../public/assets/styles/mercury/utilities/utilities.generated.css", import.meta.url);
const configPath = new URL("../public/assets/styles/mercury/utilities/utilities.config.json", import.meta.url);
const css = fs.readFileSync(cssPath, "utf8");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const levels = config.scale;
const breakpoints = Object.entries(config.breakpoints);
const breakpointNames = breakpoints.map(([name]) => name);
const responsiveConfig = config.generation?.responsive;

const responsiveFeature = (name) => {
  const feature = responsiveConfig?.[name];
  if (!feature || typeof feature.enabled !== "boolean") {
    throw new Error(`Responsive utility group "${name}" requires an enabled boolean.`);
  }
  if (typeof feature.reason !== "string" || feature.reason.trim() === "") {
    throw new Error(`Responsive utility group "${name}" requires a non-empty reason.`);
  }
  return feature;
};

const responsiveFeatures = Object.fromEntries(
  ["spacing", "display", "flexDirection", "textAlign", "width", "columns", "grid"].map((name) => [
    name,
    responsiveFeature(name),
  ]),
);

const responsiveAllowlist = (name, minimum, maximum) => {
  const allowlist = responsiveFeatures[name].allowlist;
  if (!allowlist || typeof allowlist !== "object" || Array.isArray(allowlist)) {
    throw new Error(`Responsive utility group "${name}" requires a per-breakpoint allowlist.`);
  }

  const unknownBreakpoints = Object.keys(allowlist).filter((name) => !breakpointNames.includes(name));
  if (unknownBreakpoints.length > 0) {
    throw new Error(`Responsive utility group "${name}" has unknown breakpoints: ${unknownBreakpoints.join(", ")}.`);
  }

  return Object.fromEntries(
    breakpointNames.map((breakpoint) => {
      const values = allowlist[breakpoint];
      if (!Array.isArray(values)) {
        throw new Error(`Responsive utility group "${name}" requires an allowlist for "${breakpoint}".`);
      }
      if (new Set(values).size !== values.length) {
        throw new Error(`Responsive utility group "${name}" contains duplicate values for "${breakpoint}".`);
      }
      for (const value of values) {
        if (!Number.isInteger(value) || value < minimum || value > maximum) {
          throw new Error(
            `Responsive utility group "${name}" value ${value} for "${breakpoint}" must be an integer from ${minimum} to ${maximum}.`,
          );
        }
      }
      return [breakpoint, values];
    }),
  );
};

const responsiveColumnAllowlist = responsiveAllowlist("columns", 1, 12);
const responsiveGridAllowlist = responsiveAllowlist("grid", 2, 4);

const space = (step) => (step === "0" ? "0" : `var(--mc-space-${step})`);
const gutter = (step) => (step === "0" ? "0" : `var(--mc-gutter-${step})`);
const compactDeclarations = (declarations) =>
  declarations
    .trim()
    .replace(/;\s+/g, ";")
    .replace(/:\s+/g, ":")
    .replace(/;$/, "");
const rule = (selector, declarations) => `${selector}{${compactDeclarations(declarations)}}`;

const baseRules = [];
const addScale = (prefix, property, value = space) => {
  for (const step of levels) baseRules.push(rule(`.mc-${prefix}--${step}`, `${property}: ${value(step)};`));
};

addScale("gap", "gap");
addScale("pa", "padding");
addScale("pt", "padding-block-start");
addScale("pr", "padding-inline-end");
addScale("pb", "padding-block-end");
addScale("pl", "padding-inline-start");
addScale("px", "padding-inline");
addScale("py", "padding-block");
addScale("ma", "margin");
addScale("mx", "margin-inline");
addScale("my", "margin-block");
addScale("mt", "margin-block-start");
addScale("mr", "margin-inline-end");
addScale("mb", "margin-block-end");
addScale("ml", "margin-inline-start");

baseRules.push(
  rule(".mc-ma--auto", "margin: auto;"),
  rule(".mc-mx--auto", "margin-inline: auto;"),
  rule(".mc-my--auto", "margin-block: auto;"),
  rule(".mc-mt--auto", "margin-block-start: auto;"),
  rule(".mc-mr--auto", "margin-inline-end: auto;"),
  rule(".mc-mb--auto", "margin-block-end: auto;"),
  rule(".mc-ml--auto", "margin-inline-start: auto;"),
  rule(".mc-mt--n1", "margin-block-start: calc(var(--mc-space-1) * -1);"),
  rule(".mc-mt--n2", "margin-block-start: calc(var(--mc-space-2) * -1);"),
  rule(".mc-mb--n1", "margin-block-end: calc(var(--mc-space-1) * -1);"),
  rule(".mc-mb--n2", "margin-block-end: calc(var(--mc-space-2) * -1);"),
  rule(".mc-grid", "display: grid; gap: var(--mc-gutter, var(--mc-gutter-4));"),
  rule(".mc-grid--2", "grid-template-columns: 1fr;"),
  rule(".mc-grid--3", "grid-template-columns: 1fr;"),
  rule(".mc-grid--4", "grid-template-columns: 1fr;"),
  rule(".mc-grid--cols-2", "grid-template-columns: repeat(2, minmax(0, 1fr));"),
  rule(".mc-row", "display: grid; gap: var(--mc-gutter, var(--mc-gutter-4)); grid-template-columns: repeat(12, minmax(0, 1fr));"),
  rule(".mc-col", "grid-column: span 12;"),
);

for (let i = 1; i <= 12; i += 1) baseRules.push(rule(`.mc-col--${i}`, `grid-column: span ${i};`));
for (const step of levels) baseRules.push(rule(`.mc-g--${step}`, `--mc-gutter: ${gutter(step)};`));
for (const step of levels) baseRules.push(rule(`.mc-z--${step}`, `z-index: ${step};`));

const staticRules = {
  ".mc-d--none": "display: none;",
  ".mc-d--block": "display: block;",
  ".mc-d--inline": "display: inline;",
  ".mc-d--inline-block": "display: inline-block;",
  ".mc-d--inline-flex": "display: inline-flex;",
  ".mc-d--flex": "display: flex;",
  ".mc-d--grid": "display: grid;",
  ".mc-flex--row": "flex-direction: row;",
  ".mc-flex--column": "flex-direction: column;",
  ".mc-flex--wrap": "flex-wrap: wrap;",
  ".mc-flex--nowrap": "flex-wrap: nowrap;",
  ".mc-flex--1": "flex: 1 1 0;",
  ".mc-grow--0": "flex-grow: 0;",
  ".mc-grow--1": "flex-grow: 1;",
  ".mc-shrink--0": "flex-shrink: 0;",
  ".mc-shrink--1": "flex-shrink: 1;",
  ".mc-items--start": "align-items: flex-start;",
  ".mc-items--center": "align-items: center;",
  ".mc-items--end": "align-items: flex-end;",
  ".mc-justify--start": "justify-content: flex-start;",
  ".mc-justify--center": "justify-content: center;",
  ".mc-justify--end": "justify-content: flex-end;",
  ".mc-justify--between": "justify-content: space-between;",
  ".mc-self--start": "align-self: flex-start;",
  ".mc-self--center": "align-self: center;",
  ".mc-self--end": "align-self: flex-end;",
  ".mc-position--relative": "position: relative;",
  ".mc-position--absolute": "position: absolute;",
  ".mc-position--fixed": "position: fixed;",
  ".mc-position--sticky": "position: sticky;",
  ".mc-top--0": "top: 0;",
  ".mc-end--0": "right: 0;",
  ".mc-bottom--0": "bottom: 0;",
  ".mc-start--0": "left: 0;",
  ".mc-inset--0": "inset: 0;",
  ".mc-inset-x--0": "left: 0; right: 0;",
  ".mc-inset-y--0": "bottom: 0; top: 0;",
  ".mc-border": "border: 1px solid var(--mc-color-stroke);",
  ".mc-border--0": "border: 0;",
  ".mc-border--top": "border-block-start: 1px solid var(--mc-color-stroke);",
  ".mc-border--brand": "border: 1px solid rgba(216, 113, 187, 0.45);",
  ".mc-border--error": "border: 1px solid var(--mc-color-error-stroke);",
  ".mc-border--success": "border: 1px solid var(--mc-color-success-stroke);",
  ".mc-border--warning": "border: 1px solid var(--mc-color-warning-stroke);",
  ".mc-border--info": "border: 1px solid var(--mc-color-info-stroke);",
  ".mc-rounded--sm": "border-radius: var(--mc-radius-sm);",
  ".mc-rounded--md": "border-radius: var(--mc-radius-md);",
  ".mc-rounded--lg": "border-radius: var(--mc-radius-lg);",
  ".mc-rounded--xl": "border-radius: var(--mc-radius-xl);",
  ".mc-rounded--pill": "border-radius: var(--mc-radius-pill);",
  ".mc-shadow--none": "box-shadow: none;",
  ".mc-shadow--xs": "box-shadow: var(--mc-shadow-xs);",
  ".mc-shadow--sm": "box-shadow: var(--mc-shadow-soft);",
  ".mc-shadow--md": "box-shadow: var(--mc-shadow-md);",
  ".mc-overflow--auto": "overflow: auto;",
  ".mc-overflow--hidden": "overflow: hidden;",
  ".mc-overflow--visible": "overflow: visible;",
  ".mc-overflow--scroll": "overflow: scroll;",
  ".mc-overflow-x--auto": "overflow-x: auto;",
  ".mc-overflow-y--auto": "overflow-y: auto;",
  ".mc-text--start": "text-align: start;",
  ".mc-text--center": "text-align: center;",
  ".mc-text--end": "text-align: end;",
  ".mc-text--ink": "color: var(--mc-color-ink);",
  ".mc-text--soft-ink": "color: var(--mc-color-soft-ink);",
  ".mc-text--accent": "color: var(--mc-color-accent);",
  ".mc-text--muted": "color: var(--mc-color-muted);",
  ".mc-text--brand": "color: var(--mc-color-pink);",
  ".mc-text--error": "color: var(--mc-color-error);",
  ".mc-text--success": "color: var(--mc-color-success);",
  ".mc-text--warning": "color: var(--mc-color-warning);",
  ".mc-text--info": "color: var(--mc-color-info);",
  ".mc-text--paper": "color: var(--mc-color-paper);",
  ".mc-bg--surface": "background: var(--mc-color-surface); color: var(--mc-color-accent);",
  ".mc-bg--surface-strong": "background: var(--mc-color-surface-strong); color: var(--mc-color-accent);",
  ".mc-bg--paper": "background: var(--mc-color-paper); color: var(--mc-color-ink);",
  ".mc-bg--paper-warm": "background: var(--mc-color-paper-warm); color: var(--mc-color-ink);",
  ".mc-bg--brand": "background: var(--mc-gradient-brand); color: #fff;",
  ".mc-bg--error": "background: var(--mc-color-error-bg); color: var(--mc-color-error);",
  ".mc-bg--success": "background: var(--mc-color-success-bg); color: var(--mc-color-success);",
  ".mc-bg--warning": "background: var(--mc-color-warning-bg); color: var(--mc-color-warning);",
  ".mc-bg--info": "background: var(--mc-color-info-bg); color: var(--mc-color-info);",
  ".mc-text--wrap": "text-wrap: wrap;",
  ".mc-text--nowrap": "white-space: nowrap;",
  ".mc-text--truncate": "overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
  ".mc-text--balance": "text-wrap: balance;",
  ".mc-text--lowercase": "text-transform: lowercase;",
  ".mc-text--uppercase": "text-transform: uppercase;",
  ".mc-text--capitalize": "text-transform: capitalize;",
  ".mc-decoration--none": "text-decoration: none;",
  ".mc-fs--0": "font-size: var(--mc-step-0);",
  ".mc-fs--1": "font-size: var(--mc-step-1);",
  ".mc-fs--2": "font-size: var(--mc-step-2);",
  ".mc-fs--3": "font-size: var(--mc-step-3);",
  ".mc-fs--4": "font-size: var(--mc-step-4);",
  ".mc-fs--5": "font-size: var(--mc-step-5);",
  ".mc-fs--6": "font-size: var(--mc-step-6);",
  ".mc-fs--7": "font-size: var(--mc-step-7);",
  ".mc-fs--display": "font-size: var(--mc-step-display);",
  ".mc-fw--400": "font-weight: 400;",
  ".mc-fw--700": "font-weight: 700;",
  ".mc-lh--solid": "line-height: var(--mc-lh-solid);",
  ".mc-lh--heading": "line-height: var(--mc-lh-heading);",
  ".mc-lh--body": "line-height: var(--mc-lh-body);",
  ".mc-w--auto": "width: auto;",
  ".mc-w--full": "width: 100%;",
  ".mc-w--fit": "width: fit-content;",
  ".mc-w--1\\/4": "width: 25%;",
  ".mc-w--1\\/3": "width: 33.333333%;",
  ".mc-w--1\\/2": "width: 50%;",
  ".mc-w--2\\/3": "width: 66.666667%;",
  ".mc-w--3\\/4": "width: 75%;",
  ".mc-max-w--sm": "max-width: 36rem;",
  ".mc-max-w--md": "max-width: 48rem;",
  ".mc-max-w--lg": "max-width: 66rem;",
  ".mc-max-w--xl": "max-width: 80rem;",
  ".mc-max-w--content": "max-width: var(--mc-content-width);",
  ".mc-max-w--page": "max-width: var(--mc-page-width);",
  ".mc-object--cover": "object-fit: cover;",
  ".mc-object--contain": "object-fit: contain;",
  ".mc-object-position--center": "object-position: center;",
  ".mc-object-position--top": "object-position: center top;",
  ".mc-object-position--right": "object-position: right center;",
  ".mc-object-position--bottom": "object-position: center bottom;",
  ".mc-object-position--left": "object-position: left center;",
  ".mc-list--unstyled": "list-style: none; margin: 0; padding: 0;",
  ".mc-visually-hidden": "clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px;",
};

for (const [selector, declarations] of Object.entries(staticRules)) baseRules.push(rule(selector, declarations));

const responsiveCore = {
  display: [
    ["mc-d--none", "display: none;"],
    ["mc-d--block", "display: block;"],
    ["mc-d--flex", "display: flex;"],
    ["mc-d--grid", "display: grid;"],
  ],
  flexDirection: [
    ["mc-flex--row", "flex-direction: row;"],
    ["mc-flex--column", "flex-direction: column;"],
  ],
  textAlign: [
    ["mc-text--start", "text-align: start;"],
    ["mc-text--center", "text-align: center;"],
    ["mc-text--end", "text-align: end;"],
  ],
  width: [
    ["mc-w--auto", "width: auto;"],
    ["mc-w--full", "width: 100%;"],
    ["mc-w--1\\/2", "width: 50%;"],
    ["mc-w--1\\/3", "width: 33.333333%;"],
    ["mc-w--2\\/3", "width: 66.666667%;"],
    ["mc-w--1\\/4", "width: 25%;"],
    ["mc-w--3\\/4", "width: 75%;"],
  ],
};

const responsiveRules = [];
responsiveRules.push("@media (min-width: 42rem) {");
responsiveRules.push("  .mc-grid--2, .mc-grid--3, .mc-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }");
responsiveRules.push("}");
responsiveRules.push("");
responsiveRules.push("@media (min-width: 66rem) {");
responsiveRules.push("  .mc-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }");
responsiveRules.push("  .mc-grid--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }");
responsiveRules.push("}");

for (const [prefix, width] of breakpoints) {
  const lines = [];
  for (const [featureName, rules] of Object.entries(responsiveCore)) {
    if (!responsiveFeatures[featureName].enabled) continue;
    for (const [name, declarations] of rules) {
      lines.push(`  .${prefix}\\:${name}{${compactDeclarations(declarations)}}`);
    }
  }
  if (responsiveFeatures.columns.enabled) {
    for (const span of responsiveColumnAllowlist[prefix]) {
      lines.push(`  .${prefix}\\:mc-col--${span}{grid-column:span ${span}}`);
    }
  }
  if (responsiveFeatures.grid.enabled) {
    for (const columns of responsiveGridAllowlist[prefix]) {
      lines.push(`  .${prefix}\\:mc-grid--${columns}{grid-template-columns:repeat(${columns},minmax(0,1fr))}`);
    }
  }
  if (responsiveFeatures.spacing.enabled) {
    for (const step of levels) {
      lines.push(`  .${prefix}\\:mc-pa--${step}{padding:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-pt--${step}{padding-block-start:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-pr--${step}{padding-inline-end:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-pb--${step}{padding-block-end:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-pl--${step}{padding-inline-start:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-px--${step}{padding-inline:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-py--${step}{padding-block:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-ma--${step}{margin:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-mt--${step}{margin-block-start:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-mr--${step}{margin-inline-end:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-mb--${step}{margin-block-end:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-ml--${step}{margin-inline-start:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-mx--${step}{margin-inline:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-my--${step}{margin-block:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-gap--${step}{gap:${space(step)}}`);
      lines.push(`  .${prefix}\\:mc-g--${step}{--mc-gutter:${gutter(step)}}`);
    }
  }
  if (lines.length === 0) continue;
  responsiveRules.push("");
  responsiveRules.push(`@media (min-width: ${width}) {`);
  responsiveRules.push(...lines);
  responsiveRules.push("}");
}

const utilityCss = [
  "@layer mercury.utilities {",
  "/* Source-generated utilities. Keep this contract compact, token-backed, and selector-stable. */",
  ...baseRules,
  "",
  ...responsiveRules,
  "}",
  "",
].join("\n");

const nextCss = utilityCss;

const selectors = [...utilityCss.matchAll(/(^|\n)\s*([.#][^{@\n]+?)\s*\{/g)].map((match) => match[2].trim());

if (process.argv.includes("--check")) {
  if (nextCss !== css) {
    console.error("Mercury utilities are out of date. Run this generator with --write.");
    process.exit(1);
  }

  console.log(`Mercury utility selector check passed (${selectors.length} selectors).`);
  process.exit(0);
}

if (process.argv.includes("--write")) {
  if (nextCss === css) {
    console.log("Mercury utilities already up to date.");
  } else {
    fs.writeFileSync(cssPath, nextCss);
    console.log(`Wrote Mercury utilities (${selectors.length} selectors).`);
  }
  process.exit(0);
}

console.log(utilityCss);
