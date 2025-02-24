import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available'
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={twMerge(
                  'px-3 py-3.5 text-left text-sm font-semibold text-gray-900',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(item)}
              className={twMerge(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-gray-50'
              )}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={twMerge(
                    'whitespace-nowrap px-3 py-4 text-sm text-gray-500',
                    column.className
                  )}
                >
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : item[column.accessor as keyof T]?.toString()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
