import { Search } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

interface Props {
  /** "header" is compact on navy; "hero" is large on light backgrounds. */
  variant?: 'header' | 'hero';
  onSubmitted?: () => void;
}

export function SearchField({ variant = 'header', onSubmitted }: Props) {
  const id = useId();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    onSubmitted?.();
  }

  const isHero = variant === 'hero';

  return (
    <form role="search" onSubmit={handleSubmit} className="w-full">
      <label htmlFor={id} className="sr-only">
        Search place types, brands and places
      </label>
      <div className="relative flex">
        <Search
          aria-hidden="true"
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
            isHero ? 'h-5 w-5 text-ink-subtle' : 'h-4 w-4 text-navy-200'
          }`}
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isHero ? 'Try "travel center", "Buc-ee’s" or "Arizona"' : 'Search the atlas'}
          autoComplete="off"
          className={
            isHero
              ? 'h-14 w-full rounded-l border border-r-0 border-line-strong bg-paper-white pl-11 pr-3 text-body text-ink placeholder:text-ink-subtle'
              : 'h-10 w-full rounded-l border border-r-0 border-line-dark bg-navy-950 pl-9 pr-3 text-small text-paper-white placeholder:text-navy-200'
          }
        />
        <button
          type="submit"
          className={
            isHero
              ? 'h-14 shrink-0 rounded-r bg-navy-900 px-5 text-small font-semibold text-paper-white hover:bg-navy-700'
              : 'h-10 shrink-0 rounded-r border border-line-dark bg-navy-700 px-3 text-small font-semibold text-paper-white hover:bg-navy-500'
          }
        >
          Search
        </button>
      </div>
    </form>
  );
}
