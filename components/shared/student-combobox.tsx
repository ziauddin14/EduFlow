"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { StudentOption } from "@/lib/types/students";

export function StudentCombobox({
  students,
  value,
  onChange,
  placeholder = "Select a student",
}: {
  students: StudentOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = students.find((s) => s._id === value);

  const filtered = useMemo(() => {
    if (!query) return students.slice(0, 50);
    const q = query.toLowerCase();
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))
      .slice(0, 50);
  }, [students, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          {selected ? `${selected.name} (${selected.studentId})` : placeholder}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students…"
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No students found.</p>
          )}
          {filtered.map((student) => (
            <button
              key={student._id}
              type="button"
              onClick={() => {
                onChange(student._id);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span>
                {student.name}{" "}
                <span className="text-muted-foreground">
                  ({student.studentId} &middot; {student.class?.name} {student.section})
                </span>
              </span>
              {student._id === value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
