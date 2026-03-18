SELECT
    customer_id,
    email,
    segment
FROM public.qa_customers
WHERE LOWER(email) = 'customer4242@example.com';
