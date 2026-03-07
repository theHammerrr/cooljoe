import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

interface QueryWorkspaceEditorProps {
    value: string;
    onValueChange: (value: string) => void;
    activeTab: 'sql' | 'prisma';
    height: number;
}

export function QueryWorkspaceEditor({ value, onValueChange, activeTab, height }: QueryWorkspaceEditorProps) {
    return (
        <div className="min-h-[200px] overflow-y-auto border-b border-white/5 bg-[#0d1117] group relative" style={{ height }}>
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <span className="text-[10px] font-bold text-slate-600 bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/5 uppercase tracking-widest">
                    {activeTab === 'sql' ? 'PostgreSQL' : 'Prisma Client'}
                </span>
            </div>
            
            <Editor 
                value={value} 
                onValueChange={onValueChange} 
                highlight={(code) => Prism.highlight(code, activeTab === 'sql' ? Prism.languages.sql : Prism.languages.javascript, activeTab)} 
                padding={28}
                style={{ 
                    fontFamily: '"Fira Code", "JetBrains Mono", monospace', 
                    fontSize: 13, 
                    minHeight: '100%', 
                    color: '#e6edf3',
                    lineHeight: '1.7',
                    backgroundColor: 'transparent'
                }}
                textareaClassName="focus:outline-none caret-emerald-400" 
            />
        </div>
    );
}
