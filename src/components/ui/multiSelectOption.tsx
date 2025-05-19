'use client'
import * as React from 'react'
import { Check, ChevronDown, X, Plus } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

export interface Option {
  value: string
  label: string
  disabled?: boolean
  fixed?: boolean
}

interface MultiSelectProps {
  options: Option[]
  value?: Option[]
  onChange?: (selected: Option[]) => void
  placeholder?: string
  maxSelected?: number
  disabled?: boolean
  className?: string
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options =[],
  value = [],
  onChange,
  placeholder = 'Select...',
  maxSelected = Number.MAX_SAFE_INTEGER,
  disabled = false,
  className = '',
}) => {
  const [selected, setSelected] = React.useState<Option[]>(value)
  const [inputValue, setInputValue] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setSelected(value)
  }, [value])

  const handleSelect = (option: Option) => {
    if (selected.find((s) => s.value === option.value)) {
      const updated = selected?.filter((s) => s.value !== option.value)
      setSelected(updated)
      onChange?.(updated)
    } else {
      if (selected.length >= maxSelected) return
      const updated = [...selected, option]
      setSelected(updated)
      onChange?.(updated)
    }
  }

  const handleRemove = (value: string) => {
    const updated = selected.filter((s) => s.value !== value)
    setSelected(updated)
    onChange?.(updated)
  }

  const handleCreateOption = () => {
    const newOption: Option = { value: inputValue, label: inputValue }
    handleSelect(newOption)
    setInputValue('')
  }

  // const filteredOptions = options.filter(
  //   (opt) =>
  //     opt?.label?.toLowerCase().includes(inputValue.toLowerCase()) &&
  //     !selected.find((s) => s.value === opt.value)
  // )
    const filteredOptions = options.filter(
      (opt) =>
        typeof opt.label === 'string' &&
        opt.label.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selected.find((s) => s.value === opt.value)
    )

  const canCreate =
    inputValue.trim() !== '' &&
    !options.find((opt) => opt.label === inputValue) &&
    !selected.find((s) => s.label === inputValue)

  return (
    <div className={`multi-select ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className={`border min-h-[40px] px-2 py-1 rounded flex flex-wrap gap-1 items-center ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
            }`}
            onClick={() => !disabled && setIsOpen(true)}
          >
            {selected.length === 0 && (
              <span className="text-gray-400">No selection</span>
            )}
            {selected.map((opt) => (
              <div
                key={opt.value}
                className="flex items-center border border-blue-500 text-blue-700 bg-blue-100 rounded-full px-2 py-1 text-sm"
              >
                {opt.label}
                {!opt.fixed && (
                  <button
                    type="button"
                    className="ml-1 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(opt.value)
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            <ChevronDown className="ml-auto" />
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-[300px]  p-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type to search or add..."
            className="mb-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canCreate) {
                e.preventDefault()
                handleCreateOption()
              }
            }}
          />
          <div className=" h-12 overflow-auto flex flex-col gap-1" style={{ maxHeight: '200px' }}>
            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                disabled={opt.disabled}
                className="flex justify-between px-2 py-1 text-left hover:bg-primary/90 rounded"
                onClick={() => handleSelect(opt)}
              >
                <span>{opt.label}</span>
                {selected.find((s) => s.value === opt.value) && <Check size={16} />}
              </button>
            ))}
            {canCreate && (
              <button
                onClick={handleCreateOption}
                className="flex items-center gap-1 text-blue-600 hover:underline mt-1"
              >
                <Plus size={14} />
                Add "<span className="font-medium">{inputValue}</span>"
              </button>
            )}
            {filteredOptions.length === 0 && !canCreate && (
              <div className="text-sm text-gray-400 px-2 py-1">No options</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default MultiSelect
