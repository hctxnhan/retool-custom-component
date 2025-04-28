'use client'

import type React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Search,
  X,
  RefreshCw,
  Pin,
  PinOff
} from 'lucide-react'
import './object-merger.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { ObjectMergerToolbar } from './object-merger-toolbar'
import { PropertyRow } from './property-row'
import { ReviewPanel } from './review-panel'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  type PropertyConfig,
  getNestedValue,
  setNestedValue,
  processConfiguration,
  flattenConfiguration,
  unflattenObject
} from '@/lib/object-merger-utils'

interface ObjectMergerProps {
  objects: Record<string, any>[]
  configuration: PropertyConfig[]
  onMergeComplete?: (mergedObject: Record<string, any>) => void
}

export default function ObjectMerger({
  objects,
  configuration,
  onMergeComplete,
}: ObjectMergerProps) {
  // Process configuration once on mount or when configuration changes
  const [processedConfig, setProcessedConfig] = useState<PropertyConfig[]>([])
  const [flatConfig, setFlatConfig] = useState<PropertyConfig[]>([])
  const [filteredConfig, setFilteredConfig] = useState<PropertyConfig[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [allExpanded, setAllExpanded] = useState(true)
  const [isPinned, setIsPinned] = useState(true)

  // State
  const [selectedValues, setSelectedValues] = useState<Record<string, any>>({})
  const [directEditValues, setDirectEditValues] = useState<Record<string, any>>({})
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [expandedObjects, setExpandedObjects] = useState<Record<string, boolean>>({})
  const [openPopover, setOpenPopover] = useState<Record<string, boolean>>({})
  const [finalColumnWidth, setFinalColumnWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const [modifiedValues, setModifiedValues] = useState<Record<string, boolean>>({})
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)
  const initializedRef = useRef(false)
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null)
  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)

  // Process configuration only when it changes
  useEffect(() => {
    const processed = processConfiguration(configuration)
    const flattened = flattenConfiguration(processed)
    setProcessedConfig(processed)
    setFlatConfig(flattened)
    setFilteredConfig(flattened)
  }, [configuration])

  // Filter configuration based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConfig(flatConfig)
      return
    }

    const filtered = flatConfig.filter(
      (config) =>
        config.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.propertyKey.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredConfig(filtered)
  }, [searchTerm, flatConfig])

  // Initialize selected values
  useEffect(() => {
    if (objects.length === 0 || flatConfig.length === 0 || initializedRef.current) {
      return
    }

    const initialValues: Record<string, any> = {}
    const initialDirectValues: Record<string, any> = {}

    flatConfig.forEach((config) => {
      if (config.path) {
        const value = getNestedValue(objects[0], config.path)
        initialValues[config.path] = { value, sourceIndex: 0 }
        initialDirectValues[config.path] = value
      }
    })

    setSelectedValues(initialValues)
    setDirectEditValues(initialDirectValues)
    initializedRef.current = true
  }, [objects, flatConfig])

  // Reset initialization flag when objects change
  useEffect(() => {
    initializedRef.current = false
  }, [objects])

  // Handle mouse events for resizing
  useEffect(() => {
    if (!isResizing) return;
  
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      
      rafId.current = requestAnimationFrame(() => {
        const delta = e.clientX - resizeStartX.current;
        const newWidth = Math.max(150, resizeStartWidth.current - delta);  // Điều chỉnh theo hướng trái
  
        setFinalColumnWidth(newWidth);
      });
    };
  
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'auto';
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isResizing]);
  
  

  // Handle toolbar height for sticky header
  useEffect(() => {
    const setToolbarHeight = () => {
      const toolbar = document.querySelector('.object-merger-toolbar')
      if (toolbar) {
        const height = toolbar.getBoundingClientRect().height
        document.documentElement.style.setProperty(
          '--toolbar-height',
          `${height}px`
        )
      }
    }

    setToolbarHeight()
    window.addEventListener('resize', setToolbarHeight)
    return () => window.removeEventListener('resize', setToolbarHeight)
  }, [])

  // Start resizing
  
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Lưu vị trí bắt đầu từ điểm bên phải
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = finalColumnWidth;
  
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  }, [finalColumnWidth]);
  
  // Handle selecting a value for a specific property
  const handleSelectValue = useCallback(
    (path: string, value: any, sourceIndex: number) => {
      const valueCopy =
        typeof value === 'object' && value !== null
          ? JSON.parse(JSON.stringify(value))
          : value

      setSelectedValues((prev) => {
        const newValues = { ...prev }
        newValues[path] = { value: valueCopy, sourceIndex }

        const config = flatConfig.find((c) => c.path === path)
        if (config?.type === 'object' && config.properties) {
          flatConfig.forEach((nestedConfig) => {
            if (
              nestedConfig.path &&
              nestedConfig.path !== path &&
              nestedConfig.path.startsWith(`${path}.`)
            ) {
              const nestedValue = getNestedValue(
                objects[sourceIndex],
                nestedConfig.path
              )
              const nestedValueCopy =
                typeof nestedValue === 'object' && nestedValue !== null
                  ? JSON.parse(JSON.stringify(nestedValue))
                  : nestedValue

              newValues[nestedConfig.path] = {
                value: nestedValueCopy,
                sourceIndex
              }
            }
          })
        }

        return newValues
      })

      setDirectEditValues((prev) => {
        let newValues = setNestedValue({ ...prev }, path, valueCopy)
        const config = flatConfig.find((c) => c.path === path)
        if (config?.type === 'object' && config.properties) {
          flatConfig.forEach((nestedConfig) => {
            if (
              nestedConfig.path &&
              nestedConfig.path !== path &&
              nestedConfig.path.startsWith(`${path}.`)
            ) {
              const nestedValue = getNestedValue(
                objects[sourceIndex],
                nestedConfig.path
              )
              const nestedValueCopy =
                typeof nestedValue === 'object' && nestedValue !== null
                  ? JSON.parse(JSON.stringify(nestedValue))
                  : nestedValue

              newValues = setNestedValue(
                newValues,
                nestedConfig.path,
                nestedValueCopy
              )
            }
          })
        }

        return newValues
      })

      setModifiedValues((prev) => ({
        ...prev,
        [path]: true
      }))
    },
    [flatConfig, objects]
  )

  // Handle selecting all values from a specific object
  const handleSelectColumn = useCallback(
    (sourceIndex: number) => {
      if (flatConfig.length === 0) return

      const newValues: Record<string, any> = {}
      let newDirectValues = { ...directEditValues }
      const newModifiedValues: Record<string, boolean> = {}

      flatConfig.forEach((config) => {
        if (config.path) {
          const value = getNestedValue(objects[sourceIndex], config.path)
          const valueCopy =
            typeof value === 'object' && value !== null
              ? JSON.parse(JSON.stringify(value))
              : value

          newValues[config.path] = { value: valueCopy, sourceIndex }
          newDirectValues = setNestedValue(newDirectValues, config.path, valueCopy)
          newModifiedValues[config.path] = true
        }
      })

      setSelectedValues(newValues)
      setDirectEditValues(newDirectValues)
      setModifiedValues(newModifiedValues)
    },
    [flatConfig, objects, directEditValues]
  )

  // Handle direct edit of a value
  const handleDirectEdit = useCallback((path: string, value: any) => {
    const valueCopy =
      typeof value === 'object' && value !== null
        ? JSON.parse(JSON.stringify(value))
        : value

    setDirectEditValues((prev) => setNestedValue({ ...prev }, path, valueCopy))
    setSelectedValues((prev) => ({
      ...prev,
      [path]: { value: valueCopy, sourceIndex: -1 }
    }))
    setModifiedValues((prev) => ({ ...prev, [path]: true }))
  }, [])

  // Toggle row expansion for multiline content
  const toggleRowExpansion = useCallback((propertyKey: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [propertyKey]: !prev[propertyKey]
    }))
  }, [])

  // Toggle object expansion in review panel
  const toggleObjectExpansion = useCallback((path: string) => {
    setExpandedObjects((prev) => ({
      ...prev,
      [path]: !prev[path]
    }))
  }, [])

  // Toggle popover state
  const togglePopover = useCallback((propertyKey: string, state?: boolean) => {
    setOpenPopover((prev) => ({
      ...prev,
      [propertyKey]: state !== undefined ? state : !prev[propertyKey]
    }))
  }, [])

  // Handle completing the merge
  const handleMergeComplete = useCallback(() => {
    if (onMergeComplete) {
      const unflattenedResult = unflattenObject(directEditValues)
      onMergeComplete(unflattenedResult)
    }
    setIsReviewOpen(false)
  }, [directEditValues, onMergeComplete])

  // Toggle all object expansions
  const toggleAllExpansions = useCallback(() => {
    const newState = !allExpanded
    setAllExpanded(newState)

    const newExpandedObjects: Record<string, boolean> = {}
    flatConfig.forEach((config) => {
      if (config.type === 'object' && config.path) {
        newExpandedObjects[config.path] = newState
      }
    })

    setExpandedObjects(newExpandedObjects)
  }, [allExpanded, flatConfig])

  // Reset all selections
  const resetSelections = useCallback(() => {
    if (objects.length === 0 || flatConfig.length === 0) return

    const initialValues: Record<string, any> = {}
    const initialDirectValues: Record<string, any> = {}

    flatConfig.forEach((config) => {
      if (config.path) {
        const value = getNestedValue(objects[0], config.path)
        initialValues[config.path] = { value, sourceIndex: 0 }
        initialDirectValues[config.path] = value
      }
    })

    setSelectedValues(initialValues)
    setDirectEditValues(initialDirectValues)
    setModifiedValues({})
  }, [objects, flatConfig])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  // Toggle pin state for final column
  const togglePinned = useCallback(() => {
    setIsPinned((prev) => !prev)
  }, [])

  if (objects.length === 0) {
    return <div className="text-center p-4">No objects provided for comparison</div>
  }

  if (flatConfig.length === 0) {
    return <div className="text-center p-4">Loading...</div>
  }

  return (
    <div className="w-full">
      <div className="object-merger-toolbar">
        <ObjectMergerToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          allExpanded={allExpanded}
          toggleAllExpansions={toggleAllExpansions}
          isPinned={isPinned}
          togglePinned={togglePinned}
          resetSelections={resetSelections}
          isReviewOpen={isReviewOpen}
          setIsReviewOpen={setIsReviewOpen}
          filteredConfigLength={filteredConfig.length}
          totalConfigLength={flatConfig.length}
          processedConfig={processedConfig}
          directEditValues={directEditValues}
          expandedObjects={expandedObjects}
          toggleObjectExpansion={toggleObjectExpansion}
          handleMergeComplete={handleMergeComplete}
        />
      </div>

      <div ref={tableWrapperRef} className="table-wrapper">
        <table className="w-full border-collapse">
          <colgroup>
            <col className="min-width-column" style={{ width: '250px' }} />
            {objects.map((_, i) => (
              <col key={i} className="min-width-column" style={{ width: '250px' }} />
            ))}
            <col
              className="min-width-column"
              style={{ width: `${finalColumnWidth}px` }}
              data-testid="final-column"
            />
          </colgroup>
          <thead ref={tableHeaderRef} className="bg-muted/50">
            <tr>
              <th className="p-2 text-left font-medium border-b sticky left-0 bg-muted/50 z-10">
                <div className="flex items-center gap-2">
                  <span>Property</span>
                  {filteredConfig.length !== flatConfig.length && (
                    <span className="text-xs text-muted-foreground">
                      {filteredConfig.length} of {flatConfig.length}
                    </span>
                  )}
                </div>
              </th>
              {objects.map((_, index) => (
                <th key={index} className="p-2 text-center font-medium border-b">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="object-count-badge">{index + 1}</div>
                      <span className="text-sm">Source Object</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectColumn(index)}
                      className="text-xs py-0.5 h-7 hover:bg-primary/10 hover:text-primary"
                    >
                      Select All Values
                    </Button>
                  </div>
                </th>
              ))}
              <th
                className={`p-2 text-center font-medium border-b relative ${isPinned ? 'pinned-column' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div
                    className="absolute left-0 top-0 bottom-0 column-resizer flex items-center justify-center"
                    onMouseDown={startResize}
                    data-testid="resizer-final"
                  >
                    <div className="h-full w-4 flex items-center justify-center">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <span className="flex-grow text-center font-medium">
                    <div className="flex flex-col items-center">
                      <span className="text-sm">Merged Result</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Edit or select values
                      </span>
                    </div>
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/10">
            {filteredConfig.length === 0 ? (
              <tr>
                <td
                  colSpan={objects.length + 2}
                  className="p-8 text-center text-muted-foreground"
                >
                  No properties match your search. Try adjusting your search term.
                </td>
              </tr>
            ) : (
              filteredConfig.map((config) => (
                <PropertyRow
                  key={config.path || config.propertyKey}
                  config={config}
                  objects={objects}
                  selectedValues={selectedValues}
                  expandedRows={expandedRows}
                  openPopover={openPopover}
                  toggleRowExpansion={toggleRowExpansion}
                  togglePopover={togglePopover}
                  handleSelectValue={handleSelectValue}
                  handleDirectEdit={handleDirectEdit}
                  directEditValues={directEditValues}
                  isModified={!!modifiedValues[config.path || config.propertyKey]}
                  allExpanded={allExpanded}
                  isPinned={isPinned}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground px-1">
        <div>
          {Object.keys(modifiedValues).length > 0 ? (
            <span>{Object.keys(modifiedValues).length} properties modified</span>
          ) : (
            <span>No changes made yet</span>
          )}
        </div>
        <div>
          {isPinned && (
            <span className="flex items-center gap-1">
              <Pin className="h-3 w-3" /> Final column pinned
            </span>
          )}
        </div>
      </div>
    </div>
  )
}