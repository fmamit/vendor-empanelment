
-- Add 'sent_back' to vendor_status enum
ALTER TYPE vendor_status ADD VALUE 'sent_back' BEFORE 'approved';
