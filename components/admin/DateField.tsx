"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { inputCls } from "@/components/admin/FormField";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** yyyy-mm-dd → dd/mm/yyyy for display. */
function toDisplay(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** Accepts dd/mm/yyyy, d/m/yyyy, dd-mm-yyyy, dd.mm.yyyy, yyyy-mm-dd or 8 digits. */
function toIso(text: string): string | null {
  const value = text.trim();
  if (!value) return null;

  let y: number, mo: number, d: number;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (m) {
    y = +m[1]; mo = +m[2]; d = +m[3];
  } else if ((m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value))) {
    d = +m[1]; mo = +m[2]; y = +m[3];
  } else if (/^\d{8}$/.test(value)) {
    d = +value.slice(0, 2); mo = +value.slice(2, 4); y = +value.slice(4);
  } else {
    return null;
  }

  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/** Formats digits as DD/MM/YYYY while typing, spilling extra digits into the next segment. */
function formatTyping(raw: string) {
  const parts = raw.split(/[/.-]/);
  if (parts.length > 1) {
    const dd = parts[0].replace(/\D/g, "").slice(0, 2);
    const mmDigits = (parts[1] ?? "").replace(/\D/g, "");
    if (parts.length >= 3) {
      return `${dd}/${mmDigits.slice(0, 2)}/${(parts[2] ?? "").replace(/\D/g, "").slice(0, 4)}`;
    }
    if (mmDigits.length > 2) return `${dd}/${mmDigits.slice(0, 2)}/${mmDigits.slice(2, 6)}`;
    return `${dd}/${mmDigits}`;
  }
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function DateField({
  value, onChange, required, min,
}: {
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  min?: string;
}) {
  const [text, setText] = useState(() => toDisplay(value));
  const hiddenRef = useRef<HTMLInputElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value;
      setText(toDisplay(value));
    }
  }, [value]);

  function handleText(raw: string) {
    const next = formatTyping(raw);
    setText(next);
    const iso = toIso(next);
    if (iso) {
      lastValue.current = iso;
      onChange(iso);
    } else if (!next.trim()) {
      lastValue.current = "";
      onChange("");
    }
  }

  function openPicker() {
    const el = hiddenRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.click();
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/YYYY"
        value={text}
        onChange={(e) => handleText(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text").trim();
          const iso = toIso(pasted.slice(0, 10));
          if (iso) {
            e.preventDefault();
            lastValue.current = iso;
            setText(toDisplay(iso));
            onChange(iso);
          }
        }}
        onBlur={() => {
          const iso = toIso(text);
          if (iso) setText(toDisplay(iso));
        }}
        required={required}
        className={`${inputCls} pr-11`}
      />
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        min={min}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const iso = e.target.value;
          lastValue.current = iso;
          setText(toDisplay(iso));
          onChange(iso);
        }}
        className="sr-only"
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label="Open calendar"
        className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-700 hover:text-white"
      >
        <Calendar size={16} aria-hidden />
      </button>
    </div>
  );
}
