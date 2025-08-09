import EntriesDataTable from './entries-data-table';

export default function EntriesManagement() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Entries Management</h2>
        <p className="text-gray-600 mt-1">
          Manage dictionary entries with CRUD operations and bulk updates
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <EntriesDataTable />
      </div>
    </div>
  );
}