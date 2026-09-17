# BigQuery SQL Analytics Views & Materialization Guide

This directory contains standard Google SQL view definitions and materialization strategies for flattening raw Firestore JSON streaming data into analytical tables for Looker Studio dashboards in the **Milous Project** NGO application.

---

## 1. Views Definition Summary (`bigquery_views.sql`)

### View 1: `vw_expenses_bva` (Budget vs Actuals)
- **Source Table**: `milous_project_raw.expenses_raw_latest`
- **Output Columns**: `expense_id`, `project_id`, `total_amount`, `currency`, `usd_equivalent`, `status`, `description`, `category`, `vendor`, `date_incurred`, `submitted_by_id`, `donor_code`, `allocation_percentage`, `allocated_amount`, `budget_line_code`.
- **Transformation**: Uses `JSON_EXTRACT_ARRAY(data, '$.donorAllocations')` combined with `UNNEST(...)` to expand multi-donor fractional cost splits into individual relational records. An expense divided across 3 donors produces 3 distinct rows for grant reporting.

### View 2: `vw_indicators_progress` (M&E LogFrame Tracking)
- **Source Table**: `milous_project_raw.indicators_raw_latest`
- **Output Columns**: `indicator_id`, `project_id`, `code`, `title`, `description`, `unit`, `disaggregation`, `baseline`, `target`, `actual_value`, `percent_achieved`, `achievement_status`.
- **Transformation**: Uses `JSON_EXTRACT_SCALAR` for metric fields and `SAFE_DIVIDE(actual_value, target) * 100` to calculate progress percentage safely without division-by-zero errors.

---

## 2. Query Optimization & Materialization Strategies

When raw JSON views grow large, re-parsing JSON strings on every Looker Studio refresh can increase query costs and latency. To optimize performance:

### Option A: Scheduled Queries (Recommended)
Schedule a daily or hourly BigQuery Scheduled Query that materializes the view into a physical partitioned table.

```sql
CREATE OR REPLACE TABLE `milous_analytics.tbl_expenses_bva_materialized`
PARTITION BY DATE(date_incurred)
CLUSTER BY project_id, donor_code AS
SELECT * FROM `milous_analytics.vw_expenses_bva`;
```

**gcloud Scheduled Query Command**:
```bash
bq query \
  --use_legacy_sql=false \
  --destination_table=milous_analytics.tbl_expenses_bva_materialized \
  --display_name="Hourly Materialize Expenses BVA" \
  --schedule="every 1 hours" \
  --replace=true \
  'SELECT * FROM `milous_analytics.vw_expenses_bva`'
```

### Option B: Incremental Materialized Views
For near real-time dashboards without full table scans, create incremental BigQuery Materialized Views over pre-aggregated key metrics:

```sql
CREATE MATERIALIZED VIEW `milous_analytics.mv_donor_expenditure_summary`
AS SELECT
  project_id,
  donor_code,
  currency,
  SUM(allocated_amount) AS total_allocated_spent,
  COUNT(DISTINCT expense_id) AS total_invoices_logged
FROM
  `milous_analytics.vw_expenses_bva`
GROUP BY
  project_id, donor_code, currency;
```

---

## 3. Connecting to Looker Studio

1. In **Looker Studio**, click **Add Data** -> Select **BigQuery**.
2. Select Project `milous-project-ngo` -> Dataset `milous_analytics`.
3. Choose `vw_expenses_bva` (or `tbl_expenses_bva_materialized`).
4. Set default date dimension to `date_incurred` and breakdown dimension to `donor_code`.
