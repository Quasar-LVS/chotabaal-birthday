'use client';

import React from 'react';

interface EditableTextProps {
  value: string;
  isEditMode: boolean;
  onChange: (val: string) => void;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export default function EditableText({
  value,
  isEditMode,
  onChange,
  className = '',
  as: Tag = 'span',
}: EditableTextProps) {
  if (isEditMode) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-rose-mist/35 border border-sakura/40 focus:border-dream-pink outline-none rounded-xl px-3 py-1.5 text-center text-dusty-plum placeholder-dusty-plum/40 focus:ring-1 focus:ring-dream-pink/20 transition-all font-sans ${className}`}
        style={{ width: '100%' }}
      />
    );
  }
  return <Tag className={className}>{value}</Tag>;
}
