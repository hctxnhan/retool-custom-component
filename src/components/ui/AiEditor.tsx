import React, { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { Button } from './button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem
} from './navigation-menu'

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
  rewrite: [
    'Make longer',
    'Make shorter',
    'Simplify language',
    'Add details',
    'Summarize',
    'Make more persuasive',
    'Make more descriptive'
  ],
  translate: [
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
  tone: [
    'Professional',
    'Funny',
    'Friendly',
    'Casual',
    'Formal',
    'Sarcastic',
    'Encouraging',
    'Empathetic'
  ],
  askAi: []
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

  const [showPromptOptions, setShowPromptOptions] = useState(false)
  const [showAIResult, setShowAIResult] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // const [lastMessage, setLastMessage] = useState('')
  // const [messageHistory, setMessageHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])

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
        } else if (selectedType === 'askAi') {
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
      setIsLoading(false)
      setShowAIResult(true)
      setSelectedPrompt('')
    }
  }, [aiResult])

  const handleOptionSelect = (type: string) => {
    setSelectedType(type)
    if (onTypeChange) {
      onTypeChange(type)
    }
  }

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt)
    const promptContent = `${selectedType}: ${prompt}`
    setIsLoading(true)

    // ✨ Gửi dữ liệu về cho Retool query xử lý
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
    setIsLoading(true)
    onProcess({
      selectedContent: selectedText,
      selectedIndex,
      promptContent
    })
    setShowAIResult(false)
  }

  return (
    <div className="space-y-6">
      <div
        ref={editorRef}
        className="h-64 border border-gray-300 rounded-lg shadow-sm editor-wrapper"
      />

      {showPromptOptions && !showAIResult && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 px-4 !important">
              Select an option:
            </p>
            <NavigationMenu>
              <div className="flex gap-3 flex-wrap">
                {Object.keys(configOptions).map((type) => (
                  <NavigationMenuItem key={type}>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`rounded-full px-6 py-2 text-sm ${selectedType === type ? 'bg-blue-100 text-blue-600' : ''}`}
                      onClick={() => handleOptionSelect(type)}
                    >
                      {type}
                      {selectedType === type && type !== 'askAi' && (
                        <NavigationMenuContent className="bg-white p-4 border shadow-md rounded-lg mt-2 w-max">
                          <div className="flex flex-wrap gap-2">
                            {configOptions[type].map((prompt) => {
                              const isActive = selectedPrompt === prompt
                              const isDisabled = isLoading && isActive
                              return (
                                <Button
                                  key={prompt}
                                  variant="secondary"
                                  size="sm"
                                  className={`rounded-full px-6 py-2 ${
                                    isActive
                                      ? 'bg-blue-500 text-white'
                                      : 'hover:bg-blue-100 hover:text-blue-600'
                                  } transition-colors duration-200 ease-in-out ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  onClick={() => handlePromptSelect(prompt)}
                                  disabled={isDisabled}
                                >
                                  {isLoading && isActive
                                    ? `${prompt} (Thinking...)`
                                    : prompt}
                                </Button>
                              )
                            })}
                          </div>
                        </NavigationMenuContent>
                      )}

                      {selectedType === 'askAi' && (
                        <NavigationMenuContent></NavigationMenuContent>
                      )}
                    </Button>
                  </NavigationMenuItem>
                ))}
              </div>
            </NavigationMenu>
          </div>

          {selectedType && selectedType !== 'askAi' && (
            <div className="space-y-2">
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-t-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">
                    Generating suggestion...
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {configOptions[selectedType as keyof typeof configOptions].map(
                  (opt) => {
                    const isActive = selectedPrompt === opt
                    return isLoading ? (
                      isActive && (
                        <Button
                          key={opt}
                          variant="secondary"
                          size="sm"
                          disabled
                          className="rounded-full px-6 py-2"
                        >
                          {opt} (Thinking...)
                        </Button>
                      )
                    ) : (
                      <Button
                        key={opt}
                        variant="secondary"
                        size="sm"
                        className={`rounded-full px-6 py-2 ${
                          isActive ? 'bg-blue-500 text-white' : ''
                        }`}
                        onClick={() => handlePromptSelect(opt)}
                      >
                        {opt}
                      </Button>
                    )
                  }
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showAIResult && (
        <div className="p-5 bg-white border rounded-lg shadow space-y-4">
          <div className="text-sm font-semibold text-gray-800">
            ✨ AI Suggestion:
          </div>

          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-t-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Processing...</span>
            </div>
          ) : (
            <div className="p-3 bg-gray-100 border rounded text-sm whitespace-pre-line font-mono text-gray-700">
              {aiResult}
            </div>
          )}

          {!isLoading && (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="default"
                size="sm"
                className="px-6 py-2"
                onClick={handleConfirm}
              >
                Confirm
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="px-6 py-2"
                onClick={handleReject}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-6 py-2"
                onClick={handleRegenerate}
              >
                Regenerate
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AiEditor