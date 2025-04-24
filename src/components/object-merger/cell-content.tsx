'use client'
import React, { memo } from 'react'
import { Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PropertyConfig } from '@/lib/object-merger-utils'

interface CellContentProps {
  value: any
  config: PropertyConfig
  expandedRows: Record<string, boolean>
  toggleRowExpansion: (key: string) => void
}

// Use memo to prevent unnecessary re-renders
export const CellContent = memo(function CellContent({
  value,
  config,
  expandedRows,
  toggleRowExpansion
}: CellContentProps) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground italic">Empty</span>
  }

  const path = config.path || config.propertyKey

  switch (config.type) {
    case 'url':
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary flex items-center hover:underline"
        >
          {value.toString().substring(0, 20)}
          {value.toString().length > 20 ? '...' : ''}
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      )
    case 'checkbox':
      return value ? (
        <div className="flex justify-center">
          <Check className="h-4 w-4" />
        </div>
      ) : (
        <div className="flex justify-center">-</div>
      )
    case 'select':
    case 'radio':
      const option = config.options?.find((opt) => opt.value === value)
      return option ? option.label : value?.toString() || ''
    case 'multiselect':
      if (Array.isArray(value)) {
        const selectedLabels = value.map((v) => {
          const option = config.options?.find((opt) => opt.value === v)
          return option ? option.label : v.toString()
        })
        return selectedLabels.join(', ')
      }
      return value?.toString() || ''
    case 'date':
      return value ? new Date(value).toLocaleDateString() : ''
    case 'object':
      return <span className="text-muted-foreground italic">Object</span>
    case 'textarea':
      const isExpanded = expandedRows[path]
      return (
        <div>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              !isExpanded && 'line-clamp-2'
            )}
          >
            {value.toString()}
          </div>
          {value.toString().split('\n').length > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleRowExpansion(path)
              }}
              className="text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center"
            >
              {isExpanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  Show more <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </button>
          )}
        </div>
      )
    default:
      return value.toString()
  }
})
