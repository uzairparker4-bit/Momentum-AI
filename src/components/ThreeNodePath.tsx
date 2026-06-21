'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { completeTask } from '@/actions';
import { useTransition } from 'react';

type Task = {
  id: string;
  title: string;
  status: string;
  order: number;
};

export default function ThreeNodePath({ tasks }: { tasks: Task[] }) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = (taskId: string) => {
    startTransition(() => {
      completeTask(taskId);
    });
  };

  // Only take first 3 tasks
  const displayTasks = tasks.slice(0, 3);
  const activeTaskIndex = displayTasks.findIndex(t => t.status !== 'COMPLETED');

  return (
    <div className="w-full max-w-2xl mx-auto py-16 px-4">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full" />
        
        {/* Active Line Progress */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent/50 rounded-full transition-all duration-1000 ease-in-out"
          style={{ width: `${(Math.max(0, activeTaskIndex) / (displayTasks.length - 1)) * 100}%` }}
        />

        {displayTasks.map((task, index) => {
          const isCompleted = task.status === 'COMPLETED';
          const isActive = index === activeTaskIndex;
          
          return (
            <div key={task.id} className="relative z-10 flex flex-col items-center">
              <button
                onClick={() => !isCompleted && handleComplete(task.id)}
                disabled={isPending || isCompleted || index > activeTaskIndex}
                className={`
                  relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500
                  ${isCompleted ? 'bg-accent/20 text-accent cursor-default' : 
                    isActive ? 'bg-accent text-background shadow-[0_0_20px_var(--color-accent-glow)] scale-110 cursor-pointer hover:scale-125' : 
                    'bg-background border-2 border-white/20 text-white/40 cursor-not-allowed'}
                `}
              >
                {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={16} fill={isActive ? 'currentColor' : 'none'} />}
              </button>
              <div className={`mt-6 text-sm text-center max-w-[120px] transition-colors duration-500
                ${isActive ? 'text-foreground font-medium' : 'text-white/40'}
              `}>
                {task.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
