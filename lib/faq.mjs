// The import lost the original <details>/<summary> markup, so FAQ questions arrive as bare
// text nodes followed by an answer <div>, grouped by <h2> inside a single <section>.
const FAQ_SECTION = /<section>([\s\S]*?)<\/section>/i;
const GROUP_HEADING = /<h2>([\s\S]*?)<\/h2>/gi;
const QUESTION_ANSWER = /([^<>]*?\S[^<>]*?)\s*<div>([\s\S]*?)<\/div>/g;

const ENTITIES = { "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };

export function htmlToText(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|nbsp|quot|#39|lt|gt);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const VOID_TAGS = new Set(["area", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "wbr"]);

// Cutting the section out leaves wrapper <div>s open before it and stray closers after it.
// Each fragment is rendered in its own container, so it must be balanced to hydrate cleanly.
export function balanceHtml(html = "") {
  const open = [];
  const balanced = html.replace(/<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi, (tag, closing, rawName, selfClosing) => {
    const name = rawName.toLowerCase();
    if (VOID_TAGS.has(name) || selfClosing) return tag;
    if (!closing) {
      open.push(name);
      return tag;
    }
    const index = open.lastIndexOf(name);
    if (index < 0) return "";
    const unclosed = open.splice(index).slice(1).reverse().map((inner) => `</${inner}>`).join("");
    return `${unclosed}${tag}`;
  });
  return balanced + open.reverse().map((name) => `</${name}>`).join("");
}

function parseGroup(title, body) {
  const items = [...body.matchAll(QUESTION_ANSWER)].map((match) => {
    const question = htmlToText(match[1]);
    return { id: slugify(question), question, answerHtml: match[2].trim() };
  });
  return { id: slugify(htmlToText(title)), title: htmlToText(title), items };
}

export function extractFaq(html = "") {
  const section = html.match(FAQ_SECTION);
  if (!section) return null;
  const headings = [...section[1].matchAll(GROUP_HEADING)];
  if (!headings.length) return null;

  const groups = headings.map((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? section[1].length;
    return parseGroup(heading[1], section[1].slice(start, end));
  }).filter((group) => group.items.length);
  if (groups.reduce((sum, group) => sum + group.items.length, 0) < 3) return null;

  return {
    beforeHtml: balanceHtml(html.slice(0, section.index)),
    afterHtml: balanceHtml(html.slice(section.index + section[0].length)),
    groups,
  };
}

export function buildFaqMainEntity(groups) {
  return groups.flatMap((group) => group.items).map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: htmlToText(item.answerHtml) },
  }));
}
