-- One-off: align a B2B-linked profile with the personal mobile app (run in Supabase SQL editor).
-- Replace the UUID with the target user id if different.

UPDATE profiles
SET account_type = 'personal'
WHERE id = '62816506-6342-4bad-ba79-431c1947bd25';

-- Optional: force personal onboarding flow for this user
-- UPDATE profiles SET onboarding_completed = false WHERE id = '62816506-6342-4bad-ba79-431c1947bd25';
