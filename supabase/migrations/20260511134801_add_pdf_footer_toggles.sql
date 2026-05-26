ALTER TABLE public.site_settings
ADD COLUMN show_rt_signature BOOLEAN DEFAULT true,
ADD COLUMN show_address BOOLEAN DEFAULT true,
ADD COLUMN show_professional_signature BOOLEAN DEFAULT true;
