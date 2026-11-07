"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import { inputCls } from "@/components/admin/FormField";
import {
  COMMON_COUNTRIES, COUNTRIES, DEFAULT_COUNTRY, OTHER_COUNTRIES,
  composePhone, countryForCode, formatDigits, isValidDigits, overrunsMobile, splitPhone, tidyNumber, withoutTrunkZero, type Country,
} from "@/lib/countries";

function Flag({ iso }: { iso: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${iso.toLowerCase()}.png`} alt="" width={24} height={18} loading="lazy" className="w-6 h-[18px] shrink-0 rounded-[3px] object-cover" />;
}

/**
 * WhatsApp-style phone input: a searchable country list above separate code and number boxes.
 * The number formats itself as it is typed: the local leading 0 goes and the country's spacing
 * appears. The parent gets one string ("+92 300 1234567"), and only when someone edits it, so
 * a saved number stays as it is in the database until then.
 */
export default function PhoneField({
  value, onChange, label, autoComplete = "off",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  autoComplete?: string;
}) {
  const [parts, setParts] = useState(() => splitPhone(value, DEFAULT_COUNTRY));
  const [emitted, setEmitted] = useState(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [typing, setTyping] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const numberBox = useRef<HTMLInputElement>(null);
  const caretAfterDigit = useRef<number | null>(null);

  // A new value from the parent (say, a member finished loading) replaces what's in the boxes.
  if (value !== emitted) {
    setParts(splitPhone(value, parts.iso));
    setEmitted(value);
  }

  const country = countryForCode(parts.code, parts.iso);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...COMMON_COUNTRIES, ...OTHER_COUNTRIES];
    const digits = q.replace(/\D/g, "");
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.iso.toLowerCase() === q || (digits && c.dial.slice(1).startsWith(digits)));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  // Reformatting rewrites the box, so put the caret back after the same digit.
  useLayoutEffect(() => {
    const box = numberBox.current;
    const target = caretAfterDigit.current;
    if (!box || target === null) return;
    caretAfterDigit.current = null;
    let position = 0;
    for (let seen = 0; seen < target && position < box.value.length; position++) {
      if (/\d/.test(box.value[position])) seen++;
    }
    box.setSelectionRange(position, position);
  });

  function update(next: typeof parts) {
    const v = composePhone(next.code, next.number);
    setParts(next);
    setEmitted(v);
    onChange(v);
  }

  function typeCode(raw: string) {
    const code = raw.replace(/\D/g, "").slice(0, 4);
    const iso = countryForCode(code, parts.iso)?.iso ?? parts.iso;
    update({ ...parts, code, iso, number: tidyNumber(code, iso, parts.number) });
  }

  function typeNumber(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const typed = raw.replace(/\D/g, "");
    const previous = parts.number.replace(/\D/g, "");
    // A full international number pasted here sorts itself into the two boxes. "00" only counts
    // when pasted: editing can leave a number starting 00 for a moment.
    if (/^\s*\+/.test(raw) || (/^\s*00/.test(raw) && typed.length > previous.length + 1)) {
      const split = splitPhone(raw, parts.iso);
      if (split.international) return update(split);
    }
    if (!country) return update({ ...parts, number: raw.replace(/[^\d\s()-]/g, "").slice(0, 20) });

    const before = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, "").length;
    // Mid-edit a number can start with 0 for a moment (300… with the 3 deleted); only leaving the box tidies that.
    const digits = typed.length < previous.length ? typed : withoutTrunkZero(typed, parts.iso);
    const refused = overrunsMobile(parts.code, previous, digits);
    caretAfterDigit.current = Math.max(0, (refused ? before - 1 : before) - (typed.length - digits.length));
    update({ ...parts, number: formatDigits(parts.code, refused ? previous : digits) });
  }

  function leaveNumber() {
    setTyping(false);
    const tidy = tidyNumber(parts.code, parts.iso, parts.number);
    if (tidy !== parts.number) update({ ...parts, number: tidy });
  }

  function numberKeys(e: KeyboardEvent<HTMLInputElement>) {
    // Delete on a space would only have it put straight back, so step over it to the next digit.
    const box = e.currentTarget;
    const at = box.selectionStart;
    if (e.key === "Delete" && at !== null && at === box.selectionEnd && /\D/.test(box.value[at] ?? "")) {
      box.setSelectionRange(at + 1, at + 1);
    }
  }

  function choose(c: Country) {
    const code = c.dial.slice(1);
    update({ ...parts, iso: c.iso, code, number: tidyNumber(code, c.iso, parts.number) });
    setOpen(false);
    numberBox.current?.focus();
  }

  function toggle() {
    setQuery("");
    setActive(0);
    setOpen((o) => !o);
  }

  function listKeys(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => Math.min(results.length - 1, Math.max(0, a + step)));
    } else if (e.key === "Enter") {
      // Inside a form, Enter here must pick a country rather than submit.
      e.preventDefault();
      if (results[active]) choose(results[active]);
    }
  }

  return (
    <div ref={root} className="relative space-y-2">
      <button
        ref={trigger}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label} country: ${country?.name ?? "not chosen"}`}
        className={`${inputCls} flex items-center gap-2.5 text-left`}
      >
        {country && <Flag iso={country.iso} />}
        <span className={`min-w-0 flex-1 truncate ${country ? "" : parts.code ? "text-red-400" : "text-gray-500"}`}>
          {country?.name ?? (parts.code ? "Invalid country code" : "Choose a country")}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-gray-500 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
          <div className="relative border-b border-gray-700 p-2">
            <Search size={14} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={listKeys}
              placeholder="Search country or code"
              aria-label="Search country or code"
              className="w-full rounded-lg bg-gray-900 border border-gray-700 pl-8 pr-3 py-2 text-base sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />
          </div>
          <ul role="listbox" aria-label="Countries" className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">No country found.</li>}
            {results.map((c, i) => (
              <li key={c.iso} role="option" aria-selected={c.iso === country?.iso}>
                <button
                  type="button"
                  onClick={() => choose(c)}
                  onMouseEnter={() => setActive(i)}
                  ref={i === active ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${i === active ? "bg-gray-700" : ""} ${c.iso === country?.iso ? "text-green-400" : "text-gray-200"}`}
                >
                  <Flag iso={c.iso} />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="shrink-0 text-gray-400">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative w-[5.25rem] shrink-0">
          <span aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base sm:text-sm text-gray-400">+</span>
          <input
            value={parts.code}
            onChange={(e) => typeCode(e.target.value)}
            aria-label={`${label} country code`}
            inputMode="numeric"
            autoComplete="off"
            className={`${inputCls} !pl-7 !pr-2`}
          />
        </div>
        <input
          ref={numberBox}
          value={parts.number}
          onChange={typeNumber}
          onKeyDown={numberKeys}
          onFocus={() => setTyping(true)}
          onBlur={leaveNumber}
          aria-label={label}
          inputMode="tel"
          autoComplete={autoComplete}
          placeholder={parts.iso === DEFAULT_COUNTRY ? "300 1234567" : "Phone number"}
          className={`${inputCls} min-w-0 flex-1`}
        />
      </div>
      {!typing && country && /\d/.test(parts.number) && !isValidDigits(parts.code, parts.number.replace(/\D/g, "")) && (
        <p role="status" className="text-xs text-amber-400">Please check this number. It does not look complete for {country.name}.</p>
      )}
    </div>
  );
}
