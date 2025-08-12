'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import LoginForm from '@/components/auth/login-form';

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Show nothing while redirecting
  if (user) {
    return null;
  }

  const handleLoginSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  );
}