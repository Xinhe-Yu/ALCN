interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function ErrorMessage({ title = "Error", message, action }: ErrorMessageProps) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">{title}</h1>
      <p className="text-gray-600 mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
