'use client';

import { useTranslations } from 'next-intl';
import { LANGUAGE_COLORS, ENTRY_TYPE_COLORS } from '../entries/data-table/column-config';

interface BadgeProps {
  code: string;
  type?: 'lang' | 'type';
}

export default function Badge({ code, type = 'lang' }: BadgeProps) {
  const t = useTranslations();

  let colorClass = '';
  let displayText = code;

  if (type === 'lang') {
    colorClass = LANGUAGE_COLORS[code] || LANGUAGE_COLORS[''];
    displayText = t(`languageCodes.${code}`, { defaultValue: code });
  } else if (type === 'type') {
    colorClass = ENTRY_TYPE_COLORS[code] || ENTRY_TYPE_COLORS[''];
    displayText = t(`entryTypes.${code}`, { defaultValue: code });
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}>
      {displayText}
    </span>
  );
}
