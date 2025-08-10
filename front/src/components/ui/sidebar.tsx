'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  HomeIcon,
  TableCellsIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = useTranslations();

  const tabs = [
    { id: 'general', name: t('dashboard.sidebar.general'), icon: HomeIcon },
    { id: 'entries', name: t('dashboard.sidebar.entries'), icon: TableCellsIcon },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-20 left-4 z-40">
        <button
          onClick={toggleMobileMenu}
          className="bg-white p-2 rounded-md shadow-lg border border-gray-200 hover:bg-gray-50"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 min-w-42 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full w-full pt-20 lg:pt-6">
          {/* Sidebar header */}
          <div className="px-4 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.title')}</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                    ? 'bg-amber-50 text-amber-700 border-r-2 border-amber-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-amber-500' : 'text-gray-400'
                      }`}
                  />
                  {tab.name}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {t('dashboard.version')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
