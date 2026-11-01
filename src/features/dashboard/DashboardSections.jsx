import React from 'react';
import { Loader2 } from 'lucide-react';
import Dialog from '../../components/ui/Dialog';

export function DeleteCourseDialog({ course, isDeleting, onCancel, onConfirm }) {
  return (
    <Dialog 
      isOpen={Boolean(course)} 
      onClose={onCancel} 
      titleId="delete-course-title" 
      closeOnBackdrop={!isDeleting} 
      closeOnEscape={!isDeleting} 
      className="w-full max-w-md rounded-[24px] border border-[#e5e5e5] dark:border-zinc-800 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-2xl"
    >
      <h2 id="delete-course-title" className="text-[18px] sm:text-[20px] font-semibold tracking-[-0.02em] text-[#111111] dark:text-white">
        Delete this local course?
      </h2>
      <p className="mt-2.5 break-words text-[13.5px] sm:text-[14px] text-[#666666] dark:text-zinc-400 leading-[1.6]">
        Deleting <strong className="font-semibold text-[#111111] dark:text-white">{course?.title}</strong> permanently removes its local course, lessons, video progress, and timestamped notes from this device.
      </p>
      <p className="mt-2 text-[12px] text-[#8d8d8d] dark:text-zinc-500 leading-relaxed">
        This does not affect the original YouTube playlist. The action cannot be undone.
      </p>
      <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={isDeleting} 
          className="w-full sm:w-auto h-9 sm:h-10 rounded-full border border-[#e5e5e5] dark:border-zinc-800 bg-[#f4f4f4] dark:bg-zinc-900 hover:bg-[#eaeaea] dark:hover:bg-zinc-800 px-4 sm:px-5 text-[12.5px] sm:text-[13px] font-medium text-[#111111] dark:text-white transition cursor-pointer"
        >
          Keep Course
        </button>
        <button 
          type="button" 
          onClick={onConfirm} 
          disabled={isDeleting} 
          className="w-full sm:w-auto flex h-9 sm:h-10 items-center justify-center gap-2 rounded-full bg-[#e11d48] hover:bg-[#be123c] px-4 sm:px-5 text-[12.5px] sm:text-[13px] font-medium text-white transition cursor-pointer disabled:opacity-60"
        >
          {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
          <span>{isDeleting ? 'Deleting...' : 'Delete Local Course'}</span>
        </button>
      </div>
    </Dialog>
  );
}
