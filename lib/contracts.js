const crypto = require("crypto")

const ERROR_CODES = {
  invalidRequest: "INVALID_REQUEST",
  toolNotFound: "TOOL_NOT_FOUND",
  validationError: "VALIDATION_ERROR",
  policyViolation: "POLICY_VIOLATION",
  toolTimeout: "TOOL_TIMEOUT",
  toolExecutionFailed: "TOOL_EXECUTION_FAILED",
  internalError: "INTERNAL_ERROR"
}

function createInvocationId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `inv-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function successEnvelope(data, meta) {
  return {
    ok: true,
    data,
    meta
  }
}

function errorEnvelope(code, message, details, meta) {
  const payload = {
    ok: false,
    error: { code, message },
    meta
  }
  if (details !== undefined) {
    payload.error.details = details
  }
  return payload
}

function statusCodeForErrorCode(code) {
  if (code === ERROR_CODES.invalidRequest) return 400
  if (code === ERROR_CODES.validationError) return 400
  if (code === ERROR_CODES.toolNotFound) return 404
  if (code === ERROR_CODES.policyViolation) return 403
  if (code === ERROR_CODES.toolTimeout) return 504
  return 500
}

module.exports = {
  ERROR_CODES,
  createInvocationId,
  successEnvelope,
  errorEnvelope,
  statusCodeForErrorCode
}
