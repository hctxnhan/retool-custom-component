import './output.css'
import React, { FC } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import ObjectMerger from './components/object-merger/object-merger'
import { PropertyConfig } from './lib/object-merger-utils'
import { WrapperComponent } from './retool-components/wrapper-component'

export const RetoolersObjectMerger: FC = () => {
  const [objects, _setObjects] = Retool.useStateArray({
    name: 'objects'
  })

  const [config, _setConfig] = Retool.useStateArray({
    name: 'config'
  })

  const [theme, _setTheme] = Retool.useStateObject({
    name: 'theme'
  })

  const [result, _setResult] = Retool.useStateObject({
    name: 'result',
    inspector: 'hidden'
  })

  const onComplete = Retool.useEventCallback({ name: 'Complete' })

  const onMergeComplete = (result: Record<string, unknown>) => {
    _setResult(result)
    onComplete()
  }

  return (
    <div>
      <WrapperComponent cssVariables={theme}>
        <ObjectMerger
          objects={objects as unknown as Record<string, unknown>[]}
          configuration={config as unknown as PropertyConfig[]}
          onMergeComplete={onMergeComplete}
        />
      </WrapperComponent>
    </div>
  )
}
