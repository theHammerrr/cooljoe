import type { ParsedSchemaBlock } from './parseSchemaBlock';

interface SchemaBlockCardProps {
    value: ParsedSchemaBlock;
}

export function SchemaBlockCard({ value }: SchemaBlockCardProps) {
    return (
        <div className="overflow-hidden rounded-lg border border-amber-500/20 bg-slate-950/80 shadow-inner">
            <div className="border-b border-amber-500/10 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/85">
                    {value.schema ? `Schema ${value.schema}` : 'Schema Structure'}
                </span>
            </div>
            <div className="space-y-3 px-3 py-3">
                {value.tables.map((table) => (
                    <section key={table.name} className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                        <p className="font-mono text-xs font-bold text-amber-100">{table.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {table.columns.map((column) => (
                                <span
                                    key={`${table.name}-${column}`}
                                    className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-[11px] text-slate-200"
                                >
                                    {column}
                                </span>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
