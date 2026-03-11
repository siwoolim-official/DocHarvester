import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Link, FileText, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useConversionStore } from '../store/useConversionStore';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// import { cn } from '../lib/utils';
import { Card } from './ui/card';

const formSchema = z.object({
    urls: z.string().min(1, 'URL을 입력해주세요.'),
    type: z.enum(['PDF', 'HTML_NO_CSS', 'HTML_WITH_CSS']),
    scale: z.number().min(0.1).max(2.0),
});

export function StartConversion() {
    const { taskId, setTask, status } = useConversionStore();
    const isProcessing = taskId && (status === 'PENDING' || status === 'PROCESSING');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            urls: '',
            type: 'PDF',
            scale: 1.0,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const urlList = values.urls.split('\n').map((url) => url.trim()).filter(Boolean);
            if (urlList.length === 0) return;

            const response = await api.post('/api/extract', {
                urls: urlList,
                type: values.type,
                scale: values.scale,
            });

            if (response.data.taskId) {
                setTask(response.data.taskId);
            }
        } catch (error) {
            console.error('Extraction request failed', error);
            alert('작업 요청 실패: 서버 상태를 확인해주세요.');
        }
    }

    if (isProcessing) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <Card className="dashboard-card p-6 border-slate-700 bg-slate-800/50">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Link className="w-4 h-4 text-indigo-400" />
                            웹사이트 URL 목록
                        </label>
                        <Textarea
                            placeholder="변환할 웹사이트 링크를 여기에 붙여넣으세요 (줄바꿈으로 구분)"
                            className="dashboard-input min-h-[120px] resize-none text-base"
                            {...form.register('urls')}
                        />
                        {form.formState.errors.urls && (
                            <p className="text-xs text-red-400">{form.formState.errors.urls.message}</p>
                        )}
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                포맷 선택
                            </label>
                            <Select onValueChange={(val) => form.setValue('type', val as any)} defaultValue={form.getValues('type')}>
                                <SelectTrigger className="dashboard-input w-full">
                                    <SelectValue placeholder="형식 선택" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectItem value="PDF">PDF 문서 (.pdf)</SelectItem>
                                    <SelectItem value="HTML_NO_CSS">HTML 텍스트 (.html)</SelectItem>
                                    <SelectItem value="HTML_WITH_CSS">HTML 전체 (.zip)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                화면 비율 (Zoom)
                            </label>
                            <Select onValueChange={(val) => form.setValue('scale', parseFloat(val))} defaultValue={form.getValues('scale').toString()}>
                                <SelectTrigger className="dashboard-input w-full">
                                    <SelectValue placeholder="비율 선택" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectItem value="1">100% (기본)</SelectItem>
                                    <SelectItem value="0.95">95%</SelectItem>
                                    <SelectItem value="0.9">90%</SelectItem>
                                    <SelectItem value="0.85">85%</SelectItem>
                                    <SelectItem value="0.8">80%</SelectItem>
                                    <SelectItem value="0.75">75%</SelectItem>
                                    <SelectItem value="0.7">70%</SelectItem>
                                    <SelectItem value="0.65">65%</SelectItem>
                                    <SelectItem value="0.6">60%</SelectItem>
                                    <SelectItem value="0.55">55%</SelectItem>
                                    <SelectItem value="0.5">50%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10 px-6 rounded-lg transition-colors"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    변환 시작 <ArrowRight className="w-4 h-4" />
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
}
