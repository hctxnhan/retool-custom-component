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
    const toolbarHeight = toolbarRef.current?.offsetHeight || 100
    const toolbarWidth = toolbarRef.current?.offsetWidth || 300
    const dropdownHeight = 200 // Estimated max height of dropdown
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Calculate if we're near the bottom of the viewport
    const isNearBottom =
      selectionRect.bottom + toolbarHeight + dropdownHeight + padding >
      viewportHeight
    const isNearTop =
      selectionRect.top - toolbarHeight - dropdownHeight - padding < 0

    // Determine the best position for the toolbar
    let top = selectionRect.bottom + padding
    let left = selectionRect.left + selectionRect.width / 2 - toolbarWidth / 2

    // If near bottom, position above the selection
    if (isNearBottom) {
      top = selectionRect.top - toolbarHeight - padding
    }

    // If near top, position below the selection
    if (isNearTop) {
      top = selectionRect.bottom + padding
    }

    // Ensure the toolbar stays within viewport horizontally
    const maxLeft = viewportWidth - toolbarWidth - padding
    const minLeft = padding
    left = Math.max(minLeft, Math.min(left, maxLeft))

    // Ensure the toolbar stays within viewport vertically
    const maxTop = viewportHeight - toolbarHeight - padding
    const minTop = padding
    top = Math.max(minTop, Math.min(top, maxTop))

    setToolbarPosition({ top, left })
    setToolbarDirection(isNearBottom ? 'top' : 'bottom')
    setDropdownPosition(isNearBottom ? 'top' : 'bottom')

    if (toolbarRef.current) {
      toolbarRef.current.style.position = 'fixed'
      toolbarRef.current.style.top = `${top}px`
      toolbarRef.current.style.left = `${left}px`
      toolbarRef.current.style.visibility = 'visible'
    }
  }

  // Function to update selection rectangle based on current selection and editor position
  const updateSelectionRectangle = () => {
    if (selectionRange && quillRef.current && editorRef.current) {
      if (selectionRange.length === 0) {
        console.log('No text selected. Skipping toolbar position update.');
        return;
      }
  
      const bounds = quillRef.current.getBounds(
        selectionRange.index,
        selectionRange.length
      )
      const editorContainer = editorRef.current.getBoundingClientRect()
      const updatedSelectionRect = {
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
  
      updateToolbarPosition(updatedSelectionRect)
    }
  }  

  useEffect(() => {
    if (selectedText && selectedType === 'Ask AI') {
      setContent(selectedText);
      if (quillRef.current) {
        const selection = quillRef.current.getSelection();
        if (selection && selection.index !== null && selection.length > 0) {
          const bounds = quillRef.current.getBounds(selection.index, selection.length);
          console.log('Bounds:', bounds); 
        }
      }
    }
  }, [selectedText, selectedType]);
  

  // Handle viewport changes (scroll or resize)
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
  }, [selectionRange, selectedText])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    updateToolbarPosition(rect)
    setShowPromptOptions(true)
  }
  
  //new fix
  useEffect(() => {
    if (selectedText && selectedType === 'Ask AI') {
      const handleSelectionChange = () => {
        console.log('Selection change event triggered');
        if (!quillRef.current || !setSelectedTextPosition) return;
  
        const selection = quillRef.current.getSelection();
        console.log('Selection:', selection);
  
        if (selection && selection.index !== null && selection.length > 0) {
          const bounds = quillRef.current.getBounds(selection.index);
          console.log('Bounds:', bounds);
          
          const editorElement = editorRef.current;
          console.log("kkk", editorElement);
          if (editorElement) {
            const rect = editorElement.getBoundingClientRect();
            const position = {
              top: rect.top + bounds.top + window.scrollY,
              left: rect.left + bounds.left + window.scrollX
            };
            console.log('hihi', position);
            setSelectedTextPosition(position);
          }
        }
      };
  
      const quill = quillRef.current;
      if (quill) {
        console.log('Quill is ready');
        quill.on('selection-change', handleSelectionChange);
      } else {
        console.log('Quill is not available');
      }
  
      return () => {
        const quill = quillRef.current;
        if (quill) {
          console.log('Cleaning up event listener');
          quill.off('selection-change', handleSelectionChange);
        }
      };
    }
  }, [selectedText, selectedType, setSelectedTextPosition, selectionRange]);  

  useEffect(() => {
    const handleMouseUp = () => {
      if (!quillRef.current || !setSelectedTextPosition) return;
      const selection = quillRef.current.getSelection();
      if (selection && selection.length > 0) {
        const bounds = quillRef.current.getBounds(selection.index);
        const editorElement = editorRef.current;
        if (editorElement) {
          const rect = editorElement.getBoundingClientRect();
          const position = {
            top: rect.top + bounds.top + window.scrollY,
            left: rect.left + bounds.left + window.scrollX
          };
          setSelectedTextPosition(position);
        }
      }
    };
  
    document.addEventListener('mouseup', handleMouseUp);
  
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setSelectedTextPosition]);
  

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
      });
      const quillToolbar = document.querySelector('.ql-toolbar');
    if (quillToolbar) {
      quillToolbar.classList.add('fixed', 'top-0', 'left-0', 'w-full', 'z-50', 'bg-white');
    }
      quillRef.current.setText(content ? content : '');
  
      quillRef.current.on('text-change', () => {
        const updatedContent = quillRef.current!.getText();
        if (onContentChange) {
          onContentChange(updatedContent);
        }
      });
  
      quillRef.current.on('selection-change', (range) => {
        if (range && range.length > 0) {
          const selected = quillRef.current!.getText(range.index, range.length);
          setSelectedText(selected.trim());
          setSelectedIndex(range.index);
          setShowPromptOptions(true);
          setSelectionRange(range);
  
          const bounds = quillRef.current!.getBounds(range.index, range.length);
          const editorContainer = editorRef.current!.getBoundingClientRect();
  
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
          } as DOMRect;
          updateToolbarPosition(selectionRect);
        } else if (selectedType === 'Ask AI') {
          setShowPromptOptions(false);
          setSelectedText('');
          setSelectedPrompt('');
          setSelectedType('');
        } else if (range && range.length === 0) {
          setShowPromptOptions(false);
          setSelectedPrompt('');
          setSelectedText('');
          setSelectedType('');
        }
      });
    }
  }, [content, selectedType, selectedText, selectionRange]);

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
      const { index, length } = previousSelectionRangeRef.current;
      quillRef.current.formatText(index, length, { background: '' }); 
      previousSelectionRangeRef.current = null; 
    } else {
      console.log('No highlight to clear');
    }  

    setSelectedPrompt(prompt);
    setIsLoading(true);
    const promptContent = `${selectedType}: ${prompt}`;
  
    console.log('[handlePromptSelect]', {
      selectedType,
      prompt,
      promptContent
    });
  
    if (selectedType === 'Ask AI') {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  
    if (quillRef.current && selectionRange) {
      quillRef.current.setSelection(selectionRange.index, selectionRange.length);
    }
  
    onProcess({
      selectedContent: selectedText,
      selectedIndex,
      promptContent
    });
  
    setShowAIResult(false);
    setShowPromptOptions(false);
  };
  

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

  useEffect(() => {
    if (toolbarRef.current && toolbarPosition) {
      toolbarRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [toolbarPosition])

  const previousSelectionRangeRef = useRef<RangeStatic | null>(null);

useEffect(() => {
  if (!quillRef.current) return;

  const quill = quillRef.current;

  if (content === '' && previousSelectionRangeRef.current) {
    const { index, length } = previousSelectionRangeRef.current;
    quill.formatText(index, length, { background: '' });
    previousSelectionRangeRef.current = null;
    return; 
  }

  if (selectionRange && selectedType === 'Ask AI') {
    quill.formatText(selectionRange.index, selectionRange.length, {
      background: '#FFEB3B'
    });
    previousSelectionRangeRef.current = selectionRange;
  }
}, [selectionRange, selectedType]);

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="space-y-6 w-full h-full p-4">
        <div
          ref={editorRef}
          className="flex-1 min-h-[calc(100vh-100px)] w-full border border-gray-300 rounded-lg shadow-sm editor-wrapper !mt-10 ql-container ql-snow"
          />

        {showPromptOptions && !showAIResult && toolbarPosition && (
          <div
            ref={toolbarRef}
            className="absolute z-50 bg-white border rounded-xl shadow-xl"
            style={{
              top: `${
                isLoading && selectedType !== 'Ask AI'
                  ? toolbarPosition.top
                  : toolbarPosition.top
              }px`,
              left: `${toolbarPosition.left}px`
            }}
          >
            <div className="p-3 w-max min-w-[300px] max-w-[500px]">
              {/* Type and prompt options */}
              <div className="flex flex-wrap gap-1">
                {['Rewrite', 'Translate', 'Tone', 'Ask AI'].map(
                  (type, index, array) => (
                    <DropdownMenu key={type}>
                      <DropdownMenuTrigger
                        asChild
                        onMouseDown={(e) => {
                          e.preventDefault() // Prevent losing focus from editor
                          handleTypeSelect(type) // Direct call instead of using onClick in <Button>
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-4 py-1 text-sm cursor-pointer ${
                              selectedType === type
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600'
                            }`}
                            onClick={() => handleTypeSelect(type)}
                          >
                            {type}
                          </span>
                          {index !== array.length - 1 && (
                            <span className="mx-2 text-gray-400">|</span>
                          )}
                        </div>
                      </DropdownMenuTrigger>

                      {selectedType === type && type !== 'Ask AI' && (
                        <DropdownMenuPortal>
                          <DropdownMenuContent
                            className="max-h-48 overflow-y-auto"
                            side={dropdownPosition}
                            align="start"
                            sideOffset={20}
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
                              if (quillRef.current && selectionRange) {
                                quillRef.current.setSelection(selectionRange)
                              }
                            }}
                          >
                            <div className="flex flex-col space-y-0.5">
                              {configOptions[type].map((prompt) => {
                                const isActive = selectedPrompt === prompt
                                const isDisabled =
                                  isLoading &&
                                  isActive &&
                                  selectedType !== 'Ask AI'

                                return (
                                  <DropdownMenuItem
                                    key={prompt}
                                    onClick={() => handlePromptSelect(prompt)}
                                    disabled={isDisabled}
                                    className={`rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 max-h-48 overflow-y-auto ${
                                      isActive ? 'bg-blue-50 text-blue-600' : ''
                                    } ${
                                      isDisabled
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
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">
                        Generating suggestion...
                      </span>
                    </div>
                  )} 
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
              <div className="w-3 h-3 bg-black rotate-45 border-t border-l border-gray-300 absolute -top-1.5 z-[-1]" />
            </div>

            {/* AI Suggestion content box */}
            <div className="p-3 bg-white rounded-lg shadow-sm min-w-[400px] max-w-[900px] space-y-3 text-sm border border-gray-200">
              <div className="font-semibold text-gray-900">AI Suggestion</div>

              {isLoading && selectedType !== 'Ask AI' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-black border-gray-300 rounded-full animate-spin" />
                  <span className="text-gray-600">Processing...</span>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 text-gray-700 font-mono break-words">
                  {aiResult}
                </div>
              )}

              {!isLoading && selectedType !== 'Ask AI' && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-800 hover:bg-gray-100"
                    onClick={handleConfirm}
                  >
                    Accept
                  </Button>
                  <span className="text-gray-500">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-gray-100"
                    onClick={handleReject}
                  >
                    Discard
                  </Button>
                  <span className="text-gray-500">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-800 hover:bg-gray-100"
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