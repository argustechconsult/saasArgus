import React from 'react';
import './globals.css';

export const metadata = {
  title: 'SaaS Manager',
  description: 'Management Dashboard',
};

export default function RootLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}