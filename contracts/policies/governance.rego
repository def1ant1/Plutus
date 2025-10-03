package plutus.governance

# =============================================
# Policy: Configuration Governance Guardrails
# Version: 2025.1.0
# Description:
#   Enforces segregation-of-duties, change justification, and residency guardrails for
#   configuration promotions. This module is executed before emitting `config.changed`
#   events and can be reused by offline change management tooling.
#
# Input Contract (json):
# {
#   "actor": {"id": "user_123", "roles": ["tenant-admin"], "residency": "US"},
#   "change": {
#     "configSetId": "cfg_xyz",
#     "status": "PROMOTE|RETIRE",
#     "targetResidency": "US",
#     "justification": "string",
#     "previousApprovedBy": "user_abc"
#   },
#   "controls": {
#     "requiresDualApproval": true,
#     "maxPromotionPerDay": 5,
#     "promotionsToday": 2
#   }
# }
#
# Output Contract (json):
# {
#   "decision": "ALLOW|DENY|REVIEW",
#   "advice": ["string"],
#   "controlsTriggered": ["string"]
# }
#
# Implementation notes:
#   - Residency mismatches trigger DENY to prevent unlawful cross-border activation.
#   - Dual approval logic ensures the promoting user differs from previous approver.
#   - Rate limits protect against runaway configuration churn.

default evaluation := {
  "decision": "DENY",
  "advice": ["Evaluation not executed"],
  "controlsTriggered": []
}

evaluation := allow_response {
  residency_guardrail
  dual_approval
  rate_limit
  justification_present
}

evaluation := review_response {
  residency_guardrail
  not dual_approval
}

allow_response := {
  "decision": "ALLOW",
  "advice": [],
  "controlsTriggered": []
}

review_response := {
  "decision": "REVIEW",
  "advice": ["Secondary approval required"],
  "controlsTriggered": ["dual-approval"]
}

residency_guardrail {
  input.change.targetResidency == input.actor.residency
}

dual_approval {
  not input.controls.requiresDualApproval
}

dual_approval {
  input.controls.requiresDualApproval
  input.change.previousApprovedBy != input.actor.id
}

rate_limit {
  input.controls.promotionsToday < input.controls.maxPromotionPerDay
}

justification_present {
  count(trim(input.change.justification)) > 0
}

trim(s) = t {
  t := trim_space(s)
}
