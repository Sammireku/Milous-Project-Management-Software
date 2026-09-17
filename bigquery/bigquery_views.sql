-- ==============================================================================
-- Milous Project - BigQuery Data Transformation Views
-- Transforms raw Firestore JSON exports ("Stream Firestore to BigQuery" extension)
-- into flattened, structured relational schemas for Looker Studio dashboards.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- View 1: vw_expenses_bva (Budget vs Actuals Multi-Donor Cost Allocation)
-- Unnests the JSON array 'donorAllocations' to produce one row per donor split.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW `milous_analytics.vw_expenses_bva` AS
SELECT
  JSON_EXTRACT_SCALAR(data, '$.id') AS expense_id,
  JSON_EXTRACT_SCALAR(data, '$.projectId') AS project_id,
  CAST(JSON_EXTRACT_SCALAR(data, '$.totalAmount') AS NUMERIC) AS total_amount,
  JSON_EXTRACT_SCALAR(data, '$.currency') AS currency,
  CAST(JSON_EXTRACT_SCALAR(data, '$.usdEquivalent') AS NUMERIC) AS usd_equivalent,
  JSON_EXTRACT_SCALAR(data, '$.status') AS status,
  JSON_EXTRACT_SCALAR(data, '$.description') AS description,
  JSON_EXTRACT_SCALAR(data, '$.category') AS category,
  JSON_EXTRACT_SCALAR(data, '$.vendor') AS vendor,
  JSON_EXTRACT_SCALAR(data, '$.dateIncurred') AS date_incurred,
  JSON_EXTRACT_SCALAR(data, '$.submittedById') AS submitted_by_id,
  JSON_EXTRACT_SCALAR(data, '$.submittedByName') AS submitted_by_name,
  
  -- Flattened Donor Allocation Fields via UNNEST & JSON_EXTRACT_ARRAY
  JSON_EXTRACT_SCALAR(donor_allocation, '$.donorCode') AS donor_code,
  CAST(JSON_EXTRACT_SCALAR(donor_allocation, '$.percentage') AS NUMERIC) AS allocation_percentage,
  CAST(JSON_EXTRACT_SCALAR(donor_allocation, '$.allocatedAmount') AS NUMERIC) AS allocated_amount,
  JSON_EXTRACT_SCALAR(donor_allocation, '$.budgetLineCode') AS budget_line_code

FROM
  `milous_project_raw.expenses_raw_latest`,
  UNNEST(JSON_EXTRACT_ARRAY(data, '$.donorAllocations')) AS donor_allocation;


-- ------------------------------------------------------------------------------
-- View 2: vw_indicators_progress (M&E LogFrame Tracking)
-- Extracts baseline, target, actualValue and calculates percent_achieved.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW `milous_analytics.vw_indicators_progress` AS
SELECT
  JSON_EXTRACT_SCALAR(data, '$.id') AS indicator_id,
  JSON_EXTRACT_SCALAR(data, '$.projectId') AS project_id,
  JSON_EXTRACT_SCALAR(data, '$.code') AS code,
  JSON_EXTRACT_SCALAR(data, '$.title') AS title,
  JSON_EXTRACT_SCALAR(data, '$.description') AS description,
  JSON_EXTRACT_SCALAR(data, '$.unit') AS unit,
  JSON_EXTRACT_SCALAR(data, '$.disaggregation') AS disaggregation,
  CAST(JSON_EXTRACT_SCALAR(data, '$.baseline') AS NUMERIC) AS baseline,
  CAST(JSON_EXTRACT_SCALAR(data, '$.target') AS NUMERIC) AS target,
  CAST(JSON_EXTRACT_SCALAR(data, '$.actualValue') AS NUMERIC) AS actual_value,
  
  -- Progress Percentage Calculation: SAFE_DIVIDE protects against division by zero
  SAFE_DIVIDE(
    CAST(JSON_EXTRACT_SCALAR(data, '$.actualValue') AS NUMERIC),
    CAST(JSON_EXTRACT_SCALAR(data, '$.target') AS NUMERIC)
  ) * 100 AS percent_achieved,

  -- Status Classification
  CASE 
    WHEN SAFE_DIVIDE(CAST(JSON_EXTRACT_SCALAR(data, '$.actualValue') AS NUMERIC), CAST(JSON_EXTRACT_SCALAR(data, '$.target') AS NUMERIC)) >= 1.0 THEN 'TARGET_ACHIEVED'
    WHEN SAFE_DIVIDE(CAST(JSON_EXTRACT_SCALAR(data, '$.actualValue') AS NUMERIC), CAST(JSON_EXTRACT_SCALAR(data, '$.target') AS NUMERIC)) >= 0.75 THEN 'ON_TRACK'
    WHEN SAFE_DIVIDE(CAST(JSON_EXTRACT_SCALAR(data, '$.actualValue') AS NUMERIC), CAST(JSON_EXTRACT_SCALAR(data, '$.target') AS NUMERIC)) >= 0.50 THEN 'NEEDS_ATTENTION'
    ELSE 'OFF_TRACK'
  END AS achievement_status

FROM
  `milous_project_raw.indicators_raw_latest`;


-- ------------------------------------------------------------------------------
-- View 3: vw_timesheets_labor (Field Timesheets & Cost Allocation)
-- Unnests the daily tasks to capture labor distribution across activities and donor codes.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW `milous_analytics.vw_timesheets_labor` AS
SELECT
  JSON_EXTRACT_SCALAR(data, '$.id') AS timesheet_id,
  JSON_EXTRACT_SCALAR(data, '$.userId') AS user_id,
  JSON_EXTRACT_SCALAR(data, '$.userName') AS user_name,
  JSON_EXTRACT_SCALAR(data, '$.userRole') AS user_role,
  JSON_EXTRACT_SCALAR(data, '$.periodStart') AS period_start,
  JSON_EXTRACT_SCALAR(data, '$.periodEnd') AS period_end,
  JSON_EXTRACT_SCALAR(data, '$.status') AS status,
  CAST(JSON_EXTRACT_SCALAR(data, '$.totalHours') AS NUMERIC) AS total_hours,
  JSON_EXTRACT_SCALAR(data, '$.submittedAt') AS submitted_at,
  JSON_EXTRACT_SCALAR(data, '$.approvedAt') AS approved_at,
  JSON_EXTRACT_SCALAR(data, '$.approvedByName') AS approved_by_name,

  -- Unnest tasks array
  JSON_EXTRACT_SCALAR(task_entry, '$.id') AS task_id,
  JSON_EXTRACT_SCALAR(task_entry, '$.projectId') AS project_id,
  JSON_EXTRACT_SCALAR(task_entry, '$.date') AS task_date,
  CAST(JSON_EXTRACT_SCALAR(task_entry, '$.hours') AS NUMERIC) AS task_hours,
  JSON_EXTRACT_SCALAR(task_entry, '$.description') AS task_description,
  JSON_EXTRACT_SCALAR(task_entry, '$.activityType') AS activity_type,
  JSON_EXTRACT_SCALAR(task_entry, '$.donorCode') AS task_donor_code

FROM
  `milous_project_raw.timesheets_raw_latest`,
  UNNEST(JSON_EXTRACT_ARRAY(data, '$.tasks')) AS task_entry;


-- ------------------------------------------------------------------------------
-- View 4: vw_project_financial_summary (Portfolio Level Budget Performance)
-- Consolidates initial project metadata, donor funding, and active statuses.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW `milous_analytics.vw_project_financial_summary` AS
SELECT
  JSON_EXTRACT_SCALAR(data, '$.id') AS project_id,
  JSON_EXTRACT_SCALAR(data, '$.code') AS code,
  JSON_EXTRACT_SCALAR(data, '$.title') AS title,
  JSON_EXTRACT_SCALAR(data, '$.status') AS status,
  JSON_EXTRACT_SCALAR(data, '$.sector') AS sector,
  JSON_EXTRACT_SCALAR(data, '$.region') AS region,
  JSON_EXTRACT_SCALAR(data, '$.startDate') AS start_date,
  JSON_EXTRACT_SCALAR(data, '$.endDate') AS end_date,
  CAST(JSON_EXTRACT_SCALAR(data, '$.budget') AS NUMERIC) AS total_budget,
  
  -- Unnest donor allocation info
  JSON_EXTRACT_SCALAR(donor, '$.donorCode') AS primary_donor_code,
  CAST(JSON_EXTRACT_SCALAR(donor, '$.allocation') AS NUMERIC) AS primary_donor_funding

FROM
  `milous_project_raw.projects_raw_latest`,
  UNNEST(JSON_EXTRACT_ARRAY(data, '$.donors')) AS donor;

