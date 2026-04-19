# Architecture

```text
Default files, uploaded JSON, or /api/import
        |
        v
Validation + Import Mapper
        |
        v
PostgreSQL
  tickets
  support_data_records
  import_errors
        |
        v
Agent Queue Processor
  - concurrent batches
  - optional LLM analysis
  - deterministic fallback NLP
  - confidence calibration
        |
        v
Tool Chain
  get_customer -> get_order -> search_knowledge_base -> get_product
  reads PostgreSQL only
        |
        v
Resolution Flow
  refund | warranty | cancellation | shipping | general | ambiguous
        |
        v
Actions
  check_refund_eligibility | issue_refund | cancel_order | send_reply | escalate
        |
        v
PostgreSQL audit_logs table
        |
        v
Frontend Admin Console + audit_log.json export
```

Imported data is the business source of truth. The default data folder is only one import source; uploaded datasets and external API imports follow the same validation and mapping path. Tools read customers, orders, products, and policy text from PostgreSQL so the agent can run against any valid dataset.
