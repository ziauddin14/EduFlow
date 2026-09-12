"use client";

import { Pencil, Trash2, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TimetableDay, TimetableSlot } from "@/lib/types/timetable";

export function WeeklyGrid({
  week,
  canEdit,
  showClass,
  onEdit,
  onDelete,
}: {
  week: TimetableDay[];
  canEdit?: boolean;
  showClass?: boolean;
  onEdit?: (slot: TimetableSlot, day: string) => void;
  onDelete?: (slot: TimetableSlot) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {week.map(({ day, slots }) => (
        <div key={day} className="rounded-lg border bg-background">
          <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">{day}</div>
          <div className="space-y-2 p-2">
            {slots.length === 0 ? (
              <p className="px-1 py-3 text-center text-xs text-muted-foreground">No classes</p>
            ) : (
              slots.map((slot) => (
                <div key={slot._id} className="group rounded-md border p-2.5 text-sm">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-medium">{slot.subject?.name ?? "Subject"}</p>
                    {canEdit && (
                      <div className="hidden gap-0.5 group-hover:flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onEdit?.(slot, day)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onDelete?.(slot)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {showClass && slot.class && (
                    <Badge variant="secondary" className="mt-1">
                      {slot.class.name} {slot.section}
                    </Badge>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{slot.teacher?.name ?? "—"}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {slot.startTime}–{slot.endTime}
                    </span>
                    {slot.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {slot.room}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
