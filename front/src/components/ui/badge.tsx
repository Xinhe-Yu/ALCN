import { LANGUAGE_COLORS, ENTRY_TYPE_COLORS } from '../entries/data-table/column-config';

interface BadgeProps {
  code: string;
  type?: 'lang' | 'type';
}

export default function Badge({ code, type = 'lang' }: BadgeProps) {
  let colorClass = '';
  
  if (type === 'lang') {
    colorClass = LANGUAGE_COLORS[code] || LANGUAGE_COLORS[''];
  } else {
    colorClass = ENTRY_TYPE_COLORS[code] || ENTRY_TYPE_COLORS[''];
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}>
      {code}
    </span>
  );
}
