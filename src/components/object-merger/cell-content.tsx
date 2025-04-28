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
  highlightItems?: string[]
}

// Use memo to prevent unnecessary re-renders
export const CellContent = memo(function CellContent({
  value,
  config,
  expandedRows,
  toggleRowExpansion,
  highlightItems
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
      // if (Array.isArray(value)) {
      //   const selectedLabels = value.map((v) => {
      //     const option = config.options?.find((opt) => opt.value === v)
      //     return option ? option.label : v.toString()
      //   })
      //   return selectedLabels.join(', ')
      // }
      // return value?.toString() || ''
      // if (Array.isArray(value)) {
      //   const selectedLabels = value.map((v) => {
      //     const option = config.options?.find((opt) => opt.value === v)
      //     const label = option ? option.label : v.toString()
      //     const isDifferent = highlightItems?.includes(v)
      
      //     return (
      //       <span
      //         key={v}
      //         className={cn(
      //           'mr-1',
      //           isDifferent ? 'text-primary font-semibold' : 'text-muted-foreground'
      //         )}
      //       >
      //         {label}

      //       </span>

      //     )
      //   })
      
      //   return <div className="flex gap-1 flex-wrap">{selectedLabels}</div>
      // }
      if (Array.isArray(value)) {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {value.map((item, i) => {
              const isItemNotInMerge = highlightItems?.includes(item);
    
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    borderRadius: '9999px',
                    backgroundColor: isItemNotInMerge ? '#ffedd5' : '#f2f2f2',
                    border: isItemNotInMerge ? '1px solid #fb923c' : undefined,
                    color: isItemNotInMerge ? '#ea580c' : '#555',
                    fontWeight: isItemNotInMerge ? 500 : undefined,
                    fontSize: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  title={isItemNotInMerge ? "Not in Merge Result" : undefined} // Tooltip added here
                >
                  {item}
                  {isItemNotInMerge && (
                    <svg
                      style={{ marginLeft: '4px', color: 'inherit' }}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                    >
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
                        10-4.48 10-10S17.52 2 12 2zm0 15h-1v-1h1v1zm0-4h-1V7h1v6z"
                      />
                    </svg>
                  )}
                </span>
              )
            })}
          </div>
        )
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
