import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { FileText, X, GripVertical, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mergePdfs } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FileWithId {
    id: string;
    file: File;
}

export function PdfMergeTool() {
    const [files, setFiles] = useState<FileWithId[]>([]);
    const [isMerging, setIsMerging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map((file) => ({
            id: Math.random().toString(36).substring(7),
            file,
        }));
        setFiles((prev) => [...prev, ...newFiles]);
        setError(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
    });

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const items = Array.from(files);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFiles(items);
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            setError('최소 2개 이상의 PDF 파일이 필요합니다.');
            return;
        }

        setIsMerging(true);
        setError(null);

        try {
            const fileList = files.map((f) => f.file);
            const blob = await mergePdfs(fileList);

            // Download logic
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `merged_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err: any) {
            console.error(err);
            setError('병합 중 오류가 발생했습니다. 파일을 확인해주세요.');
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        PDF 병합 도구
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        여러 개의 PDF 파일을 하나로 합칩니다. 드래그하여 순서를 변경하세요.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                            isDragActive
                                ? "border-indigo-500 bg-indigo-500/10"
                                : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            <Download className="w-10 h-10 text-slate-500" />
                            <p className="text-slate-300 font-medium">
                                파일을 여기로 드래그하거나 클릭하여 선택하세요
                            </p>
                            <p className="text-sm text-slate-500">
                                PDF 파일만 지원됩니다
                            </p>
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-slate-400 px-1">
                                파일 목록 ({files.length}개)
                            </h3>

                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="files">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-2"
                                        >
                                            {files.map((item, index) => (
                                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="flex items-center justify-between p-3 rounded-md bg-slate-800 border border-slate-700 group"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div {...provided.dragHandleProps} className="cursor-grab text-slate-500 hover:text-slate-300">
                                                                    <GripVertical className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex items-center justify-center w-8 h-8 rounded bg-red-500/10 text-red-400">
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex flex-col overflow-hidden">
                                                                    <span className="text-sm font-medium text-slate-200 truncate">
                                                                        {item.file.name}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">
                                                                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeFile(item.id)}
                                                                className="text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Actions */}
                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleMerge}
                            disabled={files.length < 2 || isMerging}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]"
                        >
                            {isMerging ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    병합 중...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    PDF 병합하기
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
