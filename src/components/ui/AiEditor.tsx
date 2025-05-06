import React, { useEffect, useRef, useState } from 'react'
import Quill, { RangeStatic } from 'quill'
import 'quill/dist/quill.snow.css'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal
} from './dropdown-menu'

interface AiEditorProps {
  // content: string
  onProcess: (data: {
    selectedContent: string
    selectedIndex: number
    promptContent: string
  }) => void
  content?: string
  setContent: (newValue: string) => void
  setSelectedTextPosition?: (position: { top: number; left: number }) => void
  aiResult?: string
  onTypeChange?: (type: string) => void
  lastMessage?: string
  setLastMessage?: (message: string) => void
  messageHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  setMessageHistory?: (
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => void
  onContentChange?: (content: string) => void
}

const configOptions: Record<string, string[]> = {
  Rewrite: [
    'Make longer',
    'Make shorter',
    'Simplify language',
    'Add details',
    'Summarize',
    'Make more persuasive',
    'Make more descriptive'
  ],
  Translate: [
    'English',
    'French',
    'German',
    'Hindi',
    'Spanish',
    'Japanese',
    'Chinese',
    'Korean',
    'Vietnamese'
  ],
  Tone: [
    'Professional',
    'Funny',
    'Friendly',
    'Casual',
    'Formal',
    'Sarcastic',
    'Encouraging',
    'Empathetic'
  ],
  'Ask AI': []
}

const AiEditor: React.FC<AiEditorProps> = ({
  content,
  onProcess,
  aiResult,
  onTypeChange,
  onContentChange,
  setContent,
  setSelectedTextPosition
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)

  const [selectedText, setSelectedText] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  const [selectionRange, setSelectionRange] = useState<RangeStatic | null>(null)

  const [showPromptOptions, setShowPromptOptions] = useState(false)
  const [showAIResult, setShowAIResult] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>(
    'bottom'
  )
  const [toolbarDirection, setToolbarDirection] = useState<'top' | 'bottom'>(
    'top'
  )

  const toolbarRef = useRef<HTMLDivElement | null>(null)

  const updateToolbarPosition = (selectionRect: DOMRect) => {
    const padding = 8
    const win = editorRef.current?.ownerDocument?.defaultView || window
    const viewportHeight = win.innerHeight
    const viewportWidth = win.innerWidth
    const toolbarHeight = toolbarRef.current?.offsetHeight || 250
    const toolbarWidth = toolbarRef.current?.offsetWidth || 300
    if (selectionRect.top > 0 && selectionRect.top < viewportHeight) {
      const spaceBelow = viewportHeight - selectionRect.bottom
      const spaceAbove = selectionRect.top

      const showAbove =
        spaceBelow < toolbarHeight + padding &&
        spaceAbove >= toolbarHeight + padding

      let top = showAbove
        ? selectionRect.top - toolbarHeight - padding
        : selectionRect.bottom + padding

      let left = selectionRect.left + selectionRect.width / 2 - toolbarWidth / 2

      const maxLeft = viewportWidth - toolbarWidth - padding
      const minLeft = padding
      left = Math.max(minLeft, Math.min(left, maxLeft))

      const maxTop = viewportHeight - toolbarHeight - padding
      const minTop = padding
      top = Math.max(minTop, Math.min(top, maxTop))
      // console.log('Toolbar:', top)

      // console.log('ToolbarPosition set to:', { top, left })

      setToolbarPosition({ top, left })
      setToolbarDirection(showAbove ? 'top' : 'bottom')
      setDropdownPosition(showAbove ? 'top' : 'bottom')
    } else {
      setToolbarPosition(null)
    }
  }

  // Function to update selection rectangle based on current selection and editor position
  const updateSelectionRectangle = () => {
    if (!quillRef.current || !editorRef.current) return

    const selection = quillRef.current.getSelection()
    if (!selection || selection.length === 0) return

    const bounds = quillRef.current.getBounds(selection.index, selection.length)

    const editorContainer = editorRef.current
      .querySelector('.ql-editor')
      ?.getBoundingClientRect()
    if (!editorContainer) return

    const top = bounds.top + editorContainer.top
    const left = bounds.left + editorContainer.left

    const rect: DOMRect = {
      top,
      bottom: top + bounds.height,
      left,
      right: left + bounds.width,
      width: bounds.width,
      height: bounds.height,
      x: left,
      y: top,
      toJSON: () => {}
    } as DOMRect

    console.log('updateSelectionRectangle rect:', rect)
    updateToolbarPosition(rect)
  }

  useEffect(() => {
    const handleViewportChange = () => {
      updateSelectionRectangle()
    }

    window.addEventListener('scroll', handleViewportChange)
    window.addEventListener('resize', handleViewportChange)

    return () => {
      window.removeEventListener('scroll', handleViewportChange)
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [])

  useEffect(() => {
    if (selectedText && selectedType === 'Ask AI') {
      setContent(selectedText)
      if (quillRef.current) {
        const selection = quillRef.current.getSelection()
        if (selection && selection.index !== null && selection.length > 0) {
          const bounds = quillRef.current.getBounds(
            selection.index,
            selection.length
          )
          console.log('Bounds:', bounds)
        }
      }
    }
  }, [selectedText, selectedType])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    updateSelectionRectangle()
    setShowPromptOptions(true)
  }

  //new fix
  useEffect(() => {
    if (selectedText && selectedType === 'Ask AI') {
      const handleSelectionChange = () => {
        if (!quillRef.current || !setSelectedTextPosition) return

        const selection = quillRef.current.getSelection()
        console.log('Selection:', selection)

        if (selection && selection.index !== null && selection.length > 0) {
          const bounds = quillRef.current.getBounds(selection.index)
          console.log('Bounds:', bounds)

          const editorElement = editorRef.current
          console.log('kkk', editorElement)
          if (editorElement) {
            const rect = editorElement.getBoundingClientRect()
            const position = {
              top: rect.top + bounds.top + window.scrollY,
              left: rect.left + bounds.left + window.scrollX
            }
            console.log('hihi', position)
            setSelectedTextPosition(position)
          }
        }
      }

      const quill = quillRef.current
      if (quill) {
        quill.on('selection-change', handleSelectionChange)
      }

      return () => {
        const quill = quillRef.current
        if (quill) {
          console.log('Cleaning up event listener')
          quill.off('selection-change', handleSelectionChange)
        }
      }
    }
  }, [selectedText, selectedType, setSelectedTextPosition, selectionRange])

  useEffect(() => {
    const handleMouseUp = () => {
      if (!quillRef.current || !setSelectedTextPosition) return
      const selection = quillRef.current.getSelection()
      if (selection && selection.length > 0) {
        const bounds = quillRef.current.getBounds(selection.index)
        const editorElement = editorRef.current
        if (editorElement) {
          const rect = editorElement.getBoundingClientRect()
          const position = {
            top: rect.top + bounds.top + window.scrollY,
            left: rect.left + bounds.left + window.scrollX
          }
          setSelectedTextPosition(position)
        }
      }
    }

    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setSelectedTextPosition])

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection)
    return () => {
      document.removeEventListener('mouseup', handleTextSelection)
    }
  }, [])

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow'
      })
      const quillToolbar = document.querySelector('.ql-toolbar')
      if (quillToolbar) {
        quillToolbar.classList.add(
          'fixed',
          'top-0',
          'left-0',
          'w-full',
          'z-50',
          'bg-white'
        )
      }
      quillRef.current.setText(content ? content : '')

      quillRef.current.on('text-change', () => {
        const updatedContent = quillRef.current!.getText()
        if (onContentChange) {
          onContentChange(updatedContent)
        }
      })

      quillRef.current.on('selection-change', (range) => {
        if (range && range.length > 0) {
          const selected = quillRef.current!.getText(range.index, range.length)
          setSelectedText(selected.trim())
          setSelectedIndex(range.index)
          setShowPromptOptions(true)
          setSelectionRange(range)
          const bounds = quillRef.current!.getBounds(range.index, range.length)
          const editorContainer = editorRef.current!.getBoundingClientRect()

          const selectionRect = {
            top: bounds.top + editorContainer.top + window.scrollY,
            bottom: bounds.bottom + editorContainer.top + window.scrollY,
            left: bounds.left + editorContainer.left + window.scrollX,
            right: bounds.right + editorContainer.left + window.scrollX,
            width: bounds.width,
            height: bounds.height,
            x: bounds.left + editorContainer.left + window.scrollX,
            y: bounds.top + editorContainer.top + window.scrollY,
            toJSON: () => {}
          } as DOMRect
          updateToolbarPosition(selectionRect)
        } else if (selectedType === 'Ask AI') {
          setShowPromptOptions(false)
          setSelectedText('')
          setSelectedPrompt('')
          setSelectedType('')
        } else if (range && range.length === 0) {
          setShowPromptOptions(false)
          setSelectedPrompt('')
          setSelectedText('')
          setSelectedType('')
        }
      })
    }
  }, [content, selectedType, selectedText, selectionRange])

  // Listen for aiResult changes
  useEffect(() => {
    if (aiResult && selectedText) {
      console.log('[aiResult received]', { aiResult, selectedText })
      setIsLoading(false)
      setShowAIResult(true)
      setSelectedPrompt('')
    }
  }, [aiResult])

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setShowPromptOptions(true)

    // Store the current selection before any state updates
    const currentSelection = quillRef.current?.getSelection()
    if (quillRef.current && currentSelection) {
      // Use requestAnimationFrame to ensure selection is restored after state updates
      requestAnimationFrame(() => {
        quillRef.current?.setSelection(
          currentSelection.index,
          currentSelection.length
        )
      })
    }

    if (onTypeChange) {
      onTypeChange(type)
    }
  }

  const handlePromptSelect = (prompt: string) => {
    if (previousSelectionRangeRef.current && quillRef.current) {
      setIsLoading(true)
      const { index, length } = previousSelectionRangeRef.current
      quillRef.current.formatText(index, length, { background: '' })
      previousSelectionRangeRef.current = null
    }

    const promptContent = `${selectedType}: ${prompt}`
    setSelectedPrompt(prompt)

    console.log('[handlePromptSelect]', {
      selectedType,
      prompt,
      promptContent
    })

    if (selectedType === 'Ask AI') {
      setIsLoading(false)
      setShowPromptOptions(false)
    } else {
      setIsLoading(true)
    }

    if (quillRef.current && selectionRange) {
      quillRef.current.setSelection(selectionRange.index, selectionRange.length)
    }

    onProcess({
      selectedContent: selectedText,
      selectedIndex,
      promptContent
    })

    setShowAIResult(false)
  }

  const handleConfirm = () => {
    if (quillRef.current && aiResult) {
      quillRef.current.deleteText(selectedIndex, selectedText.length)
      quillRef.current.insertText(selectedIndex, aiResult)
    }
    setShowAIResult(false)
    setSelectedText('')
    setSelectedType('')
    setSelectedPrompt('')
    setShowPromptOptions(false)
  }

  const handleReject = () => {
    setShowAIResult(false)
    setIsDropdownOpen(false)
  }

  const handleRegenerate = () => {
    const promptContent = `${selectedType}: ${selectedPrompt}`
    if (selectedType === 'Ask AI') {
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
    onProcess({
      selectedContent: selectedText,
      selectedIndex,
      promptContent
    })
    setShowAIResult(false)
  }

  useEffect(() => {
    if (selectedType === 'Ask AI') {
      setIsLoading(false)
    }
  }, [selectedType])

  const previousSelectionRangeRef = useRef<RangeStatic | null>(null)

  useEffect(() => {
    if (!quillRef.current) return

    const quill = quillRef.current

    if (content === '' && previousSelectionRangeRef.current) {
      const { index, length } = previousSelectionRangeRef.current
      quill.formatText(index, length, { background: '' })
      previousSelectionRangeRef.current = null
      return
    }

    if (selectionRange && selectedType === 'Ask AI') {
      quill.formatText(selectionRange.index, selectionRange.length, {
        background: '#FFEB3B'
      })
      previousSelectionRangeRef.current = selectionRange
    }
  }, [selectionRange, selectedType])

  // console.log('render toolbar', toolbarPosition)

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="space-y-6 w-full h-full p-4">
        <div
          ref={editorRef}
          className="w-full flex-1 min-h-[calc(100vh-100px)] !mt-5 rounded-xl bg-white p-4 ql-container ql-snow !border-none !important"
        />

        {showPromptOptions && !showAIResult && toolbarPosition && (
          <div
            ref={toolbarRef}
            className="fixed z-50 bg-white border rounded-xl shadow-xl"
            style={{
              top: `${toolbarPosition.top}px`,
              left: `${toolbarPosition.left}px`,
              maxHeight: isDropdownOpen ? '600px' : '160px',
              overflow: 'hidden'
            }}
          >
            <div className="relative">
              <div className="p-2 w-max min-w-[320px] max-w-[520px] !min-h-[50px] !max-h-[50px] bg-white border !border-primary rounded-md shadow-sm font-sans text-sm">
                {/* Type and prompt options */}
                <div className="flex items-center flex-wrap gap-1 text-gray-600">
                  {['Rewrite', 'Translate', 'Tone', 'Ask AI'].map(
                    (type, index, array) => (
                      <DropdownMenu
                        key={type}
                        onOpenChange={(open) => setIsDropdownOpen(open)}
                      >
                        <DropdownMenuTrigger
                          asChild
                          onMouseDown={(e) => {
                            if (isLoading) {
                              e.preventDefault()
                              return
                            }
                            handleTypeSelect(type)
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors duration-200 ${
                                selectedType === type
                                  ? 'bg-blue-100 text-blue-600 font-medium'
                                  : 'hover:bg-gray-100 cursor-pointer'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => {
                                if (!isLoading) handleTypeSelect(type)
                              }}
                            >
                              {/* Icon type */}
                              {type === 'Rewrite' && (
                                <svg
                                  aria-hidden="true"
                                  role="graphics-symbol"
                                  viewBox="0 0 20 20"
                                  className="magicWand"
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    display: 'block',
                                    fill: 'rgb(144, 101, 176)',
                                    flexShrink: 0,
                                    marginRight: '6px'
                                  }}
                                >
                                  <path d="M10.55 3a.55.55 0 0 0-1.1 0v2a.55.55 0 0 0 1.1 0zM8.47 8.47a.75.75 0 0 1 1.06 0l.897.896-1.06 1.06-.897-.896a.75.75 0 0 1 0-1.06m1.603 2.664 6.647 6.646a.75.75 0 1 0 1.06-1.06l-6.646-6.647zM10.55 15a.55.55 0 0 0-1.1 0v2a.55.55 0 0 0 1.1 0zm-3.697-1.853a.55.55 0 0 1 0 .777L5.44 15.34a.55.55 0 1 1-.778-.778l1.415-1.415a.55.55 0 0 1 .777 0m8.485-8.486a.55.55 0 0 1 0 .778l-1.415 1.414a.55.55 0 1 1-.777-.777L14.56 4.66a.55.55 0 0 1 .777 0M5.55 10a.55.55 0 0 1-.55.55H3a.55.55 0 1 1 0-1.1h2a.55.55 0 0 1 .55.55m12 0a.55.55 0 0 1-.55.55h-2a.55.55 0 1 1 0-1.1h2a.55.55 0 0 1 .55.55M6.853 6.853a.55.55 0 0 1-.778 0L4.661 5.44a.55.55 0 1 1 .778-.778l1.414 1.415a.55.55 0 0 1 0 .777" />
                                </svg>
                              )}
                              {type === 'Translate' && (
                                <svg
                                  aria-hidden="true"
                                  role="graphics-symbol"
                                  viewBox="0 0 20 20"
                                  className="textTranslate"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'block',
                                    fill: 'rgb(68, 131, 97)',
                                    flexShrink: 0
                                  }}
                                >
                                  <path d="M14.776 5.217a.625.625 0 1 0-1.25 0v.967H9.524a.625.625 0 1 0 0 1.25h6.688c-.32.87-.963 2.091-2.06 3.375a12.8 12.8 0 0 1-1.48-2.122.625.625 0 1 0-1.095.603c.415.754.978 1.589 1.717 2.438a16.3 16.3 0 0 1-3.341 2.512.625.625 0 0 0 .62 1.085 17.6 17.6 0 0 0 3.58-2.688 17.6 17.6 0 0 0 3.577 2.688.625.625 0 1 0 .622-1.085 16.3 16.3 0 0 1-3.342-2.512c1.42-1.632 2.196-3.216 2.52-4.294h1.251a.625.625 0 1 0 0-1.25h-4.005zm-8.014 7.16.958 2.62a.625.625 0 0 0 1.174-.43L5.645 5.683a.94.94 0 0 0-1.765 0L.632 14.568a.625.625 0 1 0 1.174.43l.958-2.621zm-.457-1.25H3.221l1.542-4.219z" />
                                </svg>
                              )}
                              {type === 'Tone' && (
                                <svg
                                  aria-hidden="true"
                                  role="graphics-symbol"
                                  viewBox="0 0 20 20"
                                  className="quill"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'block',
                                    fill: 'rgb(144, 101, 176)',
                                    flexShrink: 0
                                  }}
                                >
                                  <path d="M2.865 17.61q.068.015.135.015a.626.626 0 0 0 .61-.49c.025-.11 2.474-10.663 11.95-12.82a15.2 15.2 0 0 1-1.617 3.008l-1.996-.087a.6.6 0 0 0-.491.206.63.63 0 0 0-.154.51l.294 1.984a12.8 12.8 0 0 1-4.218 2.424.624.624 0 1 0 .405 1.182 14 14 0 0 0 4.9-2.9.63.63 0 0 0 .199-.555l-.233-1.57 1.58.07a.59.59 0 0 0 .533-.258c1.682-2.316 2.276-4.422 2.334-4.644a.64.64 0 0 0-.126-.586.64.64 0 0 0-.582-.214C5.209 4.633 2.416 16.743 2.39 16.865a.626.626 0 0 0 .475.745M6 17.625h10a.626.626 0 0 0 0-1.25H6a.625.625 0 0 0 0 1.25" />
                                </svg>
                              )}
                              {type === 'Ask AI' && (
                                <img
                                  src="  https://www.notion.so/_assets/edfba4a6d1ff7acd.png"
                                  role="presentation"
                                  alt="Notion AI Face"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    border: '1px solid rgb(233, 233, 231)'
                                  }}
                                />
                              )}
                              {type}
                            </span>
                            {index !== array.length - 1 && (
                              <span className="text-gray-300 select-none">
                                |
                              </span>
                            )}
                          </div>
                        </DropdownMenuTrigger>

                        {/* Prompt Dropdown */}
                        {selectedType === type && type !== 'Ask AI' && (
                          <DropdownMenuPortal>
                            <DropdownMenuContent
                              className="max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-md rounded-md"
                              side={dropdownPosition}
                              align="start"
                              sideOffset={12}
                              alignOffset={-4}
                              avoidCollisions
                              collisionPadding={24}
                              sticky="always"
                              onEscapeKeyDown={(e) => e.stopPropagation()}
                              style={{
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto'
                              }}
                              onCloseAutoFocus={(e) => {
                                e.preventDefault()
                                setIsDropdownOpen(false)
                                if (quillRef.current && selectionRange) {
                                  quillRef.current.setSelection(selectionRange)
                                }
                              }}
                            >
                              <div className="flex flex-col space-y-0.5 py-1">
                                {configOptions[type].map((prompt) => {
                                  const isActive = selectedPrompt === prompt
                                  return (
                                    <DropdownMenuItem
                                      key={prompt}
                                      onClick={() => {
                                        if (!isLoading)
                                          handlePromptSelect(prompt)
                                      }}
                                      disabled={
                                        isLoading &&
                                        (selectedPrompt !== prompt ||
                                          selectedType !== type)
                                      }
                                      className={`rounded-sm px-2 py-1.5 text-sm cursor-pointer ${
                                        selectedPrompt === prompt
                                          ? 'bg-blue-50 text-blue-600'
                                          : ''
                                      } ${
                                        isLoading &&
                                        (selectedPrompt !== prompt ||
                                          selectedType !== type)
                                          ? 'opacity-50 cursor-not-allowed'
                                          : ''
                                      }`}
                                    >
                                      {isLoading &&
                                      isActive &&
                                      selectedType !== 'Ask AI'
                                        ? `${prompt} (Thinking...)`
                                        : prompt}
                                    </DropdownMenuItem>
                                  )
                                })}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenuPortal>
                        )}
                      </DropdownMenu>
                    )
                  )}
                </div>

                {/* Loading + Selected Prompt */}
                {selectedType && selectedType !== 'Ask AI' && (
                  <div className="mt-4 space-y-2">
                    {isLoading && (
                      <div className="flex items-center gap-2 mt-3 text-gray-500">
                        <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin" />
                        <span className="text-sm">
                          Generating suggestion...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center rounded-md">
                  <div className="w-5 h-5 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}

        {showAIResult && toolbarPosition && (
          <div
            className="absolute z-50"
            style={{
              top: `${toolbarPosition.top + 50}px`,
              left: `${toolbarPosition.left}px`
            }}
          >
            {/* Arrow tip pointing upward */}
            <div className="flex justify-center relative">
              <div className="w-2.5 h-2.5 bg-white rotate-45 border-t border-l border-primary absolute -top-1.5 z-[-1]" />
            </div>

            {/* AI Suggestion content box */}
            <div className="p-2 bg-white rounded-md shadow-sm min-w-[360px] max-w-[800px] space-y-2 text-sm border border-primary">
              <div className="font-medium text-gray-900">AI Suggestion</div>

              {isLoading && selectedType !== 'Ask AI' ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 border-2 border-t-black border-gray-300 rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="p-2 bg-gray-50 text-gray-800 rounded border border-gray-200 break-words">
                  {aiResult}
                </div>
              )}

              {!isLoading && selectedType !== 'Ask AI' && (
                <div className="flex items-center justify-center gap-3 pt-1 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-800 hover:bg-gray-100 px-2 py-1"
                    onClick={handleConfirm}
                  >
                    Accept
                  </Button>
                  <span className="text-gray-400">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-gray-100 px-2 py-1"
                    onClick={handleReject}
                  >
                    Discard
                  </Button>
                  <span className="text-gray-400">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-800 hover:bg-gray-100 px-2 py-1"
                    onClick={handleRegenerate}
                  >
                    Try again
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AiEditor