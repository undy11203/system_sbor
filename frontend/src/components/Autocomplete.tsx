import { useState, useRef, useEffect } from 'react';
import type { IndividualSuggestion } from '../api/ontologyApi';
import './Autocomplete.css';

interface Props {
  placeholder?: string;
  fetchSuggestions: (query: string) => Promise<IndividualSuggestion[]>;
  onSelect: (uri: string, label: string) => void;
  initialValue?: string;
}

export default function Autocomplete({ placeholder, fetchSuggestions, onSelect, initialValue }: Props) {
  const [inputVal, setInputVal] = useState(initialValue ?? '');
  const [suggestions, setSuggestions] = useState<IndividualSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputVal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchSuggestions(val.trim());
        setSuggestions(res);
        setOpen(res.length > 0);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(s: IndividualSuggestion) {
    setInputVal(s.label);
    setOpen(false);
    setSuggestions([]);
    onSelect(s.uri, s.label);
  }

  return (
    <div className="ac" ref={wrapRef}>
      <input
        className="ac__input"
        value={inputVal}
        onChange={handleChange}
        placeholder={placeholder ?? 'Начните вводить...'}
        autoComplete="off"
      />
      {loading && <span className="ac__spinner" />}
      {open && (
        <ul className="ac__list">
          {suggestions.map(s => (
            <li key={s.uri} className="ac__item" onMouseDown={() => handleSelect(s)}>
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
