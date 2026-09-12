import { Fragment } from "react";

// Renders the plain-text formula notation used in the physics module:
//   "T_s"      -> T with subscript s        "r_h,ref" -> r with subscript h,ref
//   "e^(−t/τ)" -> e with superscript −t/τ (the superscript may hold subscripts)
// A comma ends a subscript unless a letter or digit follows it at once, so
// "t_inj, f_inj" keeps the comma outside. Single-letter variables are set in
// italic (DESIGN.md §3.1); function names such as ln, log and min, digits and
// operators stay upright.

const SUBSCRIPT = "_[A-Za-z0-9∞]+(?:,[A-Za-z0-9∞]+)*";
const TOKEN = new RegExp(`(\\^\\([^)]*\\)|\\^[^\\s)·/]+|${SUBSCRIPT}|[A-Za-zα-ωΑ-Ωṁ]+|[^A-Za-zα-ωΑ-Ωṁ_^]+|[_^])`, "g");
const WORD = /^[A-Za-zα-ωΑ-Ωṁ]+$/;
const UPRIGHT_WORDS = new Set(["ln", "log", "min", "max", "exp", "risk", "in", "SG", "PPRL", "SOR"]);

function isItalic(word: string, next: string | undefined): boolean {
  if (UPRIGHT_WORDS.has(word)) return false;
  if (word === "e" && next?.startsWith("^")) return false; // Euler's number
  return word.length === 1;
}

function render(text: string): React.ReactNode[] {
  const tokens = text.match(TOKEN) ?? [];
  return tokens.map((token, i) => {
    if (token.startsWith("^(")) return <sup key={i}>{render(token.slice(2, -1))}</sup>;
    if (token.startsWith("^") && token.length > 1) return <sup key={i}>{render(token.slice(1))}</sup>;
    if (token.startsWith("_") && token.length > 1) return <sub key={i}>{token.slice(1)}</sub>;
    if (WORD.test(token) && isItalic(token, tokens[i + 1])) return <i key={i}>{token}</i>;
    return <Fragment key={i}>{token}</Fragment>;
  });
}

export function MathText({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{render(text)}</span>;
}
