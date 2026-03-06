interface QueryWorkspaceApprovalProps {
    approvalTable: string;
    isAllowing: boolean;
    onApprove: () => void;
}

export function QueryWorkspaceApproval({ approvalTable, isAllowing, onApprove }: QueryWorkspaceApprovalProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#161b22]/50 border border-red-500/10 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.05)] h-full max-w-xl mx-auto my-auto self-center w-full animate-in zoom-in-95 duration-700 backdrop-blur-sm">
            <div className="relative group mb-10">
                <div className="absolute inset-0 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-700"></div>
                <div className="relative w-20 h-20 bg-[#1c2128] rounded-full flex items-center justify-center border border-red-500/20 shadow-2xl">
                    <svg className="w-10 h-10 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
            </div>
            
            <h3 className="font-black text-2xl mb-4 text-slate-100 uppercase tracking-widest text-center">Restricted Access</h3>
            
            <p className="mb-12 text-xs text-center text-slate-500 max-w-sm leading-relaxed font-medium">
                The table <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-mono font-bold mx-1 border border-red-500/10">{approvalTable}</span> is currently outside the active security perimeter. 
                Explicit authorization is required for data retrieval.
            </p>
            
            <div className="flex flex-col gap-4 w-full max-w-[280px]">
                <button 
                    onClick={onApprove} 
                    disabled={isAllowing} 
                    className="group w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-[0.2em] text-[11px] px-8 py-4 rounded-xl shadow-[0_10px_30px_rgba(239,68,68,0.2)] hover:shadow-[0_15px_40px_rgba(239,68,68,0.3)] transition-all duration-300 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                >
                    {isAllowing ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Authorizing</span>
                        </>
                    ) : (
                        <>
                            <span>Authorize & Run</span>
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                        </>
                    )}
                </button>
                <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                    <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest">
                        Audit Logging Active
                    </p>
                </div>
            </div>
        </div>
    );
}
