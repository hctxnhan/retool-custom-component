'use client'
import * as React from 'react'
import { useState, FormEvent } from 'react'
import { Paperclip, Mic, CornerDownLeft } from 'lucide-react'
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

type Message = {
  id: number;
  content: string;
  role: "user" | "assistant";
}

export const ExpandableChatDemo = ({
  _lastMessage,
  setLastMessage,
  _messageHistory,
  setMessageHistory,
  placeholder = "Type your message...",
  lastResponse,
  avatarSrc
}: {
  _lastMessage: string
  setLastMessage: (message: string) => void
  _messageHistory: Array<{ role: "user" | "assistant"; content: string }>
  setMessageHistory: (history: Array<{ role: "user" | "assistant"; content: string }>) => void
  placeholder?: string
  lastResponse?: string
  avatarSrc?: string
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: `Hello! I'm Retool AI. How can I help you today?`,
      role: "assistant"
    }
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    const newUserMessage: Message = {
      id: Date.now(),
      content: input,
      role: "user"
    }

    // Update local messages state
    setMessages((prev) => [...prev, newUserMessage])
    setInput('')
    setIsLoading(true)

    // Update lastMessage and messageHistory in parent component
    setLastMessage(input)
    setPendingUserMessage(input)
    const currentHistory = Array.isArray(_messageHistory) ? _messageHistory : []
    const updatedHistory: Array<{ role: "user" | "assistant"; content: string }> = [
      ...currentHistory,
      { role: "user", content: input }
    ]
    setMessageHistory(updatedHistory)
  }

  // Add effect to handle new AI responses
  React.useEffect(() => {
    if (lastResponse && pendingUserMessage) {
      const aiMessage: Message = {
        id: Date.now(),
        content: lastResponse,
        role: "assistant"
      }
      console.log('AI response:', lastResponse)
      console.log('Pending user message:', pendingUserMessage)
      console.log('Updated messages:', [...messages, aiMessage])

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)

      // Update messageHistory with AI response
      const currentHistory = Array.isArray(_messageHistory) ? _messageHistory : []
      setMessageHistory([
        ...currentHistory,
        { role: "assistant", content: lastResponse }
      ])
      setPendingUserMessage(null)
    }
  }, [lastResponse, isLoading, _messageHistory, setMessageHistory])

  const handleAttachFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const fileNames = Array.from(files).map(file => file.name);
        const fileMessage = `Attached files: ${fileNames.join(', ')}`;
        setInput(prev => prev + (prev ? '\n' : '') + fileMessage);
      }
    };
    input.click();
  }

  const handleMicrophoneClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Here you would typically start recording
      // For now, we'll just show a message that mic access was granted
      setInput(prev => prev + (prev ? '\n' : '') + '🎤 Voice input enabled');
      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setInput(prev => prev + (prev ? '\n' : '') + '❌ Could not access microphone');
    }
  }

  return (
    <div className="relative w-full h-full">
      <ExpandableChat
        size="lg"
        className="flex flex-col h-full w-full max-h-[600px]"
      >
        <ExpandableChatHeader className="flex-col text-center justify-center">
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
                  src={
                    message.role === 'user'
                      ? avatarSrc || 'https://img.icons8.com/?size=100&id=15263&format=png&color=000000'
                      : 'https://img.icons8.com/?size=100&id=KVOZBZtFxHEy&format=png&color=000000'
                  }
                />
                <ChatBubbleMessage
                  variant={message.role === 'user' ? 'sent' : 'received'}
                >
                  {message.content}
                </ChatBubbleMessage>
              </ChatBubble>
            ))}

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src="https://img.icons8.com/?size=100&id=KVOZBZtFxHEy&format=png&color=000000"
                  fallback="AI"
                />
                <ChatBubbleMessage isLoading />
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
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleAttachFile}
                >
                  <Paperclip className="size-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleMicrophoneClick}
                >
                  <Mic className="size-4" />
                </Button>
              </div>
              <Button
                type="submit"
                size="sm"
                className="ml-auto gap-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition"
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