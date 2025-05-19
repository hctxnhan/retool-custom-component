import React, { useEffect, useRef, useState } from 'react'
import Quill, { RangeStatic } from 'quill'
import { AiEditorProps, ToolbarPosition } from './types'
import { configOptions } from './config'
import EditorCore from './EditorCore'
import EditorToolbar from './EditorToolbar'
import AiSuggestionPanel from './AiSuggestionPanel'
import { calculateToolbarPosition } from './positionUtils'

const AiEditor: React.FC<AiEditorProps> = ({
  content,
  onProcess,
  aiResult,
  onTypeChange,
  onContentChange,
  setContent,
  setSelectedTextPosition
}) => {
  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null) as React.MutableRefObject<Quill | null>
  const toolbarRef = useRef<HTMLDivElement>(null)
  const previousSelectionRangeRef = useRef<RangeStatic | null>(null)

  // Selection state
  const [selectedText, setSelectedText] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  const [selectionRange, setSelectionRange] = useState<RangeStatic | null>(null)

  // UI state
  const [showPromptOptions, setShowPromptOptions] = useState(false)
  const [showAIResult, setShowAIResult] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Position state
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const [toolbarDirection, setToolbarDirection] = useState<'top' | 'bottom'>('top')
  const [currentSelectionRect, setCurrentSelectionRect] = useState<DOMRect | null>(null)

  // Update toolbar position when selection changes
  const updateSelectionRectangle = () => {
    if (!currentSelectionRect) {
      setToolbarPosition(null);
      return;
    }

    const result = calculateToolbarPosition(currentSelectionRect, toolbarRef);
    setToolbarPosition(result.position);
    setDropdownPosition(result.dropdownPosition);
    setToolbarDirection(result.toolbarDirection);
  }

  // Event listeners for viewport changes
  useEffect(() => {
    const handleViewportChange = () => {
      updateSelectionRectangle();
    }

    window.addEventListener('scroll', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    }
  }, [currentSelectionRect]); // Depends on currentSelectionRect

  // Handle selection changes from EditorCore
  const handleSelectionChange = (
    selected: string,
    index: number,
    range: RangeStatic | null,
    selectionRect: DOMRect | null
  ) => {
    // Nếu không có selection hoặc selection rỗng
    if (!range || !selectionRect) {
      // Chỉ ẩn toolbar nếu không phải đang trong chế độ Ask AI
      if (selectedType !== 'Ask AI') {
        setShowPromptOptions(false);
        setSelectedText('');
        setSelectedPrompt('');
        setSelectedType('');
      }
      setCurrentSelectionRect(null);
      return;
    }
    
    // Có selection hợp lệ
    setSelectedText(selected);
    setSelectedIndex(index);
    setShowPromptOptions(true);
    setSelectionRange(range);
    setCurrentSelectionRect(selectionRect);
    
    const result = calculateToolbarPosition(selectionRect, toolbarRef);
    setToolbarPosition(result.position);
    setDropdownPosition(result.dropdownPosition);
    setToolbarDirection(result.toolbarDirection);
    
    // Update selected text position for external components
    if (setSelectedTextPosition && quillRef.current) {
      const bounds = quillRef.current.getBounds(range.index);
      const editorElement = editorRef.current;
      if (editorElement) {
        const rect = editorElement.getBoundingClientRect();
        setSelectedTextPosition({
          top: rect.top + bounds.top + window.scrollY,
          left: rect.left + bounds.left + window.scrollX
        });
      }
    }
  }

  // Handle mouse selection
  const handleTextSelection = () => {
    if (!quillRef.current || !editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Không cần làm gì ở đây vì EditorCore sẽ xử lý selection-change
  }

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    }
  }, []);

  // Handle result from AI processing
  useEffect(() => {
    if (aiResult && selectedText) {
      setIsLoading(false);
      setShowAIResult(true);
      setSelectedPrompt('');
    }
  }, [aiResult, selectedText]);

  // Special handling for Ask AI
  useEffect(() => {
    if (selectedText && selectedType === 'Ask AI') {
      setContent(selectedText);
      setIsLoading(false);
    }
  }, [selectedText, selectedType, setContent]);

  // Action handlers
  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setShowPromptOptions(true);

    const currentSelection = quillRef.current?.getSelection();
    if (quillRef.current && currentSelection) {
      requestAnimationFrame(() => {
        quillRef.current?.setSelection(
          currentSelection.index,
          currentSelection.length
        );
      });
    }

    if (onTypeChange) {
      onTypeChange(type);
    }
  }

  const handlePromptSelect = (prompt: string) => {
    if (previousSelectionRangeRef.current && quillRef.current) {
      setIsLoading(true);
      const { index, length } = previousSelectionRangeRef.current;
      quillRef.current.formatText(index, length, { background: '' });
      previousSelectionRangeRef.current = null;
    }

    const promptContent = `${selectedType}: ${prompt}`;
    setSelectedPrompt(prompt);

    if (selectedType === 'Ask AI') {
      setIsLoading(false);
      setShowPromptOptions(false);
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
  }

  const handleConfirm = () => {
    if (quillRef.current && aiResult) {
      quillRef.current.deleteText(selectedIndex, selectedText.length);
      quillRef.current.insertText(selectedIndex, aiResult);
    }
    resetState();
  }

  const handleReject = () => {
    setShowAIResult(false);
    setIsDropdownOpen(false);
  }

  const handleRegenerate = () => {
    const promptContent = `${selectedType}: ${selectedPrompt}`;
    setIsLoading(selectedType !== 'Ask AI');
    
    onProcess({
      selectedContent: selectedText,
      selectedIndex,
      promptContent
    });
    
    setShowAIResult(false);
  }

  // Reset all states
  const resetState = () => {
    setShowAIResult(false);
    setSelectedText('');
    setSelectedType('');
    setSelectedPrompt('');
    setShowPromptOptions(false);
  }

  // Handle Ask AI highlight
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
  }, [selectionRange, selectedType, content]);

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="space-y-6 w-full h-full p-4">
        <div
          ref={editorRef}
          className="w-full flex-1 min-h-[calc(100vh-100px)] !mt-5 rounded-xl bg-white p-4 ql-container ql-snow !border-none !important"
        />

        <EditorCore 
          content={content}
          onContentChange={onContentChange}
          editorRef={editorRef}
          quillRef={quillRef}
          onSelectionChange={handleSelectionChange}
        />

        <EditorToolbar
          isVisible={showPromptOptions && !showAIResult && !!toolbarPosition}
          position={toolbarPosition}
          selectedType={selectedType}
          selectedPrompt={selectedPrompt}
          isLoading={isLoading}
          isDropdownOpen={isDropdownOpen}
          dropdownPosition={dropdownPosition}
          onTypeSelect={handleTypeSelect}
          onPromptSelect={handlePromptSelect}
          setIsDropdownOpen={setIsDropdownOpen}
          configOptions={configOptions}
          selectionRange={selectionRange}
          toolbarRef={toolbarRef}
        />

        <AiSuggestionPanel
          isVisible={showAIResult && !!toolbarPosition}
          position={toolbarPosition}
          aiResult={aiResult}
          isLoading={isLoading}
          selectedType={selectedType}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onRegenerate={handleRegenerate}
        />
      </div>
    </div>
  )
}

export default AiEditor