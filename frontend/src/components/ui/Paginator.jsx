import Button, { IconButton } from './Button';

export default function Paginator({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;

  const { page, pages } = meta;

  const pages_arr = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
    pages_arr.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <IconButton
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="text-on-surf-var disabled:opacity-30"
      >
        <span className="ms" style={{ fontSize: 18 }}>chevron_left</span>
      </IconButton>

      {pages_arr[0] > 1 && (
        <>
          <PageBtn num={1} active={page === 1} onClick={onPage} />
          {pages_arr[0] > 2 && <span className="text-on-surf-var text-body-s px-1">…</span>}
        </>
      )}

      {pages_arr.map(n => (
        <PageBtn key={n} num={n} active={page === n} onClick={onPage} />
      ))}

      {pages_arr[pages_arr.length - 1] < pages && (
        <>
          {pages_arr[pages_arr.length - 1] < pages - 1 && (
            <span className="text-on-surf-var text-body-s px-1">…</span>
          )}
          <PageBtn num={pages} active={page === pages} onClick={onPage} />
        </>
      )}

      <IconButton
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="text-on-surf-var disabled:opacity-30"
      >
        <span className="ms" style={{ fontSize: 18 }}>chevron_right</span>
      </IconButton>

      <span className="text-label-s text-on-surf-var ml-2">
        {meta.total} total
      </span>
    </div>
  );
}

function PageBtn({ num, active, onClick }) {
  return (
    <button
      onClick={() => onClick(num)}
      className={`w-9 h-9 rounded-lg text-label-l font-medium transition-colors ${
        active
          ? 'bg-pri text-on-pri'
          : 'text-on-surf-var hover:bg-surf-high hover:text-on-surf'
      }`}
    >
      {num}
    </button>
  );
}
