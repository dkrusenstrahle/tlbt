const path = require("path")

const POLICY_PRESETS = {
  dev: {
    denyToolPrefixes: [],
    enforceWorkspacePaths: false
  },
  balanced: {
    denyToolPrefixes: [],
    enforceWorkspacePaths: true
  },
  strict: {
    denyToolPrefixes: ["sys."],
    enforceWorkspacePaths: true
  }
}

function resolvePolicyPreset(name) {
  if (!name) return null
  const key = String(name).trim().toLowerCase()
  return POLICY_PRESETS[key] ? { ...POLICY_PRESETS[key] } : null
}

function mergePolicies(basePolicy = {}, overridePolicy = {}) {
  const merged = {
    ...basePolicy,
    ...overridePolicy
  }
  if (basePolicy.allowToolPrefixes || overridePolicy.allowToolPrefixes) {
    merged.allowToolPrefixes = overridePolicy.allowToolPrefixes || basePolicy.allowToolPrefixes
  }
  if (basePolicy.denyToolPrefixes || overridePolicy.denyToolPrefixes) {
    merged.denyToolPrefixes = overridePolicy.denyToolPrefixes || basePolicy.denyToolPrefixes
  }
  return merged
}

function normalizePolicy(policy = {}) {
  return {
    allowToolPrefixes: Array.isArray(policy.allowToolPrefixes)
      ? policy.allowToolPrefixes.filter(item => typeof item === "string" && item.length > 0)
      : null,
    denyToolPrefixes: Array.isArray(policy.denyToolPrefixes)
      ? policy.denyToolPrefixes.filter(item => typeof item === "string" && item.length > 0)
      : [],
    enforceWorkspacePaths: Boolean(policy.enforceWorkspacePaths),
    workspaceRoot: policy.workspaceRoot ? path.resolve(policy.workspaceRoot) : null
  }
}

function matchesPrefix(value, prefixes) {
  return prefixes.some(prefix => value === prefix || value.startsWith(prefix))
}

function gatherPathValues(input, found = []) {
  if (!input || typeof input !== "object") return found

  if (Array.isArray(input)) {
    for (const entry of input) {
      gatherPathValues(entry, found)
    }
    return found
  }

  for (const [key, value] of Object.entries(input)) {
    if ((key === "path" || key === "file") && typeof value === "string") {
      found.push(value)
    } else if (value && typeof value === "object") {
      gatherPathValues(value, found)
    }
  }

  return found
}

function pathIsInsideWorkspace(candidate, workspaceRoot) {
  const resolved = path.resolve(workspaceRoot, candidate)
  const relative = path.relative(workspaceRoot, resolved)
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

function evaluatePolicy(policy, toolName, input) {
  if (!policy) return { ok: true }
  const normalized = normalizePolicy(policy)

  if (normalized.allowToolPrefixes && !matchesPrefix(toolName, normalized.allowToolPrefixes)) {
    return {
      ok: false,
      message: `Tool "${toolName}" is not allowlisted`,
      details: { tool: toolName }
    }
  }

  if (normalized.denyToolPrefixes.length > 0 && matchesPrefix(toolName, normalized.denyToolPrefixes)) {
    return {
      ok: false,
      message: `Tool "${toolName}" is blocked by policy`,
      details: { tool: toolName }
    }
  }

  if (normalized.enforceWorkspacePaths && normalized.workspaceRoot) {
    const pathValues = gatherPathValues(input)
    for (const value of pathValues) {
      if (!pathIsInsideWorkspace(value, normalized.workspaceRoot)) {
        return {
          ok: false,
          message: "Path input must stay inside configured workspaceRoot",
          details: {
            tool: toolName,
            path: value,
            workspaceRoot: normalized.workspaceRoot
          }
        }
      }
    }
  }

  return { ok: true }
}

module.exports = {
  evaluatePolicy,
  normalizePolicy,
  resolvePolicyPreset,
  mergePolicies,
  POLICY_PRESETS
}
