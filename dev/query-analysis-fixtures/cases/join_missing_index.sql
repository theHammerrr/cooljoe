SELECT
    o.order_id,
    o.customer_id,
    li.product_sku,
    li.quantity
FROM public.qa_orders o
JOIN public.qa_line_items li ON li.order_id = o.order_id
WHERE o.customer_id = 4242
LIMIT 100;
