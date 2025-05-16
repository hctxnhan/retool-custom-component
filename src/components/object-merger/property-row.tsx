import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { CellContent } from './cell-content'
import { EditableInput } from './editable-input'
import {
  type PropertyConfig,
  getNestedValue,
  getNestingLevel
} from '@/lib/object-merger-utils'

interface PropertyRowProps {
  config: PropertyConfig
  objects: Record<string, any>[]
  selectedValues: Record<string, any>
  expandedRows: Record<string, boolean>
  openPopover: Record<string, boolean>
  toggleRowExpansion: (key: string) => void
  togglePopover: (key: string, state?: boolean) => void
  handleSelectValue: (path: string, value: any, sourceIndex: number) => void
  handleDirectEdit: (path: string, value: any) => void
  directEditValues: Record<string, any>
  isModified?: boolean
  allExpanded?: boolean
  isPinned?: boolean
}

// Use memo to prevent unnecessary re-renders
export const PropertyRow = memo(function PropertyRow({
  config,
  objects,
  selectedValues,
  expandedRows,
  openPopover,
  toggleRowExpansion,
  togglePopover,
  handleSelectValue,
  handleDirectEdit,
  directEditValues,
  isModified = false,
  allExpanded = true,
  isPinned = false
}: PropertyRowProps) {
  const path = config.path || config.propertyKey
  const level = getNestingLevel(path)
  const isObjectProperty = config.type === 'object'
  const isNestedProperty = level > 0
  const originalValue = getNestedValue(objects[0], path)
  const currentEditValue = getNestedValue(directEditValues, path)
  const isActuallyModified =
    JSON.stringify(originalValue) !== JSON.stringify(currentEditValue)

  return (
    <tr
      className={cn(
        'property-row',
        isNestedProperty && 'object-group',
        isObjectProperty && 'bg-muted/10'
      )}
    >
      <td className={cn('p-1 px-3 font-medium text-base')}>
        <div
          style={{ paddingLeft: `${level * 16}px` }}
          className="flex items-center"
        >
          {level > 0 && <span className="text-muted-foreground mr-2">└</span>}
          {config.label}
        </div>
      </td>
    
      {objects.map((obj, index) => {
        const cellValue = getNestedValue(obj, path)
        const isSelected = selectedValues[path]?.sourceIndex === index
        const mergedValue = getNestedValue(directEditValues, path)
        const shouldDim = !isSelected && mergedValue === cellValue
        let highlightItems: string[] = []

        if (!isSelected && config.type === 'multiselect' && Array.isArray(cellValue) && Array.isArray(mergedValue)) {
          highlightItems = cellValue.filter((item) => !mergedValue.includes(item))
        }


       
        return (
          <td
            key={index}
            className={cn(
              'p-0.5 cursor-pointer text-base',
              isObjectProperty && 'bg-muted/5'
            )}
            onClick={() =>
              handleSelectValue(path, cellValue, index)
            }
          >
            <div
              className={cn(
                'p-3 py-3 rounded-lg transition-all duration-200',
                isSelected && 'selected-cell bg-primary/10',
                shouldDim && 'opacity-30'
              )}
            >
              <CellContent
                value={cellValue}
                config={config}
                expandedRows={expandedRows}
                toggleRowExpansion={toggleRowExpansion}
                highlightItems={highlightItems}

              />
            </div>
          </td>
        )
      })}

      <td
        className={cn(
          'p-1',
          isModified && 'modified-value',
          isObjectProperty && 'bg-muted/5',
          isPinned && 'pinned-column z-10'
        )}
      >
        <EditableInput
          config={config}
          value={getNestedValue(directEditValues, path)}
          onValueChange={handleDirectEdit}
          openPopover={openPopover}
          togglePopover={togglePopover}
          isModified={isActuallyModified}
          originalValue={getNestedValue(objects[0], path)}
        />
      </td>
    </tr>
  )
})
