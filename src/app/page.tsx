'use client';

import React, { useEffect } from 'react';
import { useRouter } from '../lib/next-shim';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirection logic mimics middleware or server-side redirects
    const user = localStorage.getItem('currentUser');
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="animate-pulse flex flex-col items-center gap-2">
        <div className="h-8 w-8 bg-blue-600 rounded-full"></div>
        <p className="text-gray-500 font-medium">Carregando SaaS Manager...</p>
      </div>
    </div>
  );
}