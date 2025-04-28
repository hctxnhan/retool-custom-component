import React, { memo } from 'react'
import { Check, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { type PropertyConfig, getNestedValue } from '@/lib/object-merger-utils'

interface PropertyReviewProps {
  config: PropertyConfig
  directEditValues: Record<string, any>
  expandedObjects: Record<string, boolean>
  toggleObjectExpansion: (path: string) => void
  level?: number
}

export const PropertyReview = memo(function PropertyReview({
  config,
  directEditValues,
  expandedObjects,
  toggleObjectExpansion,
  level = 0
}: PropertyReviewProps) {
  const path = config.path || config.propertyKey
  const value = getNestedValue(directEditValues, path)
  const isExpanded = expandedObjects[path] !== false // Default to expanded

  if (config.type === 'object' && config.properties) {
    return (
      <div className="mb-2">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleObjectExpansion(path)}
        >
          <CollapsibleTrigger className="flex items-center w-full text-left px-2 py-1 hover:bg-muted/30 rounded-md transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <span className="font-semibold text-base">
              {config.label}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1">
            {config.properties.map((prop) => (
              <PropertyReview
                key={prop.path || prop.propertyKey}
                config={prop}
                directEditValues={directEditValues}
                expandedObjects={expandedObjects}
                toggleObjectExpansion={toggleObjectExpansion}
                level={level + 1}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-start px-2 py-2 border-b border-border">
      <div className="text-sm font-medium text-foreground">{config.label}</div>
      <div className="text-right text-sm max-w-[60%] break-words">
        {renderFormattedValue(value, config)}
      </div>
    </div>
  )
})

function renderFormattedValue(value: any, config: PropertyConfig) {
  if (value === undefined || value === null || value === '') {
    return (
      <span className="text-muted-foreground italic">No data</span>
    )
  }

  switch (config.type) {
    case 'url':
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center justify-end gap-1"

        >
          <span className="truncate">{value.toString()}</span>
          <ExternalLink className="h-4 w-4 opacity-70" />
        </a>
      )
    case 'checkbox':
      return value ? (
        <span className="text-green-600 font-semibold">✅ Yes</span>
      ) : (
        <span className="text-muted-foreground font-semibold">❌ No</span>
      )
    case 'select':
    case 'radio':
      const option = config.options?.find((opt) => opt.value === value)
      return <>{option ? option.label : value?.toString()}</>
    case 'multiselect':
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className="flex flex-wrap justify-end gap-1">
            {value.map((v) => {
              const option = config.options?.find((opt) => opt.value === v)
              return (
                <Badge key={v} variant="secondary" className="text-xs">
                  {option ? option.label : v}
                </Badge>
              )
            })}
          </div>
        )
      }
      return (
        <span className="text-muted-foreground italic">None selected</span>
      )
    case 'date':
      return <>{new Date(value).toLocaleDateString()}</>
    case 'textarea':
      return (
        <div className="whitespace-pre-wrap bg-muted/20 p-2 rounded-md">
          {value.toString()}
        </div>
      )
    default:
      return <>{value.toString()}</>
  }
}
