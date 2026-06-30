'use client';

import React from 'react';

interface EditableTextAreaProps {
  value: string;
  isEditMode: boolean;
  onChange: (val: string) => void;
  className?: string;
}

export default function EditableTextArea({
  value,
  isEditMode,
  onChange,
  className = '',
}: EditableTextAreaProps) {
  if (isEditMode) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={`bg-rose-mist/35 border border-sakura/40 focus:border-dream-pink outline-none rounded-2xl p-4 w-full text-dusty-plum focus:ring-1 focus:ring-dream-pink/20 transition-all resize-none text-center font-sans ${className}`}
      />
    );
  }
  return <p className={className}>{value}</p>;
}
