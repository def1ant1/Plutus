package plutus.abac

# =============================================
# Policy: Attribute-Based Access Control (Baseline)
# Version: 2025.1.0
# Description:
#   Authorizes access to intake, config, and IAM APIs by evaluating tenant, residency,
#   and principal attributes. The policy is designed to be consumed by the IAM service
#   and contract validation pipelines. Inputs are expected to follow the schema below.
#
# Input Contract (json):
# {
#   "principal": {
#     "id": "prn_123",
#     "type": "USER|SERVICE",
#     "roles": ["tenant-admin"],
#     "attributes": {"department": "risk"},
#     "residency": "US"
#   },
#   "tenant": {
#     "id": "tenant_us_retail",
#     "residency": "US",
#     "compliance": {"gdpr": false, "ccpa": true}
#   },
#   "resource": {
#     "type": "http",
#     "identifier": "POST /applications",
#     "residency": "US",
#     "scopes": ["intake.applications.write"]
#   }
# }
#
# Output Contract (json):
# {
#   "decision": "ALLOW|DENY|REVIEW",
#   "advice": ["string"],
#   "residencyEnforced": "US|EU|APAC"
# }
#
# Automated pipelines compile this module into OPA bundles and sign the artifact.
# Consumers MUST treat missing attributes as DENY to avoid privilege escalation.

default decision := {
  "decision": "DENY",
  "advice": ["Principal or tenant context missing"],
  "residencyEnforced": ""
}

decision := allow_decision {
  principal_allowed
  residency_aligned
  scopes_valid
}

allow_decision := {
  "decision": "ALLOW",
  "advice": [],
  "residencyEnforced": input.tenant.residency
}

principal_allowed {
  input.principal.type == "SERVICE"
  input.principal.attributes["service_tier"] == "SYSTEM"
}

principal_allowed {
  input.principal.type == "USER"
  input.principal.roles[_] == "tenant-admin"
}

principal_allowed {
  input.principal.roles[_] == "risk-analyst"
  startswith(input.resource.identifier, "GET /applications")
}

residency_aligned {
  input.resource.residency == input.tenant.residency
}

# Allow cross-zone read access if policy explicitly grants.
residency_aligned {
  input.principal.roles[_] == "global-platform"
  input.resource.residency != ""
}

scopes_valid {
  required := input.resource.scopes
  all(required, function(s) { some i; input.principal.scopes[i] == s })
}

# Utility: all elements satisfy predicate
all(xs, pred) {
  not exists_violation(xs, pred)
}

exists_violation(xs, pred) {
  some x in xs
  not pred(x)
}
