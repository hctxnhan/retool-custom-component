'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  className
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Handle clicking outside to close the calendar
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant={'outline'}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-[280px] justify-start text-left font-normal',
          !date && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, 'PPP') : <span>{placeholder}</span>}
      </Button>

      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute z-50 top-full mt-1 bg-popover shadow-md rounded-md p-0"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              onDateChange?.(date)
              setIsOpen(false)
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  )
}
