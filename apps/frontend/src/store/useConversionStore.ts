import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Status = 'IDLE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface ConversionState {
    taskId: string | null;
    status: Status;
    progress: number;
    downloadUrl?: string; // Optional: 백엔드에서 바로 URL을 주지 않을 수도 있으므로

    setTask: (taskId: string) => void;
    updateGlobalStatus: (status: Status, progress: number) => void;
    reset: () => void;
}

export const useConversionStore = create<ConversionState>()(
    persist(
        (set) => ({
            taskId: null,
            status: 'IDLE',
            progress: 0,

            setTask: (taskId) => set({ taskId, status: 'PENDING', progress: 0 }),

            updateGlobalStatus: (status, progress) => set({ status, progress }),

            reset: () => set({ taskId: null, status: 'IDLE', progress: 0, downloadUrl: undefined }),
        }),
        {
            name: 'conversion-storage', // local storage key
        }
    )
);
