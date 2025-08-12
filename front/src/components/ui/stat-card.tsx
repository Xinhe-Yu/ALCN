interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}

export default function StatCard({ title, value, icon, onClick, clickable = false }: StatCardProps) {
  const content = (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">
            {title}
          </dt>
          <dd className="text-lg font-medium text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </dd>
        </dl>
      </div>
    </div>
  );

  if (clickable && onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left bg-white overflow-hidden shadow rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 cursor-pointer"
      >
        <div className="p-5">
          {content}
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        {content}
      </div>
    </div>
  );
}