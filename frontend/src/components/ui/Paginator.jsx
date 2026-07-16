import { IconButton } from './Button';
import { Icon } from './Glass';

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
        className="disabled:opacity-30"
      >
        <Icon name="chevron_left" className="w-[18px] h-[18px]" stroke={2} />
      </IconButton>

      {pages_arr[0] > 1 && (
        <>
          <PageBtn num={1} active={page === 1} onClick={onPage} />
          {pages_arr[0] > 2 && <span className="text-white/40 text-[13px] px-1">…</span>}
        </>
      )}

      {pages_arr.map(n => (
        <PageBtn key={n} num={n} active={page === n} onClick={onPage} />
      ))}

      {pages_arr[pages_arr.length - 1] < pages && (
        <>
          {pages_arr[pages_arr.length - 1] < pages - 1 && (
            <span className="text-white/40 text-[13px] px-1">…</span>
          )}
          <PageBtn num={pages} active={page === pages} onClick={onPage} />
        </>
      )}

      <IconButton
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="disabled:opacity-30"
      >
        <Icon name="chevron_right" className="w-[18px] h-[18px]" stroke={2} />
      </IconButton>

      <span className="text-[12px] text-white/40 ml-2">
        {meta.total} total
      </span>
    </div>
  );
}

function PageBtn({ num, active, onClick }) {
  return (
    <button
      onClick={() => onClick(num)}
      className={`w-9 h-9 rounded-full text-[13.5px] font-semibold transition-colors ${
        active
          ? 'bg-celeste text-white'
          : 'text-white/50 hover:bg-white/8 hover:text-white'
      }`}
    >
      {num}
    </button>
  );
}
