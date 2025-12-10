import React from 'react';

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
    <div className="antialiased min-h-screen bg-gray-50 text-slate-900 font-sans">
      {children}
    </div>
  );
}