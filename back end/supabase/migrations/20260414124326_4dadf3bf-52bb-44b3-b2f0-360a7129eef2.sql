
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- No direct client access needed — only edge functions (service role) interact with this table
CREATE POLICY "No public access" ON public.otp_codes FOR ALL USING (false);

-- Index for fast lookup
CREATE INDEX idx_otp_codes_email_code ON public.otp_codes (email, code);
