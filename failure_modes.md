# Failure Modes

## 1. Tool Timeout Or Transient Failure

Response: every tool call is executed with a retry budget of three attempts and exponential backoff. Each failed attempt is written to `audit_logs` with the tool input, error, attempt number, and retry decision. If all attempts fail, confidence is lowered and the ticket follows the fallback or escalation path.

## 2. Malformed Or Missing Tool Data

Response: tool outputs are schema-checked before use. Missing customer, order, product, warranty, refund, cancellation, reply, or escalation fields are treated as invalid. The agent does not issue refunds or cancellations from invalid data; it lowers confidence and asks for clarification or escalates with the failed validation context.

## 3. Reasoning Chain Failure

Response: if the required customer/order/policy chain cannot provide enough verified context, the agent does not guess. It sends a targeted clarification request when identification is missing, or escalates with a structured summary when the policy requires human review, such as warranty claims, replacement requests, high-value refunds, social-engineering risk, or low confidence.
