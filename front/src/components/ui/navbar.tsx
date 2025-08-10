'use client';

import Link from 'next/link';
import { UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import type { User } from '@/app/types';
import { LanguageSwitcher } from './language-switcher';

interface NavbarProps {
  user?: User | null;
  onLogout?: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const t = useTranslations();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Ancient Lexicon CN
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {user ? (
              // Authenticated user menu
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Welcome, {user.email}
                </span>

                {user.role === 'admin' && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-1" />
                    {t('navigation.dashboard')}
                  </Link>
                )}

                <button
                  onClick={onLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              // Unauthenticated user
              <Link
                href="/auth"
                className="w-32 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-amber-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                {t('auth.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
