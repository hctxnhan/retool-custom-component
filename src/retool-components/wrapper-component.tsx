import React from 'react'

interface WrapperComponentProps {
  cssVariables: Record<string, string>
  children: React.ReactNode
}

export const WrapperComponent = ({
  cssVariables,
  children
}: WrapperComponentProps) => {
  return (
    <div
      style={{
        ...Object.fromEntries(
          Object.entries(cssVariables).map(([k, v]) => [k, v])
        ),
        backgroundColor: 'transparent'
      }}
    >
      {children}
    </div>
  )
}
