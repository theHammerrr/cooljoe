SELECT
    customer_id,
    email,
    segment
FROM public.qa_customers
WHERE email LIKE '%example.com'
LIMIT 100;
