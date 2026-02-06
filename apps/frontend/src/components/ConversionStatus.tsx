import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConversionStore } from '../store/useConversionStore';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function ConversionStatus() {
    const { taskId, status, updateGlobalStatus } = useConversionStore();

    const { data, isError, error } = useQuery({
        queryKey: ['conversionStatus', taskId],
        queryFn: async () => {
            const res = await api.get(`/api/extract/status/${taskId}`);
            return res.data;
        },
        enabled: !!taskId && status !== 'COMPLETED' && status !== 'FAILED',
        refetchInterval: (query) => {
            if (query.state.data?.status === 'COMPLETED' || query.state.data?.status === 'FAILED') {
                return false;
            }
            return 3000;
        },
    });

    useEffect(() => {
        if (data) {
            updateGlobalStatus(data.status, data.progress);
        } else if (isError) {
            console.error("Polling error", error);
        }
    }, [data, isError, updateGlobalStatus, error]);

    if (!taskId || status === 'COMPLETED') return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <Card className="dashboard-card p-6 border-l-4 border-l-indigo-500 bg-[#0f172a] border-y-slate-800 border-r-slate-800">
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        {status === 'PROCESSING' || status === 'PENDING' ? (
                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        ) : status === 'FAILED' ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="font-semibold text-slate-200">
                                {status === 'PENDING' && "작업 큐 대기 중..."}
                                {status === 'PROCESSING' && "문서 변환 작업 진행 중..."}
                                {status === 'FAILED' && "작업 처리 실패"}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                                {status === 'PROCESSING' ? "잠시만 기다려주세요. 페이지를 분석하고 있습니다." : "상태를 확인하는 중입니다."}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Progress</span>
                                <span>{data?.progress || 0}%</span>
                            </div>
                            <Progress value={data?.progress || 0} className="h-2 bg-slate-800" indicatorClassName="bg-indigo-500" />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
