/**
 * SIE4 Parser
 *
 * Parses the SIE4 (Standard Import Export) format used by Swedish
 * accounting software (Fortnox, Visma, Bjorn Lunden, etc.)
 *
 * Format reference: https://sie.se/format/
 *
 * Key rules:
 * - Line-based, each line starts with #TAG
 * - Strings are double-quoted
 * - Numbers use period as decimal separator
 * - #VER blocks are delimited by { }
 * - In #TRANS, positive amount = debit, negative = credit
 * - Encoding is typically CP437 (#FORMAT PC8) or ISO-8859-1
 */

import type {
  SIEFile,
  SIEAccount,
  SIEBalance,
  SIEEntry,
  SIETransaction,
} from "./types";

/**
 * Parse a SIE4 file from string content.
 * Assumes content is already decoded to UTF-8 (handle encoding before calling).
 */
export function parseSIE(content: string): SIEFile {
  const result: SIEFile = {
    fiscalYears: new Map(),
    accounts: [],
    openingBalances: [],
    closingBalances: [],
    results: [],
    entries: [],
    warnings: [],
  };

  const lines = content.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    i++;

    if (!line || !line.startsWith("#")) continue;

    const tag = extractTag(line);
    const rest = line.slice(tag.length).trim();

    switch (tag) {
      case "#FLAGGA":
        // Always 0, ignored
        break;

      case "#PROGRAM":
        {
          const parts = parseTokens(rest);
          result.program = parts[0];
          result.programVersion = parts[1];
        }
        break;

      case "#FORMAT":
        result.format = rest.trim();
        break;

      case "#GEN":
        {
          const parts = parseTokens(rest);
          result.generatedDate = formatSIEDate(parts[0]);
        }
        break;

      case "#SIETYP":
        result.sieType = parseInt(rest.trim());
        break;

      case "#PROSA":
        result.comment = unquote(rest.trim());
        break;

      case "#FNAMN":
        result.companyName = unquote(rest.trim());
        break;

      case "#ORGNR":
        result.orgNumber = unquote(rest.trim()) || rest.trim();
        break;

      case "#RAR":
        {
          const parts = parseTokens(rest);
          if (parts.length >= 3) {
            const offset = parseInt(parts[0]);
            result.fiscalYears.set(offset, {
              start: formatSIEDate(parts[1]),
              end: formatSIEDate(parts[2]),
            });
          }
        }
        break;

      case "#KONTO":
        {
          const parts = parseTokens(rest);
          if (parts.length >= 2) {
            result.accounts.push({
              number: parts[0],
              name: parts[1],
            });
          }
        }
        break;

      case "#KTYP":
        {
          const parts = parseTokens(rest);
          if (parts.length >= 2) {
            const account = result.accounts.find(
              (a) => a.number === parts[0]
            );
            if (account) account.type = parts[1];
          }
        }
        break;

      case "#SRU":
        {
          const parts = parseTokens(rest);
          if (parts.length >= 2) {
            const account = result.accounts.find(
              (a) => a.number === parts[0]
            );
            if (account) account.sruCode = parts[1];
          }
        }
        break;

      case "#IB":
        {
          const parts = parseTokens(rest);
          if (parts.length >= 3) {
            result.openingBalances.push({
              fiscalYearOffset: parseInt(parts[0]),
              accountNumber: parts[1],
              amount: parseFloat(parts[2]),
            });
          }
        }
        break;

      case "#UB":
        {
          const parts = parseTokens(rest);
          if (parts.length >= 3) {
            result.closingBalances.push({
              fiscalYearOffset: parseInt(parts[0]),
              accountNumber: parts[1],
              amount: parseFloat(parts[2]),
            });
          }
        }
        break;

      case "#RES":
        {
          const parts = parseTokens(rest);
          if (parts.length >= 3) {
            result.results.push({
              fiscalYearOffset: parseInt(parts[0]),
              accountNumber: parts[1],
              amount: parseFloat(parts[2]),
            });
          }
        }
        break;

      case "#VER":
        {
          const parts = parseTokens(rest);
          const entry: SIEEntry = {
            series: parts[0] || "A",
            number: parseInt(parts[1]) || 0,
            date: formatSIEDate(parts[2] || ""),
            description: parts[3] || "",
            transactions: [],
          };

          // Find the opening { — it may be on this line or the next
          let blockContent = rest;
          while (i < lines.length && !blockContent.includes("{")) {
            blockContent = lines[i].trim();
            i++;
          }

          // Parse TRANS lines until closing }
          while (i < lines.length) {
            const transLine = lines[i].trim();
            i++;

            if (transLine === "}" || transLine.startsWith("}")) break;

            if (transLine.startsWith("#TRANS")) {
              const transParts = parseTokens(
                transLine.slice("#TRANS".length).trim()
              );
              if (transParts.length >= 3) {
                // transParts: accountNumber, {dimensions}, amount, [date], [description]
                // The {} dimensions field is parsed as empty tokens
                const accountNumber = transParts[0];
                // Find the amount — skip the {} dimension tokens
                let amountIdx = 1;
                // Skip empty dimension pairs
                if (transParts[1] === "" || transParts[1] === "{}") {
                  amountIdx = 2;
                }
                // Search for a numeric value
                while (
                  amountIdx < transParts.length &&
                  isNaN(parseFloat(transParts[amountIdx]))
                ) {
                  amountIdx++;
                }

                const amount = parseFloat(transParts[amountIdx]) || 0;
                const transDate = transParts[amountIdx + 1];
                const transDesc = transParts[amountIdx + 2];

                entry.transactions.push({
                  accountNumber,
                  amount,
                  date: transDate ? formatSIEDate(transDate) : undefined,
                  description: transDesc || undefined,
                });
              }
            }
          }

          if (entry.transactions.length > 0) {
            result.entries.push(entry);
          } else {
            result.warnings.push(
              `VER ${entry.series}${entry.number} (${entry.date}): Inga transaktionsrader`
            );
          }
        }
        break;

      default:
        // Unknown tags are silently ignored
        break;
    }
  }

  return result;
}

/**
 * Extract the #TAG from a line
 */
function extractTag(line: string): string {
  const match = line.match(/^(#\w+)/);
  return match ? match[1] : "";
}

/**
 * Parse a SIE line into tokens, handling quoted strings and {} blocks
 */
function parseTokens(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const s = input.trim();

  while (i < s.length) {
    // Skip whitespace
    while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
    if (i >= s.length) break;

    if (s[i] === '"') {
      // Quoted string
      i++; // skip opening quote
      let token = "";
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && i + 1 < s.length) {
          token += s[i + 1];
          i += 2;
        } else {
          token += s[i];
          i++;
        }
      }
      i++; // skip closing quote
      tokens.push(token);
    } else if (s[i] === "{") {
      // Dimension block — collect until }
      i++; // skip {
      let depth = 1;
      let token = "";
      while (i < s.length && depth > 0) {
        if (s[i] === "{") depth++;
        if (s[i] === "}") depth--;
        if (depth > 0) token += s[i];
        i++;
      }
      tokens.push(token.trim() || "");
    } else {
      // Unquoted token
      let token = "";
      while (i < s.length && s[i] !== " " && s[i] !== "\t") {
        token += s[i];
        i++;
      }
      tokens.push(token);
    }
  }

  return tokens;
}

/**
 * Remove surrounding quotes from a string
 */
function unquote(s: string): string {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Convert SIE date format (YYYYMMDD) to ISO date (YYYY-MM-DD)
 */
function formatSIEDate(sieDate: string): string {
  const d = sieDate.replace(/"/g, "").trim();
  if (d.length === 8 && /^\d{8}$/.test(d)) {
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }
  return d;
}
