DROP TABLE IF EXISTS public.qa_line_items;
DROP TABLE IF EXISTS public.qa_events;
DROP TABLE IF EXISTS public.qa_orders;
DROP TABLE IF EXISTS public.qa_tiny_lookup;
DROP TABLE IF EXISTS public.qa_customers;

CREATE TABLE public.qa_customers (
    customer_id integer PRIMARY KEY,
    email text NOT NULL,
    segment text NOT NULL,
    region text NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX qa_customers_email_idx ON public.qa_customers (email);

INSERT INTO public.qa_customers (customer_id, email, segment, region, created_at)
SELECT
    gs,
    format('customer%s@example.com', gs),
    CASE
        WHEN gs % 15 = 0 THEN 'vip'
        WHEN gs % 5 = 0 THEN 'business'
        ELSE 'standard'
    END,
    CASE
        WHEN gs % 4 = 0 THEN 'north'
        WHEN gs % 4 = 1 THEN 'south'
        WHEN gs % 4 = 2 THEN 'west'
        ELSE 'east'
    END,
    now() - make_interval(days => gs % 365)
FROM generate_series(1, 50000) AS gs;

CREATE TABLE public.qa_orders (
    order_id bigint PRIMARY KEY,
    customer_id integer NOT NULL REFERENCES public.qa_customers(customer_id),
    status text NOT NULL,
    created_at timestamptz NOT NULL,
    priority integer NOT NULL,
    total_cents integer NOT NULL,
    notes text NOT NULL
);

CREATE INDEX qa_orders_status_customer_idx ON public.qa_orders (status, customer_id);
CREATE INDEX qa_orders_created_at_idx ON public.qa_orders (created_at DESC);

INSERT INTO public.qa_orders (order_id, customer_id, status, created_at, priority, total_cents, notes)
SELECT
    gs,
    CASE
        WHEN gs % 20 = 0 THEN 4242
        WHEN gs % 33 = 0 THEN 7777
        ELSE ((gs - 1) % 50000) + 1
    END,
    CASE
        WHEN gs % 10 = 0 THEN 'cancelled'
        WHEN gs % 3 = 0 THEN 'processing'
        ELSE 'complete'
    END,
    now() - make_interval(hours => gs % 12000),
    (gs % 5) + 1,
    1000 + ((gs * 37) % 25000),
    repeat('order-note ', 4)
FROM generate_series(1, 300000) AS gs;

CREATE TABLE public.qa_line_items (
    line_item_id bigserial PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES public.qa_orders(order_id),
    product_sku text NOT NULL,
    quantity integer NOT NULL,
    price_cents integer NOT NULL
);

INSERT INTO public.qa_line_items (order_id, product_sku, quantity, price_cents)
SELECT
    ((gs - 1) % 300000) + 1,
    format('SKU-%s', ((gs - 1) % 5000) + 1),
    ((gs - 1) % 5) + 1,
    500 + ((gs * 19) % 10000)
FROM generate_series(1, 450000) AS gs;

CREATE TABLE public.qa_events (
    event_id bigserial PRIMARY KEY,
    customer_id integer NOT NULL REFERENCES public.qa_customers(customer_id),
    event_type text NOT NULL,
    created_at timestamptz NOT NULL,
    source text NOT NULL,
    payload text NOT NULL
);

CREATE INDEX qa_events_created_at_idx ON public.qa_events (created_at DESC);

INSERT INTO public.qa_events (customer_id, event_type, created_at, source, payload)
SELECT
    CASE
        WHEN gs % 18 = 0 THEN 4242
        WHEN gs % 41 = 0 THEN 7777
        ELSE ((gs - 1) % 50000) + 1
    END,
    CASE
        WHEN gs % 11 = 0 THEN 'refund'
        WHEN gs % 3 = 0 THEN 'checkout'
        ELSE 'view'
    END,
    now() - make_interval(minutes => gs % 800000),
    CASE
        WHEN gs % 4 = 0 THEN 'web'
        WHEN gs % 4 = 1 THEN 'mobile'
        WHEN gs % 4 = 2 THEN 'api'
        ELSE 'batch'
    END,
    repeat('event-payload ', 6)
FROM generate_series(1, 400000) AS gs;

CREATE TABLE public.qa_tiny_lookup (
    lookup_id integer PRIMARY KEY,
    code text NOT NULL,
    description text NOT NULL
);

INSERT INTO public.qa_tiny_lookup (lookup_id, code, description)
SELECT
    gs,
    format('L%02s', gs),
    format('Tiny lookup row %s', gs)
FROM generate_series(1, 32) AS gs;

ANALYZE public.qa_customers;
ANALYZE public.qa_orders;
ANALYZE public.qa_line_items;
ANALYZE public.qa_events;
ANALYZE public.qa_tiny_lookup;
