import React, { useEffect, useRef, useState } from 'react'
import Quill, { RangeStatic } from 'quill'
import 'quill/dist/quill.snow.css'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from './dropdown-menu'

interface AiEditorProps {
  // content: string
  onProcess: (data: {
    selectedContent: string
    selectedIndex: number
    promptContent: string
  }) => void
  content?: string
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
  onContentChange
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
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const [toolbarDirection, setToolbarDirection] = useState<'top' | 'bottom'>('top');
  const toolbarRef = useRef<HTMLDivElement | null>(null)

  const updateToolbarPosition = (selectionRect: DOMRect) => {
    const padding = 8
    const toolbarHeight = toolbarRef.current?.offsetHeight || 100
    const toolbarWidth = toolbarRef.current?.offsetWidth || 300
  
    const isNearBottom = selectionRect.bottom + toolbarHeight + padding > window.innerHeight
  
    const top = isNearBottom
      ? selectionRect.top - toolbarHeight - padding
      : selectionRect.bottom + padding
  
    const left = selectionRect.left + selectionRect.width / 2 - toolbarWidth / 2
  
    // Cập nhật vị trí và hướng hiển thị
    setToolbarPosition({ top, left })
    setToolbarDirection(isNearBottom ? 'top' : 'bottom')
  
    // Optional: áp dụng CSS trực tiếp (nếu cần)
    if (toolbarRef.current) {
      toolbarRef.current.style.position = 'fixed'
      toolbarRef.current.style.top = `${top}px`
      toolbarRef.current.style.left = `${left}px`
      toolbarRef.current.style.visibility = 'visible'
    }
  }  

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    updateToolbarPosition(rect)
    setShowPromptOptions(true)
  }

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection)
    return () => {
      document.removeEventListener('mouseup', handleTextSelection)
    }
  }, [])

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, { theme: 'snow' })
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
            toJSON: () => {},
          } as DOMRect;
      
          updateToolbarPosition(selectionRect);
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
  }, [content])

  // ✨ Lắng nghe khi Retool trả kết quả về
  useEffect(() => {
    if (aiResult && selectedText) {
      console.log('[aiResult received]', { aiResult, selectedText })
      setIsLoading(false)
      setShowAIResult(true)
      setSelectedPrompt('')
    }
  }, [aiResult])

  const handleOptionSelect = (type: string) => {
    setSelectedType(type)

    if (quillRef.current && selectionRange) {
      setTimeout(() => {
        quillRef.current?.setSelection(selectionRange)
      }, 0)
    }

    if (onTypeChange) {
      onTypeChange(type)
    }
  }

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt)
    const promptContent = `${selectedType}: ${prompt}`

    console.log('[handlePromptSelect]', { selectedType, prompt, promptContent })

    if (selectedType === 'Ask AI') {
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    if (quillRef.current && selectionRange) {
      quillRef.current.setSelection(selectionRange)
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

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="space-y-6 w-full h-full p-4">
        <div
          ref={editorRef}
          className="flex-1 min-h-[calc(100vh-100px)] w-full border border-gray-300 rounded-lg shadow-sm editor-wrapper"
        />

        {showPromptOptions && !showAIResult && toolbarPosition && (
          <div
            ref={toolbarRef}
            className="absolute z-50 bg-white border rounded-xl shadow-xl"
            style={{
              top: `${
                (isLoading && selectedType !== 'Ask AI')
                  ? toolbarPosition.top + 70
                  : toolbarPosition.top
              }px`,
              left: `${toolbarPosition.left}px`
            }}
          >
            <div className="p-3 w-max min-w-[300px] max-w-[500px]">
              {/* <p className="text-sm font-semibold text-gray-800 mb-3 px-1">
                Select an option:
              </p> */}

              {/* Loại và các lựa chọn prompt */}
              <div className="flex flex-wrap gap-1">
                {Object.keys(configOptions).map((type) => (
                  <DropdownMenu key={type}>
                    <DropdownMenuTrigger
                      asChild
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full border px-4 py-1 text-sm hover:bg-gray-100 ${
                          selectedType === type
                            ? 'bg-blue-100 text-blue-600 border-blue-400'
                            : 'border-gray-300'
                        }`}
                        onClick={() => handleOptionSelect(type)}
                      >
                        {type}
                      </Button>
                    </DropdownMenuTrigger>

                    {selectedType === type && type !== 'Ask AI' && (
                      <DropdownMenuContent
                        className="bg-white p-1 border shadow-lg rounded-md w-48"
                        side={dropdownPosition}
                        align="start"
                        sideOffset={5}
                        alignOffset={-4}
                        avoidCollisions
                        collisionPadding={8}
                        sticky="always"
                      >
                        <div className="flex flex-col">
                          {configOptions[type].map((prompt) => {
                            const isActive = selectedPrompt === prompt
                            const isDisabled =
                              isLoading && isActive && selectedType !== 'Ask AI'

                            return (
                              <DropdownMenuItem
                                key={prompt}
                                onClick={() => handlePromptSelect(prompt)}
                                disabled={isDisabled}
                                className={`text-sm px-3 py-2 cursor-pointer rounded ${
                                  isActive ? 'bg-blue-100 text-blue-600' : ''
                                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
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
                    )}
                  </DropdownMenu>
                ))}
              </div>

              {/* Loading + Prompt đã chọn */}
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

                  <div className="flex flex-col gap-1">
                    {configOptions[
                      selectedType as keyof typeof configOptions
                    ].map((opt) => {
                      const isActive = selectedPrompt === opt
                      return (
                        <Button
                          key={opt}
                          variant="ghost"
                          size="sm"
                          className={`rounded-full px-4 py-1 text-sm border ${
                            isActive
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                          disabled={isLoading && isActive}
                          onClick={() => handlePromptSelect(opt)}
                        >
                          {isLoading && isActive ? `${opt} (Thinking...)` : opt}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showAIResult && toolbarPosition && (
          <div
            className="absolute z-50"
            style={{
              top: `${toolbarPosition.top + 60}px`, 
              left: `${toolbarPosition.left}px`
            }}
          >
            {/* Mũi tên nhỏ chỉ lên trên (arrow tip) */}
            <div className="flex justify-center relative">
              <div className="w-3 h-3 bg-white rotate-45 border-t border-l border-gray-300 absolute -top-1.5 z-[-1]" />
            </div>

            {/* Hộp nội dung AI Suggestion */}
            <div className="p-4 bg-white border border-gray-300 rounded-xl shadow-xl min-w-[400px] max-w-[900px] space-y-3 text-sm">
              {/* Header */}
              <div className="font-semibold text-gray-800 flex items-center gap-1">
                ✨ AI Suggestion
              </div>

              {/* Loading hoặc kết quả */}
              {isLoading && selectedType !== 'Ask AI' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-300 rounded-full animate-spin" />
                  <span className="text-gray-500">Processing...</span>
                </div>
              ) : (
                <div className="p-2 bg-gray-100 border rounded text-gray-700 font-mono whitespace-pre-wrap break-words overflow-x-auto">
                  {aiResult}
                </div>
              )}

              {/* Button actions */}
              {!isLoading && selectedType !== 'Ask AI' && (
                <div className="flex flex-col border-t pt-2 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start hover:bg-gray-100"
                    onClick={handleConfirm}
                  >
                    ✅ Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start hover:bg-gray-100 text-red-500"
                    onClick={handleReject}
                  >
                    ❌ Discard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start hover:bg-gray-100"
                    onClick={handleRegenerate}
                  >
                    🔄 Try again
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