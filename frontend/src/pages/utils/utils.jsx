export function parseInsightsToCards(insightsText) {
  if (!insightsText) return [];

  let cleaned =
    typeof insightsText === "string" ? insightsText.trim() : JSON.stringify(insightsText);
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\s*/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/```$/, "");

  let insightsObj = {};
  try {
    insightsObj =
      typeof cleaned === "string" ? JSON.parse(cleaned) : insightsText;
  } catch (err) {
    console.error("Error parsing insights JSON:", err, cleaned);
    return [];
  }

  const cards = [];

  function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "object" && value !== null && Object.keys(value).length === 0)
      return true;
    return false;
  }

  function formatContent(key, content, depth = 0) {
    if (isEmpty(content)) return [];

    const blocks = [];

    // next_steps especial
    if (key === "next_steps" && Array.isArray(content)) {
      return content.map((step) => ({
        type: "list-item",
        text: `Priority ${step.priority}: ${step.action} — ${step.description || step.reason || ""}`,
        depth,
      }));
    }

    // strings e números simples
    if (typeof content === "string" || typeof content === "number") {
      return [{ type: "paragraph", text: { key, value: content }, depth }];
    }

    // arrays
    if (Array.isArray(content)) {
      content.forEach((item) => {
        if (typeof item === "string" || typeof item === "number") {
          blocks.push({ type: "list-item", text: item.toString(), depth });
        } else if (typeof item === "object" && item !== null) {
          // quebra de bloco + aumento de profundidade
          blocks.push({ type: "paragraph", text: { key: "", value: "" }, depth });
          blocks.push(...formatContent("", item, depth + 1));
        }
      });
      return blocks;
    }

    // objetos
    if (typeof content === "object" && content !== null) {
      Object.entries(content).forEach(([childKey, value]) => {
        if (isEmpty(value)) return;

        if (typeof value === "string" || typeof value === "number") {
          blocks.push({
            type: "paragraph",
            text: { key: childKey, value },
            depth,
          });
        } else {
          // subtítulo e quebra de bloco
          blocks.push({ type: "subtitle", text: childKey, depth });
          blocks.push({ type: "paragraph", text: { key: "", value: "" }, depth }); // espaço
          blocks.push(...formatContent(childKey, value, depth + 1));
        }
      });
      return blocks;
    }

    return [];
  }

  Object.entries(insightsObj).forEach(([section, content]) => {
    if (section === "analysis_title") return;
    if (isEmpty(content)) return;

    const title = section
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const blocks = formatContent(section, content);

    if (blocks.length > 0) {
      cards.push({ title, blocks });
    }
  });

  return cards;
}


export function InsightTextCard({ title, blocks, theme }) {
  const cardBg =
    theme === "dark"
      ? "from-[#2C2F48] to-[#3C3F62]"
      : "from-white to-gray-100";

  const borderColor = theme === "dark" ? "border-white/10" : "border-gray-200";

  return (
    <div
      className={`
        col-span-1
        bg-gradient-to-br ${cardBg}
        rounded-2xl p-6 border ${borderColor}
        shadow-md hover:shadow-xl
        transform hover:-translate-y-1 transition-all duration-300 ease-out
      `}
    >
      <h2
        className="
          text-2xl font-extrabold tracking-wide mb-4
          bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500
          bg-clip-text text-transparent
        "
      >
        {title}
      </h2>

      <div className="space-y-3">
        {blocks.map((block, idx) => {
          const marginLeft = `${block.depth * 1.5}rem`; // indentação baseada na hierarquia

          if (block.type === "subtitle") {
            return (
              <h3
                key={idx}
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-gray-100" : "text-gray-800"
                } mt-3`}
                style={{ marginLeft }}
              >
                {block.text}
              </h3>
            );
          }

          if (block.type === "paragraph") {
            const { key, value } = block.text || { key: "", value: "" };
            return (
              <p
                key={idx}
                className={`text-base leading-relaxed ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
                style={{ marginLeft }}
              >
                {key && (
                  <span className="font-bold">{key}: </span>
                )}
                {value}
              </p>
            );
          }

          if (block.type === "list-item") {
            return (
              <ul
                key={idx}
                className={`list-disc pl-5 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
                style={{ marginLeft }}
              >
                <li>{block.text}</li>
              </ul>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
