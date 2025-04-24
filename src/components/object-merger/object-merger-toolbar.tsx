'use client'

import { useState, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  X,
  RefreshCw,
  Pin,
  PinOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { ReviewPanel } from './review-panel'
import { type PropertyConfig } from '@/lib/object-merger-utils'

interface ObjectMergerToolbarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  allExpanded: boolean
  toggleAllExpansions: () => void
  isPinned: boolean
  togglePinned: () => void
  resetSelections: () => void
  isReviewOpen: boolean
  setIsReviewOpen: (isOpen: boolean) => void
  filteredConfigLength: number
  totalConfigLength: number
  processedConfig: PropertyConfig[]
  directEditValues: Record<string, any>
  expandedObjects: Record<string, boolean>
  toggleObjectExpansion: (path: string) => void
  handleMergeComplete: () => void
}

export function ObjectMergerToolbar({
  searchTerm,
  setSearchTerm,
  allExpanded,
  toggleAllExpansions,
  isPinned,
  togglePinned,
  resetSelections,
  isReviewOpen,
  setIsReviewOpen,
  filteredConfigLength,
  totalConfigLength,
  processedConfig,
  directEditValues,
  expandedObjects,
  toggleObjectExpansion,
  handleMergeComplete
}: ObjectMergerToolbarProps) {
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [setSearchTerm])

  return (
    <div className="mb-4 flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card rounded-lg shadow-md p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium hidden sm:inline-block">
            Compare & Merge
          </span>
        </div>{' '}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8 h-9"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="inline-flex bg-muted rounded-full p-0.5 gap-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePinned}
                    className={`flex items-center gap-1 rounded-full px-3 ${isPinned ? 'bg-background text-foreground' : ''}`}
                  >
                    {isPinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isPinned
                    ? 'Unpin final column'
                    : 'Pin final column to keep it visible when scrolling'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSelections}
                  className="flex items-center gap-1 h-9"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset all selections to default</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1 h-9">
                <Eye className="h-4 w-4" />
                <span>Review & Merge</span>
              </Button>
            </DialogTrigger>
            <ReviewPanel
              configuration={processedConfig}
              directEditValues={directEditValues}
              expandedObjects={expandedObjects}
              toggleObjectExpansion={toggleObjectExpansion}
              onClose={() => setIsReviewOpen(false)}
              onConfirm={handleMergeComplete}
            />
          </Dialog>
        </div>
      </div>
    </div>
  )
}
