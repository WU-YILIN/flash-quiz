export function extractJsonBlock(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const balanced = extractBalancedJson(fenced[1].trim());
    return balanced ?? fenced[1].trim();
  }

  const balanced = extractBalancedJson(raw);
  if (balanced) {
    return balanced;
  }

  return raw.trim();
}

function extractBalancedJson(raw: string): string | null {
  const startCandidates = [raw.indexOf("["), raw.indexOf("{")].filter(
    (index) => index >= 0
  );
  if (startCandidates.length === 0) {
    return null;
  }

  const start = Math.min(...startCandidates);
  const opening = raw[start];
  const closing = opening === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }
      if (char === "\\") {
        escaping = true;
        continue;
      }
      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === opening) {
      depth += 1;
      continue;
    }

    if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, index + 1).trim();
      }
    }
  }

  return null;
}
