export default function EntriesManagement() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Entries Management</h2>
        <p className="text-gray-600 mt-1">
          Manage dictionary entries with CRUD operations and bulk updates
        </p>
      </div>

      {/* Placeholder for the actual table - will be implemented next */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-8 text-center">
          <div className="text-gray-400 text-lg mb-2">🚧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            NocoDB-style Interface Coming Soon
          </h3>
          <p className="text-gray-500">
            This will include a data table with sorting, pagination, inline editing, 
            and bulk operations for entries and translations.
          </p>
        </div>
      </div>
    </div>
  );
}