import { api } from '../lib/api';
import { Download, RefreshCw, FileCheck } from 'lucide-react';
import { useConversionStore } from '../store/useConversionStore';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion } from 'framer-motion';

export function DownloadResult() {
    const { taskId, status, reset } = useConversionStore();

    if (status !== 'COMPLETED') return null;

    const handleDownload = async () => {
        if (!taskId) return;
        try {
            const response = await api.get(`/api/extract/download/${taskId}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'conversion_result.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
            alert("다운로드 실패");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="dashboard-card p-6 border-green-900/50 bg-green-950/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center border border-green-800">
                            <FileCheck className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-400">변환 완료!</h3>
                            <p className="text-sm text-green-600/80">모든 문서가 성공적으로 처리되었습니다.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <Button
                            onClick={handleDownload}
                            className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white border-0"
                        >
                            <Download className="w-4 h-4 mr-2" /> 결과 다운로드
                        </Button>
                        <Button
                            variant="outline"
                            onClick={reset}
                            className="flex-1 md:flex-none border-slate-700 bg-transparent text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" /> 초기화
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
