"use client";

import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";

interface CityTagsInputProps {
  value: string[];
  onChange: (cities: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function CityTagsInput({
  value,
  onChange,
  placeholder = "Adaugă un oraș...",
  label,
  required,
}: CityTagsInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addCity() {
    const city = input.trim();
    if (city && !value.includes(city)) {
      onChange([...value, city]);
      setInput("");
    }
  }

  function removeCity(city: string) {
    onChange(value.filter((c) => c !== city));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCity();
    }
  }

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label} {required && "*"}
        </label>
      )}
      <div
        className="flex flex-wrap gap-2 rounded-lg border border-gray-300 px-3 py-2 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((city) => (
          <span
            key={city}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
          >
            {city}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeCity(city);
              }}
              className="rounded-full p-0.5 hover:bg-primary-200"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex flex-1 items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
          {input.trim() && (
            <button
              type="button"
              onClick={addCity}
              className="rounded p-1 text-primary-500 hover:bg-primary-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Scrie numele orașului și apasă Enter pentru a adăuga
      </p>
    </div>
  );
}
