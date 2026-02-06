import type { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { Sparkles } from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
    currentView: 'extraction' | 'merge';
    onNavigate: (view: 'extraction' | 'merge') => void;
}

export function DashboardLayout({ children, currentView, onNavigate }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 flex">
            <AppSidebar currentView={currentView} onNavigate={onNavigate} />

            <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-[#334155] bg-[#1e293b]/50 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-40">
                    <h1 className="font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        New Conversion Task
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">v1.0.0</span>
                        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600" />
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 relative">
                    {/* Central Content Container */}
                    <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
