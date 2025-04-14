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
      <WrapperComponent cssVariables={theme}>
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

  const [lastMessage, setLastMessage] = Retool.useStateString({
    name: 'lastMessage',
    inspector: 'hidden'
  })

  const [messageHistory, setMessageHistory] = Retool.useStateObject({
    name: 'messageHistory',
    inspector: 'hidden'
  })

  return (
    <div>
      <WrapperComponent cssVariables={theme}>
        <ExpandableChatDemo
          lastMessage={lastMessage}
          setLastMessage={setLastMessage}
          messageHistory={messageHistory}
          setMessageHistory={setMessageHistory}
        />
      </WrapperComponent>
    </div>
  )
}

export const AiEditorComponent: FC = () => {
  const [content, setContent] = React.useState('')

  const [theme, _setTheme] = Retool.useStateObject({
    name: 'theme'
  })

  const onProcess = Retool.useEventCallback({
    name: 'onProcess'
  })

  const [processData, setProcessData] = Retool.useStateObject({
    name: 'processData',
    inspector: 'hidden'
  })

  const [aiResult, setAIResult] = Retool.useStateString({
    name: 'aiResult'
  })

  const handleAIProcess = (data: {
    selectedContent: string
    selectedIndex: number
    promptContent: string
  }) => {
    setProcessData(data)
    onProcess()
  }

  return (
    <WrapperComponent cssVariables={theme}>
      <AiEditor
        content={content}
        onProcess={handleAIProcess}
        aiResult={aiResult}
      />
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