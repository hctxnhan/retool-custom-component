import React from 'react'
import { type FC } from 'react'
import './output.css'
import { Retool } from '@tryretool/custom-component-support'
import { Button } from './components/ui/button'
import AiEditor from './components/ui/AiEditor'
import { ExpandableChatDemo } from './components/ui/demo'

export const NhanTestComponent: FC = () => {
  const [name, _setName] = Retool.useStateString({
    name: 'name'
  })

  const [theme, _setTheme] = Retool.useStateObject({
    name: 'theme'
  })

  return (
    <div>
      <WrapperComponent cssVariables={theme as Record<string, string>}>
        <Button className="w-full h-full" variant={'default'}>
          Hello {name}
        </Button>
      </WrapperComponent>
    </div>
  )
}

export const AiChatComponent: FC = () => {
  const [theme, _setTheme] = Retool.useStateObject({
    name: 'theme'
  })

  const [placeholder] = Retool.useStateString({
    name: 'placeholder',
    initialValue: 'Type your message...'
  })

  const [lastMessage, setLastMessage] = Retool.useStateString({
    name: 'lastMessage',
    inspector: 'hidden'
  })

  const [messageHistory, setMessageHistory] = Retool.useStateArray({
    name: 'messageHistory',
    inspector: 'hidden'
  })

  const [lastResponse, _setLastResponse] = Retool.useStateString({
    name: 'lastResponse',
  })

  const [avatarSrc] = Retool.useStateString({
    name: 'avatarSrc',
    initialValue: "{{ current_user.profilePhotoUrl }}",
    inspector: 'hidden'
  })

  const onInit = Retool.useEventCallback({
    name: 'onInit'
  })

  const onMessage = Retool.useEventCallback({
    name: 'onMessage'
  })

  const onResponse = Retool.useEventCallback({
    name: 'onResponse'
  })

    React.useEffect(() => {
      const handleMessage = async () => {
        if (lastMessage) {
          await onMessage()
        }
      }
      handleMessage()
    }, [lastMessage])

  React.useEffect(() => {
    if (lastResponse) {
      onResponse()
    }
  }, [lastResponse, onResponse])

  React.useEffect(() => {
    onInit()
  }, [onInit])

  return (
    <div>
      <WrapperComponent cssVariables={theme as Record<string, string>}>
        <ExpandableChatDemo
          _lastMessage={lastMessage}
          setLastMessage={setLastMessage}
          _messageHistory={messageHistory as Array<{ role: "user" | "assistant"; content: string }>}
          setMessageHistory={setMessageHistory}
          placeholder={placeholder || 'Type your message...'}
          lastResponse={lastResponse}
          avatarSrc={avatarSrc}
/>
      </WrapperComponent>
    </div>
  )
}

export const AiEditorComponent: FC = () => {
  const [content, _setContent] = React.useState('')

  const [theme, _setTheme] = Retool.useStateObject({
    name: 'theme'
  })

  const [_processData, setProcessData] = Retool.useStateObject({
    name: 'processData',
    inspector: 'hidden'
  })

  const [aiResult, _setAIResult] = Retool.useStateString({
    name: 'aiResult'
  })

  const onProcess = Retool.useEventCallback({
    name: 'onProcess'
  })

  const handleAIProcess = (data: {
    selectedContent: string
    selectedIndex: number
    promptContent: string
  }) => {
    setProcessData(data)
    onProcess()
  }

  //chat
  const [placeholder] = Retool.useStateString({
    name: 'placeholder',
    initialValue: 'Type your message...'
  })

  const [lastMessage, setLastMessage] = Retool.useStateString({
    name: 'lastMessage',
    inspector: 'hidden'
  })

  const [messageHistory, setMessageHistory] = Retool.useStateArray({
    name: 'messageHistory',
    inspector: 'hidden'
  })

  const [lastResponse, _setLastResponse] = Retool.useStateString({
    name: 'lastResponse',
  })

  const [avatarSrc] = Retool.useStateString({
    name: 'avatarSrc',
    initialValue: "{{ current_user.profilePhotoUrl }}",
    inspector: 'hidden'
  })

  const onInit = Retool.useEventCallback({
    name: 'onInit'
  })

  const onMessage = Retool.useEventCallback({
    name: 'onMessage'
  })

  const onResponse = Retool.useEventCallback({
    name: 'onResponse'
  })
  const [selectedType, setSelectedType] = Retool.useStateString({
    name: 'selectedType',
    inspector: 'hidden'
  })

    React.useEffect(() => {
      const handleMessage = async () => {
        if (lastMessage) {
          await onMessage()
        }
      }
      handleMessage()
    }, [lastMessage])

  React.useEffect(() => {
    if (lastResponse) {
      onResponse()
    }
  }, [lastResponse, onResponse])

  React.useEffect(() => {
    onInit()
  }, [onInit])

  return (
    <WrapperComponent cssVariables={theme as Record<string, string>}>
      <AiEditor
        content={content}
        onProcess={handleAIProcess}
        aiResult={aiResult}
        onTypeChange={setSelectedType}
        lastMessage={lastMessage}
        setLastMessage={setLastMessage}
        messageHistory={messageHistory as Array<{ role: 'user' | 'assistant'; content: string }>}
        setMessageHistory={setMessageHistory}
      />
      {/* chat */}
      {selectedType === 'askAi' && (
      <div style={{ display: selectedType === 'askAi' ? 'block' : 'none' }}>
      <ExpandableChatDemo
        _lastMessage={lastMessage}
        setLastMessage={setLastMessage}
        _messageHistory={messageHistory as Array<{ role: 'user' | 'assistant'; content: string }>}
        setMessageHistory={setMessageHistory}
        placeholder={placeholder || 'Type your message...'}
        lastResponse={lastResponse}
        avatarSrc={avatarSrc}
      />
    </div>    
    )}
  </WrapperComponent>
)
}

const WrapperComponent = ({
  cssVariables,
  children
}: {
  cssVariables: Record<string, string>
  children: React.ReactNode
}) => {
  return (
    <div
      style={{
        ...Object.fromEntries(
          Object.entries(cssVariables).map(([k, v]) => [k, v])
        )
      }}
    >
      {children}
    </div>
  )
}