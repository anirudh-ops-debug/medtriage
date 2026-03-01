
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.triage;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organ_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organ_allocations;
