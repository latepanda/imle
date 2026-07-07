import fs from "node:fs";

const cssPath = new URL("../public/assets/styles/design.css", import.meta.url);
const css = fs.readFileSync(cssPath, "utf8");

const levels = ["0", "1", "2", "3", "4", "5", "6", "7"];
const marginExtra = ["auto"];
const breakpoints = ["sm", "md", "lg", "xl"];

const utilitySelectors = [
  ...levels.map((step) => `.mc-gap--${step}`),
  ...levels.map((step) => `.mc-p--${step}`),
  ...levels.flatMap((step) => [
    `.mc-pt--${step}`,
    `.mc-pr--${step}`,
    `.mc-pb--${step}`,
    `.mc-pl--${step}`,
    `.mc-px--${step}`,
    `.mc-py--${step}`,
  ]),
  ...[...levels, ...marginExtra].map((step) => `.mc-m--${step}`),
  ...[...levels, ...marginExtra].flatMap((step) => [
    `.mc-mx--${step}`,
    `.mc-my--${step}`,
    `.mc-mt--${step}`,
    `.mc-mr--${step}`,
    `.mc-mb--${step}`,
    `.mc-ml--${step}`,
  ]),
  ...["none", "block", "inline", "inline-block", "inline-flex", "flex", "grid"].map((value) => `.mc-d--${value}`),
  ...["row", "column", "wrap", "nowrap", "1"].map((value) => `.mc-flex--${value}`),
  ...["start", "center", "end"].flatMap((value) => [`.mc-items--${value}`, `.mc-self--${value}`]),
  ...["start", "center", "end", "between"].map((value) => `.mc-justify--${value}`),
  ...["relative", "absolute", "fixed", "sticky"].map((value) => `.mc-position--${value}`),
  ...["0", "1", "2", "3"].map((value) => `.mc-z--${value}`),
  ...["sm", "md", "lg", "xl", "pill"].map((value) => `.mc-rounded--${value}`),
  ...["none", "xs", "sm", "md"].map((value) => `.mc-shadow--${value}`),
  ...["auto", "hidden", "visible", "scroll"].map((value) => `.mc-overflow--${value}`),
  ...["start", "center", "end", "ink", "soft-ink", "accent", "muted", "brand", "error", "success", "warning", "info", "wrap", "nowrap", "truncate", "balance", "lowercase", "uppercase", "capitalize"].map((value) => `.mc-text--${value}`),
  ...["surface", "surface-strong", "paper", "brand", "error", "success", "warning", "info"].map((value) => `.mc-bg--${value}`),
  ...levels.map((value) => `.mc-fs--${value}`),
  ".mc-fs--display",
  ...levels.map((value) => `.mc-g--${value}`),
  ...["400", "700"].map((value) => `.mc-fw--${value}`),
  ...["solid", "heading", "body"].map((value) => `.mc-lh--${value}`),
  ...["auto", "full", "fit", "1\\/4", "1\\/3", "1\\/2", "2\\/3", "3\\/4"].map((value) => `.mc-w--${value}`),
  ...["sm", "md", "lg", "xl", "content", "page"].map((value) => `.mc-max-w--${value}`),
  ".mc-object--cover",
  ".mc-object--contain",
  ".mc-list--unstyled",
];

const responsiveSelectors = breakpoints.flatMap((breakpoint) => [
  `.${breakpoint}\\:mc-d--none`,
  `.${breakpoint}\\:mc-d--block`,
  `.${breakpoint}\\:mc-d--flex`,
  `.${breakpoint}\\:mc-d--grid`,
  `.${breakpoint}\\:mc-text--start`,
  `.${breakpoint}\\:mc-text--center`,
  `.${breakpoint}\\:mc-text--end`,
  `.${breakpoint}\\:mc-grid--2`,
  ...levels.map((step) => `.${breakpoint}\\:mc-gap--${step}`),
  ...levels.map((step) => `.${breakpoint}\\:mc-g--${step}`),
  ...levels.map((step) => `.${breakpoint}\\:mc-p--${step}`),
  ...levels.flatMap((step) => [
    `.${breakpoint}\\:mc-pt--${step}`,
    `.${breakpoint}\\:mc-pr--${step}`,
    `.${breakpoint}\\:mc-pb--${step}`,
    `.${breakpoint}\\:mc-pl--${step}`,
    `.${breakpoint}\\:mc-px--${step}`,
    `.${breakpoint}\\:mc-py--${step}`,
  ]),
  ...levels.map((step) => `.${breakpoint}\\:mc-m--${step}`),
  ...levels.flatMap((step) => [
    `.${breakpoint}\\:mc-mx--${step}`,
    `.${breakpoint}\\:mc-my--${step}`,
    `.${breakpoint}\\:mc-mt--${step}`,
    `.${breakpoint}\\:mc-mr--${step}`,
    `.${breakpoint}\\:mc-mb--${step}`,
    `.${breakpoint}\\:mc-ml--${step}`,
  ]),
]);

const expectedSelectors = [...new Set([...utilitySelectors, ...responsiveSelectors])];
const missing = expectedSelectors.filter((selector) => !css.includes(selector));

if (process.argv.includes("--check")) {
  if (missing.length) {
    console.error(`Missing Mercury utility selectors:\n${missing.join("\n")}`);
    process.exit(1);
  }

  console.log(`Mercury utility selector check passed (${expectedSelectors.length} selectors).`);
  process.exit(0);
}

console.log(expectedSelectors.join("\n"));
