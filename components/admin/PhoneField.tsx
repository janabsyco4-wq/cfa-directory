"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { inputCls } from "@/components/admin/FormField";
import {
  COMMON_COUNTRIES, DEFAULT_COUNTRY, OTHER_COUNTRIES,
  cleanPhone, countryByIso, detectCountry, withCountryCode,
} from "@/lib/countries";

const start = (value: string, iso: string) => value || `${countryByIso(iso).dial} `;

/**
 * Phone number with a country picker. Choosing a country puts its calling code in the box;
 * the box stays free to type in, and typing a code moves the picker to match.
 * The parent only ever sees the cleaned value, so a lone calling code reads as empty.
 */
export default function PhoneField({
  value, onChange, label, autoComplete = "off",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  autoComplete?: string;
}) {
  const [picked, setPicked] = useState(() => detectCountry(value)?.iso ?? DEFAULT_COUNTRY);
  const [text, setText] = useState(() => start(value, picked));

  // A new value from the parent (say, a member finished loading) replaces what's in the box.
  if (cleanPhone(text) !== cleanPhone(value)) {
    const iso = detectCountry(value, picked)?.iso ?? picked;
    setPicked(iso);
    setText(start(value, iso));
  }

  const country = detectCountry(text, picked) ?? countryByIso(picked);

  function type(next: string) {
    const v = next.replace(/[^\d+\s()-]/g, "");
    const found = detectCountry(v, picked);
    if (found) setPicked(found.iso);
    setText(v);
    onChange(cleanPhone(v));
  }

  function pick(iso: string) {
    const next = withCountryCode(text, countryByIso(iso), country);
    setPicked(iso);
    setText(next);
    onChange(cleanPhone(next));
  }

  return (
    <div className="flex gap-2">
      <div className="relative shrink-0 w-[5.75rem] rounded-xl bg-gray-800 border border-gray-700 focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-500 transition">
        <div aria-hidden className="flex h-full items-center justify-between gap-1 px-2.5 text-sm text-white">
          <span className="whitespace-nowrap"><span className="text-gray-400 text-xs">{country.iso}</span> {country.dial}</span>
          <ChevronDown size={13} className="shrink-0 text-gray-500" />
        </div>
        <select
          value={country.iso}
          onChange={(e) => pick(e.target.value)}
          aria-label={`${label} country code`}
          className="absolute inset-0 w-full cursor-pointer opacity-0 bg-gray-800 text-white text-sm"
        >
          <optgroup label="Common">
            {COMMON_COUNTRIES.map((c) => <option key={c.iso} value={c.iso}>{c.name} ({c.dial})</option>)}
          </optgroup>
          <optgroup label="All countries">
            {OTHER_COUNTRIES.map((c) => <option key={c.iso} value={c.iso}>{c.name} ({c.dial})</option>)}
          </optgroup>
        </select>
      </div>
      <input
        value={text}
        onChange={(e) => type(e.target.value)}
        onFocus={(e) => {
          // Tabbing in would select a lone code, and the first digit typed would replace it.
          const el = e.target;
          if (el.value && !cleanPhone(el.value)) requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
        }}
        aria-label={label}
        inputMode="tel"
        autoComplete={autoComplete}
        maxLength={24}
        placeholder={`${country.dial} 300 1234567`}
        className={`${inputCls} min-w-0 flex-1`}
      />
    </div>
  );
}
