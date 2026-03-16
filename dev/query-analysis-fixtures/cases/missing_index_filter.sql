SELECT
    event_id,
    customer_id,
    event_type,
    created_at
FROM public.qa_events
WHERE customer_id = 4242
ORDER BY created_at DESC;
