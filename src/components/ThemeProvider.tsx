"use client";

import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { AntdRegistry } from '@ant-design/nextjs-registry';

const AntdProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#ef4444',
            borderRadius: 12,
            fontFamily: 'var(--font-geist-sans)',
          },
        }}
      >
        {children}
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ef4444',
          borderRadius: 16,
          fontFamily: 'var(--font-geist-sans)',
          colorBgContainer: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
          colorBgElevated: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
          colorBorderSecondary: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        },
        components: {
          Card: {
            colorBgContainer: resolvedTheme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
          },
          Modal: {
            colorBgElevated: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AntdRegistry>
        <AntdProvider>{children}</AntdProvider>
      </AntdRegistry>
    </NextThemesProvider>
  );
}
