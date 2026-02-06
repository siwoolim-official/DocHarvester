import { useState } from 'react';
import { StartConversion } from './components/StartConversion';
import { ConversionStatus } from './components/ConversionStatus';
import { DownloadResult } from './components/DownloadResult';
import { PdfMergeTool } from './components/tools/PdfMergeTool';
import { DashboardLayout } from './components/layout/DashboardLayout';

function App() {
  const [currentView, setCurrentView] = useState<'extraction' | 'merge'>('extraction');

  return (
    <DashboardLayout currentView={currentView} onNavigate={setCurrentView}>
      <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            {currentView === 'extraction' ? 'Web Content Extraction' : 'PDF Merge Tool'}
          </h1>
          <p className="text-slate-400 mt-2">
            {currentView === 'extraction'
              ? 'URL을 입력하여 웹 페이지를 PDF 또는 HTML로 변환하세요.'
              : '여러 PDF 파일을 하나로 병합합니다.'}
          </p>
        </header>

        {currentView === 'extraction' && (
          <div className="grid gap-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-200">입력 소스</h2>
              </div>
              <StartConversion />
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-200">작업 상태</h2>
              </div>
              <ConversionStatus />
              <DownloadResult />
            </section>
          </div>
        )}

        {currentView === 'merge' && (
          <div className="grid gap-6">
            <PdfMergeTool />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default App;
