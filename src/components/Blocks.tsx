import type { Block } from "../types";

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        if (b.type === "p") return <p key={i}>{b.text}</p>;
        if (b.type === "h") return <h3 key={i}>{b.text}</h3>;
        if (b.type === "ul")
          return (
            <ul key={i}>
              {b.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          );
        if (b.type === "sql")
          return (
            <pre className="sql" key={i}>
              <code>{b.code}</code>
            </pre>
          );
        return (
          <div className="callout" key={i}>
            <strong>{b.title}</strong>
            {b.text}
          </div>
        );
      })}
    </div>
  );
}
