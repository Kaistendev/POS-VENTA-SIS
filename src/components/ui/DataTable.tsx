import { ReactNode } from 'react';
import { TableSkeleton, EmptyState } from './Skeleton.tsx';
import Pagination from './Pagination.tsx';
import { Package } from 'lucide-react';

interface Column<T> {
  header: string;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: { label: string; onClick: () => void };
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  emptyAction,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="flex-1 w-full glass-panel rounded-2xl overflow-hidden flex flex-col border border-white/5 shadow-2xl">
      {loading ? (
        <TableSkeleton rows={8} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={emptyIcon || <Package className="w-8 h-8" />}
          title={emptyMessage || 'Sin registros'}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                  {columns.map((col, i) => (
                    <th key={i} className={`px-6 py-4 font-semibold ${col.headerClassName || ''}`}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((row) => (
                  <tr key={keyExtractor(row)} className="hover:bg-white/5 transition-colors group">
                    {columns.map((col, i) => (
                      <td key={i} className={`px-6 py-4 text-sm ${col.className || ''}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
