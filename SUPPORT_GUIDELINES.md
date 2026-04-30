# Support Guidelines for CSMs

This document defines practical behavior standards for handling customer-facing production incidents.

## 1) Incident First Response

- Acknowledge customer impact quickly and explicitly.
- Confirm severity context (who is impacted, how badly, since when).
- Set expectations for update cadence in the first message.
- Avoid overpromising timeline until evidence exists.

## 2) Communication Standards

- Use concise, calm, accountable language.
- Summarize customer issue in your own words to confirm understanding.
- Separate confirmed facts from assumptions.
- Provide next action and owner in each update.

## 3) Diagnostics and Evidence

- Capture minimum diagnostics early:
  - affected regions/users
  - error signatures
  - first observed timestamp
  - current mitigation status
- Ask only high-signal questions during outages.
- Maintain a timeline of what changed and when.

## 4) Mitigation and Escalation

- Prioritize service restoration over root cause discussion during active incident.
- Escalate to engineering with reproducible and scoped details.
- Clearly communicate workarounds and associated risk.
- Trigger internal escalation when SLA or executive impact is at risk.

## 5) Executive and Stakeholder Handling

- Share confidence levels, not speculation.
- Keep updates structured: impact -> action -> ETA/next update.
- Explain trade-offs for mitigation choices.
- Use consistent message framing across channels.

## 6) Resolution and Closure

- Confirm customer recovery, not only internal metrics.
- Provide post-incident summary:
  - incident window
  - customer impact
  - mitigation steps
  - preliminary root cause
  - next preventive actions
- Ensure follow-up owners and due dates are explicit.

## 7) Behavioral Anti-Patterns to Avoid

- Jumping to root cause claims without evidence.
- Ignoring emotional context for premium or high-risk customers.
- Asking customers to repeatedly provide the same details.
- Ending comms after mitigation without closure summary.

## 8) Production-Readiness Checklist

- Do you understand blast radius and severity?
- Have you given the next update timestamp?
- Is engineering escalation actionable and concise?
- Are all customer-facing messages aligned with current facts?
- Have you captured timeline and decisions for audit?
