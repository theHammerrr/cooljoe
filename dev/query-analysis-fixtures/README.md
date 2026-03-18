# Query Analysis Fixture Lab

This folder gives you a controlled database for validating whether the analyzer produces useful recommendations.

## Why this exists

A query analyzer is easy to fake on tiny tables.

If the table has 30 rows, PostgreSQL can often return results quickly even with a sequential scan and no helpful indexes. That does **not** mean the recommendation engine is good. It only means the dataset is too small to make the planner's tradeoffs interesting.

To test this feature seriously, you need:

- enough rows for scan vs index choices to matter
- skewed data so some predicates are selective and some are not
- a few deliberately bad access patterns
- one tiny-table case to prove that not every missing index is actually worth fixing

This lab gives you exactly that.

## What gets created

The seed script creates:

- `public.qa_customers`
- `public.qa_orders`
- `public.qa_line_items`
- `public.qa_events`
- `public.qa_tiny_lookup`

It intentionally includes:

- a missing filter index on `qa_events.customer_id`
- a composite index with the wrong leading column on `qa_orders(status, customer_id)`
- a plain email index that can be defeated with `LOWER(email)`
- a join table without an index on `qa_line_items.order_id`
- a tiny lookup table where a sequential scan is usually fine

## Two Docker choices

Use the standard compose file when you want the normal app setup:

```powershell
docker compose up -d
```

Use the dedicated query-analysis compose file when you want the seeded large-data lab:

```powershell
docker compose -f docker-compose.query-analysis.yml up -d
```

That second file starts:

- the normal app database
- the seeded `fixture-db`
- the API already pointed at the fixture database
- the web app

## Start only the fixture database

```powershell
docker compose -f docker-compose.query-analysis.yml up -d fixture-db
```

The fixture database URL is:

```text
postgresql://fixture_admin:fixture_password@localhost:5434/query_analysis_lab
```

## Point cooljoe at the lab manually

Set your API environment so the analyzer uses the fixture database as the target database:

```powershell
$env:PROJECT_DATABASE_URL="postgresql://fixture_admin:fixture_password@localhost:5434/query_analysis_lab"
```

Then start the app as usual.

You only need this manual step if you are **not** using [docker-compose.query-analysis.yml](/F:/GitRepos/cooljoe/docker-compose.query-analysis.yml). That compose file already points the API at the seeded lab by default.

## Run the benchmark cases

The runner will:

1. refresh the schema snapshot
2. allowlist the fixture tables for the current API session
3. post each SQL case to `/api/copilot/analyze-query`
4. compare the returned findings against the expected finding titles

Run all cases:

```powershell
.\scripts\run-query-analysis-fixtures.ps1
```

Run a single case:

```powershell
.\scripts\run-query-analysis-fixtures.ps1 -Case wrong_composite_index_order
```

Use runtime-backed analysis:

```powershell
.\scripts\run-query-analysis-fixtures.ps1 -Mode explain_analyze
```

## Cases included

- `missing_index_filter`
- `wrong_composite_index_order`
- `function_wrapped_predicate`
- `leading_wildcard_like`
- `join_missing_index`
- `sort_without_support`
- `tiny_table_planner_is_fine`

## How to judge whether the analyzer is actually good

The runner checks that the expected categories of recommendation appear. That is only the first step.

For real validation, also do this:

1. run a case and note the key finding
2. apply the likely remediation manually
3. rerun the same query with `EXPLAIN ANALYZE`
4. confirm the plan or runtime actually improves

Examples:

- add `CREATE INDEX qa_events_customer_id_idx ON public.qa_events (customer_id);`
- rerun `missing_index_filter`
- compare before/after scan choice and timing

- add `CREATE INDEX qa_line_items_order_id_idx ON public.qa_line_items (order_id);`
- rerun `join_missing_index`
- compare before/after join behavior

That before/after check is what proves the recommendation was useful instead of merely plausible.
