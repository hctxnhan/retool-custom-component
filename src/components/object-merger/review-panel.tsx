'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PropertyConfig } from '@/lib/object-merger-utils'
import { Code2, Eye } from 'lucide-react'
import React, { memo } from 'react'
import { PropertyReview } from './property-review'
import { unflattenObject } from '@/lib/object-merger-utils'

interface ReviewPanelProps {
  configuration: PropertyConfig[]
  directEditValues: Record<string, unknown>
  expandedObjects: Record<string, boolean>
  toggleObjectExpansion: (path: string) => void
  onClose: () => void
  onConfirm: () => void
}

export const ReviewPanel = memo(function ReviewPanel({
  configuration,
  directEditValues,
  expandedObjects,
  toggleObjectExpansion,
  onClose,
  onConfirm
}: ReviewPanelProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const jsonString = JSON.stringify(unflattenObject(directEditValues), null, 2)

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleConfirm()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[800px] flex flex-col gap-2 overflow-hidden">
      <Tabs defaultValue="visual" className="flex-1 flex flex-col">
        <DialogHeader className="flex-shrink-0 space-y-0.5">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">
              Review Changes
            </DialogTitle>
            <TabsList className="h-8 bg-muted/50">
              <TabsTrigger
                value="visual"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1 text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                Visual
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1 text-xs"
              >
                <Code2 className="h-3.5 w-3.5" />
                JSON
              </TabsTrigger>
            </TabsList>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Review and confirm your merged object changes
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive px-2.5 py-1 rounded-md text-sm flex-shrink-0">
            {error}
          </div>
        )}
        <TabsContent
          value="visual"
          className="flex-1 mt-2 data-[state=active]:flex flex-col"
        >
          <Card className="flex-1 overflow-hidden border-muted/50 py-0">
            <ScrollArea className="h-[60vh]">
              <CardContent className="p-3 space-y-1.5">
                {configuration.map((config) => (
                  <PropertyReview
                    key={config.path || config.propertyKey}
                    config={config}
                    directEditValues={directEditValues}
                    expandedObjects={expandedObjects}
                    toggleObjectExpansion={toggleObjectExpansion}
                  />
                ))}
              </CardContent>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent
          value="code"
          className="flex-1 mt-2 data-[state=active]:flex flex-col"
        >
          <Card className="flex-1 overflow-hidden border-muted/50 p-0">
            <ScrollArea className="h-[60vh]">
              <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto whitespace-pre-wrap">
                <code>{jsonString}</code>
              </pre>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-1.5 border-t border-muted/30">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          size="sm"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          className="min-w-[100px] transition-all duration-200"
          disabled={isLoading}
          size="sm"
        >
          <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
            Confirm
          </span>
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
          )}
        </Button>
      </div>
    </DialogContent>
  )
})
