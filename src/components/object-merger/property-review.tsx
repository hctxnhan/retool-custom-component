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

// Use memo to prevent unnecessary re-renders
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
      <div className="mb-1.5">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleObjectExpansion(path)}
        >
          <CollapsibleTrigger className="flex items-center w-full text-left px-2 py-1.5 hover:bg-muted/30 rounded-md transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            )}
            <span className="font-medium text-sm">{config.label}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
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
    <div className="flex flex-col mb-1.5 px-2 py-1.5 hover:bg-muted/30 rounded-md transition-colors">
      <div className="text-sm text-muted-foreground font-medium">
        {config.label}
      </div>
      <div className="mt-0.5">{renderFormattedValue(value, config)}</div>
    </div>
  )
})

// Format values for the review panel
function renderFormattedValue(value: any, config: PropertyConfig) {
  if (value === undefined || value === null) {
    return (
      <span className="text-muted-foreground/70 text-sm italic">Empty</span>
    )
  }

  switch (config.type) {
    case 'url':
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm flex items-center hover:underline transition-colors"
        >
          {value.toString()}
          <ExternalLink className="ml-1 h-3 w-3 opacity-70" />
        </a>
      )
    case 'checkbox':
      return value ? (
        <div className="flex items-center text-sm">
          <Check className="h-3.5 w-3.5 mr-1.5 text-primary" /> Yes
        </div>
      ) : (
        <div className="flex items-center text-sm text-muted-foreground">
          No
        </div>
      )
    case 'select':
    case 'radio':
      const option = config.options?.find((opt) => opt.value === value)
      return (
        <div className="text-sm">
          {option ? option.label : value?.toString() || ''}
        </div>
      )
    case 'multiselect':
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className="flex flex-wrap gap-1">
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
        <span className="text-muted-foreground/70 text-sm italic">
          None selected
        </span>
      )
    case 'date':
      return value ? (
        <div className="text-sm">{new Date(value).toLocaleDateString()}</div>
      ) : (
        ''
      )
    case 'textarea':
      return (
        <div className="text-sm whitespace-pre-wrap bg-muted/20 p-2 rounded-sm">
          {value.toString()}
        </div>
      )
    default:
      return <div className="text-sm">{value.toString()}</div>
  }
}
