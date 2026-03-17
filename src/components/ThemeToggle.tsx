"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from 'antd';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button 
        type="text" 
        icon={<Sun size={20} className="text-slate-400" />} 
        className="w-10 h-10 flex items-center justify-center rounded-xl"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button 
      type="text" 
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      icon={
        isDark ? (
          <Sun size={20} className="text-amber-400" />
        ) : (
          <Moon size={20} className="text-slate-600" />
        )
      } 
      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
    />
  );
}
