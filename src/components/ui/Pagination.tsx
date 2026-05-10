interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
      <span className="text-sm text-gray-500">{totalItems} registros — Página {currentPage} de {totalPages}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
