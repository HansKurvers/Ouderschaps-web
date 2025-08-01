export interface TemplateContext {
  [key: string]: string | number | boolean | undefined
}

export interface TemplateProcessorOptions {
  // Map of variable names to their values
  variables: TemplateContext
  // Optional custom replacements that override default processing
  customReplacements?: Record<string, string>
}

/**
 * Process template text by replacing variables with actual values
 * Supports case-insensitive matching and various formats like {VAR}, {var}, {Var}
 */
export function processTemplateText(
  templateText: string,
  options: TemplateProcessorOptions
): string {
  let processedText = templateText
  
  // First apply custom replacements if provided
  if (options.customReplacements) {
    Object.entries(options.customReplacements).forEach(([pattern, replacement]) => {
      processedText = processedText.replace(
        new RegExp(pattern.replace(/[{}]/g, '\\$&'), 'gi'),
        replacement
      )
    })
  }
  
  // Then process standard variables
  Object.entries(options.variables).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    
    const stringValue = String(value)
    
    // Replace all case variations of the variable
    // e.g., {KIND}, {kind}, {Kind} will all be replaced
    const patterns = [
      `{${key}}`,                                    // exact case
      `{${key.toUpperCase()}}`,                      // uppercase
      `{${key.toLowerCase()}}`,                      // lowercase
      `{${key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}}` // capitalize first
    ]
    
    // Remove duplicates
    const uniquePatterns = [...new Set(patterns)]
    
    uniquePatterns.forEach(pattern => {
      processedText = processedText.replace(
        new RegExp(pattern.replace(/[{}]/g, '\\$&'), 'g'),
        stringValue
      )
    })
  })
  
  return processedText
}

/**
 * Helper function to create common Dutch language replacements
 */
export function createDutchPluralReplacements(isPlural: boolean): Record<string, string> {
  return {
    '{zijn/haar}': isPlural ? 'hun' : 'zijn/haar',
    '{is/zijn}': isPlural ? 'zijn' : 'is',
    '{verblijft/verblijven}': isPlural ? 'verblijven' : 'verblijft',
    '{heeft/hebben}': isPlural ? 'hebben' : 'heeft',
    '{gaat/gaan}': isPlural ? 'gaan' : 'gaat',
    '{wordt/worden}': isPlural ? 'worden' : 'wordt'
  }
}

/**
 * Format a list of names in Dutch
 * Examples:
 * - [] -> "het kind"
 * - ["Emma"] -> "Emma"
 * - ["Emma", "Lucas"] -> "Emma en Lucas"
 * - ["Emma", "Lucas", "Sophie"] -> "Emma, Lucas en Sophie"
 */
export function formatDutchNameList(names: string[], defaultText = 'het kind'): string {
  if (names.length === 0) return defaultText
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} en ${names[1]}`
  
  const lastChild = names[names.length - 1]
  const otherChildren = names.slice(0, -1).join(', ')
  return `${otherChildren} en ${lastChild}`
}