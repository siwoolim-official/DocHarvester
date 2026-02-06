import { motion } from 'framer-motion';
import { LayoutDashboard, History, Settings, PlusCircle, FileText } from 'lucide-react';
import { Button } from '../ui/button';

export function AppSidebar() {
    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 h-screen bg-[#1e293b] border-r border-[#334155] flex flex-col p-4 fixed left-0 top-0 z-50 hidden md:flex"
        >
            <div className="flex items-center gap-2 px-2 py-4 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <FileText className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">DocHarvester</span>
            </div>

            <nav className="space-y-2 flex-1">
                <Button variant="secondary" className="w-full justify-start gap-3 bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                    <PlusCircle className="w-4 h-4" /> 새 변환 작업
                </Button>

                <div className="pt-4">
                    <p className="px-2 text-xs font-semibold text-slate-500 uppercase mb-2">Menu</p>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800">
                        <LayoutDashboard className="w-4 h-4" /> 대시보드
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800">
                        <History className="w-4 h-4" /> 최근 기록
                    </Button>
                </div>
            </nav>

            <div className="pt-4 border-t border-slate-700">
                <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800">
                    <Settings className="w-4 h-4" /> 설정
                </Button>
            </div>
        </motion.aside>
    );
}
