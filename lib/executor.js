const { validateInput } = require("../runtime")
const { evaluatePolicy } = require("./policy")
const {
  ERROR_CODES,
  createInvocationId,
  successEnvelope,
  errorEnvelope
} = require("./contracts")

function nowMs() {
  return Date.now()
}

function buildMeta({ invocationId, tool, transport, startedAtMs, finishedAtMs }) {
  return {
    invocationId,
    tool,
    transport,
    startedAt: new Date(startedAtMs).toISOString(),
    durationMs: Math.max(0, finishedAtMs - startedAtMs)
  }
}

function withTimeout(promise, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise
  }

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const err = new Error(`Tool execution timed out after ${timeoutMs}ms`)
        err.code = ERROR_CODES.toolTimeout
        reject(err)
      }, timeoutMs)
    })
  ])
}

function createExecutor(options = {}) {
  const tools = options.tools || {}
  const policy = options.policy || null
  const executionTimeoutMs = options.executionTimeoutMs
  const logger = typeof options.logger === "function" ? options.logger : null
  const transport = options.transport || "unknown"

  async function execute(toolName, input = {}) {
    const invocationId = createInvocationId()
    const startedAtMs = nowMs()

    const log = (event, payload = {}) => {
      if (!logger) return
      logger(event, {
        invocationId,
        tool: toolName,
        transport,
        ...payload
      })
    }

    if (typeof toolName !== "string" || toolName.length === 0) {
      const meta = buildMeta({
        invocationId,
        tool: toolName || null,
        transport,
        startedAtMs,
        finishedAtMs: nowMs()
      })
      return errorEnvelope(
        ERROR_CODES.invalidRequest,
        "Tool name must be a non-empty string",
        { tool: toolName },
        meta
      )
    }

    const tool = tools[toolName]
    if (!tool) {
      const meta = buildMeta({
        invocationId,
        tool: toolName,
        transport,
        startedAtMs,
        finishedAtMs: nowMs()
      })
      return errorEnvelope(
        ERROR_CODES.toolNotFound,
        "Tool not found",
        { tool: toolName },
        meta
      )
    }

    const payload = input === undefined ? {} : input
    const validation = validateInput(tool.input, payload)
    if (!validation.ok) {
      const meta = buildMeta({
        invocationId,
        tool: toolName,
        transport,
        startedAtMs,
        finishedAtMs: nowMs()
      })
      return errorEnvelope(
        ERROR_CODES.validationError,
        validation.error,
        { tool: toolName },
        meta
      )
    }

    const policyResult = evaluatePolicy(policy, toolName, payload)
    if (!policyResult.ok) {
      const meta = buildMeta({
        invocationId,
        tool: toolName,
        transport,
        startedAtMs,
        finishedAtMs: nowMs()
      })
      return errorEnvelope(
        ERROR_CODES.policyViolation,
        policyResult.message || "Tool execution blocked by policy",
        policyResult.details || { tool: toolName },
        meta
      )
    }

    log("tool.execution.started")

    try {
      const data = await withTimeout(Promise.resolve(tool.run(payload)), executionTimeoutMs)
      const meta = buildMeta({
        invocationId,
        tool: toolName,
        transport,
        startedAtMs,
        finishedAtMs: nowMs()
      })
      log("tool.execution.succeeded", { durationMs: meta.durationMs })
      return successEnvelope(data, meta)
    } catch (err) {
      const meta = buildMeta({
        invocationId,
        tool: toolName,
        transport,
        startedAtMs,
        finishedAtMs: nowMs()
      })
      const code =
        typeof err.code === "string" && err.code.length > 0
          ? err.code
          : ERROR_CODES.toolExecutionFailed
      const message = err.message || "Tool execution failed"
      log("tool.execution.failed", { durationMs: meta.durationMs, error: message, code })
      return errorEnvelope(code, message, { tool: toolName }, meta)
    }
  }

  return {
    execute
  }
}

module.exports = {
  createExecutor
}
