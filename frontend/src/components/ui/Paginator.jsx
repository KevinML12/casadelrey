import Button from './Button';

export default function Paginator({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;

  const { page, pages } = meta;

  const pages_arr = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
    pages_arr.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4 flex-wrap">
      <Button variant="text" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Anterior
      </Button>

      {pages_arr[0] > 1 && (
        <>
          <PageBtn num={1} active={page === 1} onClick={onPage} />
          {pages_arr[0] > 2 && <span className="text-bg/40 text-13 px-1">…</span>}
        </>
      )}

      {pages_arr.map(n => (
        <PageBtn key={n} num={n} active={page === n} onClick={onPage} />
      ))}

      {pages_arr[pages_arr.length - 1] < pages && (
        <>
          {pages_arr[pages_arr.length - 1] < pages - 1 && (
            <span className="text-bg/40 text-13 px-1">…</span>
          )}
          <PageBtn num={pages} active={page === pages} onClick={onPage} />
        </>
      )}

      <Button variant="text" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Siguiente
      </Button>

      <span className="text-12 text-bg/45 ml-2">
        {meta.total} total
      </span>
    </div>
  );
}

function PageBtn({ num, active, onClick }) {
  return (
    <button
      onClick={() => onClick(num)}
      className={`w-9 h-9 rounded-full text-14 font-semibold transition-colors ${
        active
          ? 'bg-acento text-bg'
          : 'text-bg/55 hover:bg-bg/6 hover:text-bg'
      }`}
    >
      {num}
    </button>
  );
}
