export type PropertyType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'object'

export interface SelectOption {
  label: string
  value: string | number | boolean
}

export interface PropertyConfig {
  label: string
  propertyKey: string
  type: PropertyType
  options?: SelectOption[] // For select, multiselect, radio types
  properties?: PropertyConfig[] // For nested objects
  path?: string // Full path for nested properties (e.g., "user.address.street")
  allowCustom?: boolean // Whether to allow custom values for select and multiselect types
}

// Helper functions for the ObjectMerger component

// Get nested property value using path
export const getNestedValue = (obj: Record<string, any>, path: string): any => {
  if (!obj) return undefined
  const keys = path.split('.')
  return keys.reduce(
    (o, key) => (o && typeof o === 'object' ? o[key] : undefined),
    obj
  )
}

// Set nested property value using path with proper deep cloning
export const setNestedValue = (
  obj: Record<string, any>,
  path: string,
  value: any
): Record<string, any> => {
  // Create a deep copy of the object to avoid reference issues
  const result = JSON.parse(JSON.stringify(obj))
  const keys = path.split('.')
  let current = result

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  // If the value is an object, ensure it's also deeply cloned
  const finalValue =
    typeof value === 'object' && value !== null
      ? JSON.parse(JSON.stringify(value))
      : value

  current[keys[keys.length - 1]] = finalValue
  return result
}

// Process configuration to add full paths for nested properties
export const processConfiguration = (
  config: PropertyConfig[],
  parentPath = ''
): PropertyConfig[] => {
  return config.map((item) => {
    const path = parentPath
      ? `${parentPath}.${item.propertyKey}`
      : item.propertyKey
    const newItem = { ...item, path }

    if (item.type === 'object' && item.properties) {
      newItem.properties = processConfiguration(item.properties, path)
    }

    return newItem
  })
}

// Flatten configuration for rendering in table
export const flattenConfiguration = (
  config: PropertyConfig[]
): PropertyConfig[] => {
  return config.reduce((acc: PropertyConfig[], item) => {
    acc.push(item)
    if (item.type === 'object' && item.properties) {
      acc.push(...flattenConfiguration(item.properties))
    }
    return acc
  }, [])
}

// Calculate nesting level from path
export const getNestingLevel = (path: string): number => {
  return path ? path.split('.').length - 1 : 0
}

// Convert a flat object with dot-notation paths back to a nested structure
export const unflattenObject = (
  flatObject: Record<string, any>
): Record<string, any> => {
  // First, filter out all dot notation paths to avoid duplicating data
  const result: Record<string, any> = {}

  // Get all the root level keys (those without dots)
  const rootKeys = Object.keys(flatObject).filter((key) => !key.includes('.'))

  // Process only the root keys at first
  rootKeys.forEach((key) => {
    if (flatObject[key] !== null && flatObject[key] !== undefined) {
      result[key] =
        typeof flatObject[key] === 'object' && flatObject[key] !== null
          ? JSON.parse(JSON.stringify(flatObject[key]))
          : flatObject[key]
    }
  })

  // Now process only the leaf keys (those with dots) to set their values
  const dotKeys = Object.keys(flatObject).filter((key) => key.includes('.'))

  // Skip keys that would overwrite existing object values
  // For example, if we have details.dimensions and details already exists as an object
  const keysToProcess = dotKeys.filter((key) => {
    // For each dot key, check if any parent key exists and is an object
    const parts = key.split('.')
    let currentPath = ''

    // Check each parent path
    for (let i = 0; i < parts.length - 1; i++) {
      if (i === 0) {
        currentPath = parts[0]
      } else {
        currentPath += '.' + parts[i]
      }

      // If this key exists in the object, and it's already populated with a complete object
      // from the root-level properties, then we can skip this dot-notation key
      if (
        getNestedValue(result, currentPath) !== undefined &&
        typeof getNestedValue(result, currentPath) === 'object'
      ) {
        // Check if this is a fully populated object
        // If the direct children of this path are also in our flat object, we should skip
        const prefix = currentPath + '.'
        const hasAnyOtherChildren = dotKeys.some(
          (otherKey) => otherKey !== key && otherKey.startsWith(prefix)
        )

        // If this is a complete object, we should skip this key
        if (!hasAnyOtherChildren) {
          return false
        }
      }
    }

    return true
  })

  // Process the filtered keys
  keysToProcess.forEach((key) => {
    if (flatObject[key] !== null && flatObject[key] !== undefined) {
      // Use setNestedValue to correctly build the structure
      setNestedValue(result, key, flatObject[key])
    }
  })

  return result
}
