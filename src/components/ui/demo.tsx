'use client'
import * as React from 'react'
import { useState, FormEvent } from 'react'
import { Paperclip, Mic, CornerDownLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage
} from '@/components/ui/chat-bubble'
import { ChatInput } from '@/components/ui/chat-input'
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter
} from '@/components/ui/expandable-chat'
import { ChatMessageList } from '@/components/ui/chat-message-list'
import ReactMarkdown from 'react-markdown'
import { MessageLoading } from '@/components/ui/message-loading'

type Message = {
  id: number
  content: string
  role: 'user' | 'assistant'
}

export const ExpandableChatDemo = ({
  lastMessage,
  setLastMessage,
  _messageHistory,
  setMessageHistory,
  placeholder = 'Type your message...',
  lastResponse,
  _setLastResponse,
  avatarSrc,
  content,
  onCloseChat,
}: {
  lastMessage: string,
  setLastMessage: (message: string) => void
  _messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  setMessageHistory: (
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => void
  placeholder?: string
  lastResponse?: string
  _setLastResponse?: (response: string) => void
  avatarSrc?: string
  content?: string
  onCloseChat: () => void
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: `Hello! I'm Retool AI. How can I help you today?`,
      role: 'assistant'
    }
  ])

  const [input, setInput] = useState('')
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newUserMessage: Message = {
      id: Date.now(),
      content: input,
      role: 'user'
    }

    // Update local messages state
    setMessages((prev) => [...prev, newUserMessage])
    setInput('')

    // Update lastMessage and messageHistory in parent component
    setLastMessage(input)
    const currentHistory = Array.isArray(_messageHistory) ? _messageHistory : []
    const updatedHistory: Array<{
      role: 'user' | 'assistant'
      content: string
    }> = [...currentHistory, { role: 'user', content: input }]
    setMessageHistory(updatedHistory)
    setIsAwaitingResponse(true)
  }



  // Add effect to handle new AI responses
  React.useEffect(() => {
    if (lastResponse) {
      const aiMessage: Message = {
        id: Date.now(),
        content: lastResponse,
        role: 'assistant'
      }

      setMessages((prev) => [...prev, aiMessage])
      const currentHistory = Array.isArray(_messageHistory)
        ? _messageHistory
        : []
      setMessageHistory([
        ...currentHistory,
        { role: 'assistant', content: lastResponse }
      ])
      setIsAwaitingResponse(false)
    }
  }, [lastResponse])

  const [isOpen, setIsOpen] = useState(true)
  const handleClose = () => {
    setMessageHistory([])
    setLastMessage('')
    _setLastResponse?.('')
    setMessages([
      {
        id: 1,
        content: `Hello! I'm Retool AI. How can I help you today?`,
        role: 'assistant'
      }
    ])
    onCloseChat()
  }
  
  return (
    <div className="relative w-full h-full">
      <ExpandableChat
        size="lg"
        className="flex flex-col h-full w-full max-h-[600px]"
        isOpen={isOpen}
        onClose={handleClose}
      >
        <ExpandableChatHeader className="flex-col text-center justify-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Chat with Retool AI ✨</h1>
          <p className="text-sm text-muted-foreground">
            Ask me anything about the components
          </p>
        </ExpandableChatHeader>

        <ExpandableChatBody className="flex-1 overflow-y-auto px-4 py-2">
          <ChatMessageList className="space-y-3">
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                variant={message.role === 'user' ? 'sent' : 'received'}
              >
                <ChatBubbleAvatar
                  className="h-6 w-6 shrink-0 !important"
                  src={message.role === 'user'
                    ? avatarSrc ||
                      'https://img.icons8.com/?size=100&id=15263&format=png&color=000000'
                    : 'https://img.icons8.com/?size=100&id=KVOZBZtFxHEy&format=png&color=000000'}
                />
                <ChatBubbleMessage
                  variant={message.role === 'user' ? 'sent' : 'received'}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </ChatBubbleMessage>
              </ChatBubble>
            ))}

            {isAwaitingResponse && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src="https://img.icons8.com/?size=100&id=KVOZBZtFxHEy&format=png&color=000000"
                  fallback="AI"
                />
                <ChatBubbleMessage variant="received">
                  <MessageLoading /> 
                </ChatBubbleMessage>
              </ChatBubble>
            )}
          </ChatMessageList>
        </ExpandableChatBody>

        <ExpandableChatFooter className="bg-muted/40 border-t p-3">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border border-muted bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary p-2"
          >
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="min-h-12 resize-none rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 shadow-inner focus-visible:ring-0"
            />

            <div className="flex items-center p-3 pt-0 justify-between">
              <Button
                type="submit"
                size="sm"
                className="ml-auto gap-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition px-4 py-2 !important"
              >
                Send
                <CornerDownLeft className="size-4" />
              </Button>
            </div>
          </form>
        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  )
}