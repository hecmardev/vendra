/** Piezas de texto de los avisos legales. */

export function H1 ({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
}

export function H2 ({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-6 text-xl font-bold tracking-tight">{children}</h2>
}

export function P ({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed text-muted-foreground [&_strong]:text-foreground">{children}</p>
}

export function UL ({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-6 leading-relaxed text-muted-foreground [&_strong]:text-foreground">{children}</ul>
}

export function OL ({ children, start }: { children: React.ReactNode; start?: number }) {
  return <ol start={start} className="list-decimal space-y-1.5 pl-6 leading-relaxed text-muted-foreground">{children}</ol>
}

export function Table ({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-secondary/50 text-left">
          <tr>{headers.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} className="px-3 py-2 align-top text-muted-foreground">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
