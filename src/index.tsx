import React from 'react'
import { type FC } from 'react'
import './output.css'
import { Retool } from '@tryretool/custom-component-support'
import { Button } from './components/ui/button'

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

export const BBBBB: FC = () => {
  const [name, _setName] = Retool.useStateString({
    name: 'name'
  })

  const [theme, _setTheme] = Retool.useStateObject({
    name: 'theme'
  })

  return (
    <div>
      <WrapperComponent cssVariables={theme}>text</WrapperComponent>
    </div>
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
