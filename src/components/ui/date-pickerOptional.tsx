'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={`date-picker ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className={`border min-h-[40px] px-2 py-1 rounded flex items-center gap-2 ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
            }`}
            onClick={() => !disabled && setIsOpen(true)}
          >
            <CalendarIcon className="text-muted-foreground w-4 h-4" />
            <span className="text-sm text-left truncate flex-1">
              {date ? format(date, 'PPP') : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent  className="min-h-[40px] px-2 py-1 rounded flex items-center gap-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onDateChange?.(newDate)
              setIsOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePicker
