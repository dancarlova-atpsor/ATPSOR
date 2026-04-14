"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock, CalendarCheck } from "lucide-react";

interface Block {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

interface Vehicle {
  id: string;
  name: string;
}

interface VehicleCalendarProps {
  vehicles: Vehicle[];
  blocks: Block[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

const DAY_NAMES = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];

export default function VehicleCalendar({ vehicles, blocks }: VehicleCalendarProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  const filteredBlocks = selectedVehicleId === "all"
    ? blocks
    : blocks.filter((b) => b.vehicle_id === selectedVehicleId);

  function getBlocksForDate(dateStr: string) {
    return filteredBlocks.filter((b) => b.start_date <= dateStr && b.end_date >= dateStr);
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const todayStr = formatDate(now.getFullYear(), now.getMonth(), now.getDate());

  // Build calendar grid
  const cells: { day: number; dateStr: string }[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, dateStr: "" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: formatDate(currentYear, currentMonth, d) });
  }

  // Legend counts
  const bookingCount = filteredBlocks.filter((b) => b.reason === "booking").length;
  const manualCount = filteredBlocks.filter((b) => b.reason === "manual").length;

  return (
    <div className="rounded-xl bg-white p-5 shadow-md">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <CalendarCheck className="h-5 w-5 text-primary-500" />
        Calendar Disponibilitate
      </h3>

      {/* Vehicle filter */}
      {vehicles.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="all">Toate vehiculele</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-lg p-2 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h4 className="text-base font-semibold text-gray-800">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h4>
        <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-gray-100">
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.day === 0) {
            return <div key={`empty-${i}`} className="h-10" />;
          }

          const dayBlocks = getBlocksForDate(cell.dateStr);
          const isToday = cell.dateStr === todayStr;
          const hasBooking = dayBlocks.some((b) => b.reason === "booking");
          const hasManual = dayBlocks.some((b) => b.reason === "manual");
          const isPast = cell.dateStr < todayStr;

          const isOccupied = hasBooking || hasManual;
          let bgClass = "bg-green-50 text-green-700 hover:bg-green-100";
          if (isOccupied) {
            bgClass = "bg-red-100 text-red-700 font-bold";
          }
          if (isPast && !isOccupied) {
            bgClass = "bg-gray-50 text-gray-400";
          }

          return (
            <div
              key={cell.dateStr}
              className={`relative flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${bgClass} ${
                isToday ? "ring-2 ring-primary-500 ring-offset-1" : ""
              }`}
              title={
                dayBlocks.length > 0
                  ? "OCUPAT:\n" + dayBlocks.map((b) => {
                      const v = vehicles.find((v) => v.id === b.vehicle_id);
                      return `• ${v?.name || "Vehicul"} (${b.reason === "booking" ? "prin platforma" : "rezervare externa"})`;
                    }).join("\n")
                  : "Disponibil"
              }
            >
              {cell.day}
              {dayBlocks.length > 1 && selectedVehicleId === "all" && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-[10px] text-white">
                  {dayBlocks.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="h-3 w-3 rounded bg-green-100" />
          Liber
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="h-3 w-3 rounded bg-red-100" />
          Ocupat ({bookingCount + manualCount})
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="h-3 w-3 rounded-full ring-2 ring-primary-500" />
          Azi
        </div>
        <div className="ml-auto text-xs text-gray-400">
          💡 {bookingCount} prin platforma + {manualCount} rezervari externe
        </div>
      </div>
    </div>
  );
}
