export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[]

export interface TlbtTool<Input extends Record<string, unknown> = Record<string, unknown>> {
  name: string
  description: string
  input: Record<string, unknown>
  run(input: Input): Promise<JsonValue> | JsonValue
}

export interface TlbtPlugin {
  tools: TlbtTool[]
}

export declare function defineTool<TInput extends Record<string, unknown>>(
  tool: TlbtTool<TInput>
): TlbtTool<TInput>

export declare function definePlugin(plugin: TlbtPlugin): TlbtPlugin
