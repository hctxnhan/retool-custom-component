import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { PropertyConfig } from '@/lib/object-merger-utils'
import { cn } from '@/lib/utils'
import { AlertCircle, Tag, PlusCircle } from 'lucide-react'
import { memo } from 'react'
import MultipleSelector from '../ui/multiselect'

interface EditableInputProps {
  config: PropertyConfig
  value: any
  onValueChange: (path: string, value: any) => void
  isModified?: boolean
}

// Use memo to prevent unnecessary re-renders
export const EditableInput = memo(function EditableInput({
  config,
  value,
  onValueChange,
  isModified = false
}: EditableInputProps) {
  const path = config.path || config.propertyKey

  const renderModifiedIndicator = () => {
    if (!isModified) return null

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute right-1 top-1">
              <AlertCircle className="h-3 w-3 text-primary" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>This value has been modified</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  switch (config.type) {
    case 'text':
    case 'url':
      return (
        <div className="relative">
          <Input
            value={value || ''}
            onChange={(e) => onValueChange(path, e.target.value)}
            className={cn(
              'w-full transition-all duration-200',
              isModified && 'border-primary/30'
            )}
            type={config.type === 'url' ? 'url' : 'text'}
          />
          {renderModifiedIndicator()}
        </div>
      )
    case 'textarea':
      return (
        <div className="relative">
          <Textarea
            value={value || ''}
            onChange={(e) => onValueChange(path, e.target.value)}
            className={cn(
              'w-full min-h-[80px] transition-all duration-200',
              isModified && 'border-primary/30'
            )}
          />
          {renderModifiedIndicator()}
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex justify-center relative">
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => onValueChange(path, !!checked)}
            className={cn(
              'transition-all duration-200',
              isModified && 'border-primary/30'
            )}
          />
          {isModified && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </div>
      )
    case 'select':
      return (
        <div className="relative">
          <Select
            value={value?.toString() || ''}
            onValueChange={(newValue) => onValueChange(path, newValue)}
          >
            <SelectTrigger
              className={cn(
                'w-full transition-all duration-200',
                isModified && 'border-primary/30'
              )}
            >
              <SelectValue
                placeholder="Select option"
                // If value doesn't match any option, show it as custom value
                {...(value &&
                !config.options?.some(
                  (opt) => opt.value.toString() === value.toString()
                )
                  ? {
                      children: (
                        <span className="flex items-center gap-1.5">
                          {value.toString()}
                          <Tag className="h-3 w-3 text-primary/70" />
                        </span>
                      )
                    }
                  : {})}
              />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem
                  key={option.value.toString()}
                  value={option.value.toString()}
                >
                  {option.label}
                </SelectItem>
              ))}
              {/* Custom value input */}
              {config.allowCustom && (
                <>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Or enter custom value:
                  </div>
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Enter custom value..."
                      className="h-8 text-sm"
                      defaultValue={
                        value &&
                        !config.options?.some(
                          (opt) => opt.value.toString() === value.toString()
                        )
                          ? value.toString()
                          : ''
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const customValue = e.currentTarget.value
                          if (customValue.trim() !== '') {
                            onValueChange(path, customValue)
                            // Close dropdown after selection
                            const closeEvent = new Event('keydown')
                            Object.defineProperty(closeEvent, 'key', {
                              value: 'Escape'
                            })
                            document.dispatchEvent(closeEvent)
                          }
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </SelectContent>
          </Select>
          {renderModifiedIndicator()}
        </div>
      )
    case 'radio':
      return (
        <div className="relative">
          <RadioGroup
            value={value?.toString() || ''}
            onValueChange={(newValue) => onValueChange(path, newValue)}
            className="flex flex-col space-y-1"
          >
            {config.options?.map((option) => (
              <div
                key={option.value.toString()}
                className="flex items-center space-x-2"
              >
                <RadioGroupItem
                  value={option.value.toString()}
                  id={`${path}-${option.value}`}
                  className={cn(
                    'transition-all duration-200',
                    isModified && 'border-primary/30'
                  )}
                />
                <Label htmlFor={`${path}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {renderModifiedIndicator()}
        </div>
      )
    case 'date':
      return (
        <div className="relative">
          <DatePicker
            date={value ? new Date(value) : undefined}
            onDateChange={(date) => {
              console.log('Date changed:', date)
              onValueChange(
                path,
                date ? date.toISOString().split('T')[0] : null
              )
            }}
            className={cn(
              'transition-all duration-200',
              isModified && 'border-primary/30'
            )}
          />
          {renderModifiedIndicator()}
        </div>
      )
    case 'multiselect':
      return (
        <div className="relative">
          <MultipleSelector
            placeholder="Select options..."
            options={config.options?.map((option) => ({
              value: option.value.toString(),
              label: option.label
            }))}
            value={
              Array.isArray(value)
                ? value.map((v) => {
                    const option = config.options?.find(
                      (opt) => opt.value === v
                    )
                    return {
                      value: v.toString(),
                      label: option ? option.label : v.toString(),
                      isCustom: !option && config.allowCustom
                    }
                  })
                : []
            }
            onChange={(selectedOptions) => {
              const newValue = selectedOptions.map((opt) => opt.value)
              onValueChange(path, newValue)
            }}
            className={cn(
              'transition-all duration-200',
              isModified && 'border-primary/30'
            )}
            allowCustom={config.allowCustom}
            onCreateOption={(inputValue) => {
              // Add the custom value to the existing selections
              if (inputValue.trim() !== '') {
                const newValue = Array.isArray(value)
                  ? [...value, inputValue]
                  : [inputValue]
                onValueChange(path, newValue)
                return {
                  value: inputValue,
                  label: inputValue,
                  isCustom: true
                }
              }
              return null
            }}
          />
          {renderModifiedIndicator()}
        </div>
      )
    case 'object':
      return (
        <div className="text-muted-foreground italic flex items-center justify-between">
          <span>Object properties below</span>
          {isModified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-primary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    One or more properties in this object have been modified
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    default:
      return <div>Unsupported type</div>
  }
})
