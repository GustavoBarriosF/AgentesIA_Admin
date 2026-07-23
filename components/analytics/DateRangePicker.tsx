"use client";

import { useState } from "react";
import { startOfMonth, endOfDay, subDays, startOfDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AnalyticsDateRange } from "@/types/analytics";

const PRESETS = [
  {
    label: "Hoy",
    range: (): AnalyticsDateRange => ({
      from: startOfDay(new Date()).toISOString(),
      to: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: "Últimos 7 días",
    range: (): AnalyticsDateRange => ({
      from: startOfDay(subDays(new Date(), 6)).toISOString(),
      to: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: "Últimos 30 días",
    range: (): AnalyticsDateRange => ({
      from: startOfDay(subDays(new Date(), 29)).toISOString(),
      to: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: "Este mes",
    range: (): AnalyticsDateRange => ({
      from: startOfMonth(new Date()).toISOString(),
      to: endOfDay(new Date()).toISOString(),
    }),
  },
  {
    label: "Últimos 90 días",
    range: (): AnalyticsDateRange => ({
      from: startOfDay(subDays(new Date(), 89)).toISOString(),
      to: endOfDay(new Date()).toISOString(),
    }),
  },
];

interface DateRangePickerProps {
  value: AnalyticsDateRange;
  onChange: (range: AnalyticsDateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [activeLabel, setActiveLabel] = useState("Últimos 30 días");

  const handleSelect = (preset: typeof PRESETS[number]) => {
    setActiveLabel(preset.label);
    onChange(preset.range());
  };

  const fromStr = format(new Date(value.from), "d MMM", { locale: es });
  const toStr = format(new Date(value.to), "d MMM yyyy", { locale: es });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-sm border border-border hover:bg-muted transition-colors outline-none">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{activeLabel}</span>
        <span className="text-muted-foreground text-xs">({fromStr} – {toStr})</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.label}
            onClick={() => handleSelect(preset)}
            className={activeLabel === preset.label ? "bg-accent font-medium" : ""}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
