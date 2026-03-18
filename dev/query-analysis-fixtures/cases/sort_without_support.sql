SELECT
    order_id,
    customer_id,
    priority,
    created_at
FROM public.qa_orders
WHERE customer_id = 4242
ORDER BY priority DESC
LIMIT 100;
