SELECT
    order_id,
    customer_id,
    status,
    created_at
FROM public.qa_orders
WHERE customer_id = 4242
LIMIT 50;
