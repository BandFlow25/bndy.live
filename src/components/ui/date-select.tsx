import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateSelectProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatDate(date: Date): string {
  const day = date.getDate()
  const formatted = format(date, "eeee d MMM yyyy")
  return formatted.replace(` ${day} `, ` ${getOrdinal(day)} `)
}

export function DateSelect({ date, onSelect, className }: DateSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    onSelect?.(date)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              open && "ring-2 ring-primary border-transparent",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDate(date) : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-4",
            "ring-2 ring-primary border-0"
          )} 
          align="start"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleSelect}
            showOutsideDays={true}
            className="p-0"
            weekStartsOn={1}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
                "hover:bg-accent rounded-md"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              day: cn(
                "h-9 w-9 p-0 font-normal",
                "hover:bg-accent hover:text-accent-foreground",
                "rounded-md transition-colors aria-selected:opacity-100"
              ),
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible"
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}