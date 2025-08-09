interface BadgeProps {
  code: string;
  type?: 'lang' | 'type';
}

export default function Badge({ code, type = 'lang' }: BadgeProps) {
  const className = type === 'lang'
    ? `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-600 text-gray-100`
    : `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`;

  return (
    <span className={className}>
      {code}
    </span>
  );
}
