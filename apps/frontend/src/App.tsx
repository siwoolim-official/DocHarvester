import { motion } from 'framer-motion';
import { StartConversion } from './components/StartConversion';
import { ConversionStatus } from './components/ConversionStatus';
import { DownloadResult } from './components/DownloadResult';


import { DashboardLayout } from './components/layout/DashboardLayout';

function App() {
  return (
    <DashboardLayout>
      {/* Top/Bottom Split View Concept */}
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
    </DashboardLayout>
  );
}

export default App;
