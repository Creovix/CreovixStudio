-- Ensure custom command names can store Unicode (Arabic, etc.).
-- Older environments may have carried an ASCII-only check that rejected non-Latin names.

ALTER TABLE public.custom_chat_commands
  DROP CONSTRAINT IF EXISTS custom_chat_commands_name_format;

ALTER TABLE public.custom_chat_commands
  DROP CONSTRAINT IF EXISTS custom_chat_commands_name_ascii;

-- Recreate length checks explicitly so Unicode code points are measured with char_length.
ALTER TABLE public.custom_chat_commands
  DROP CONSTRAINT IF EXISTS custom_chat_commands_name_len;

ALTER TABLE public.custom_chat_commands
  ADD CONSTRAINT custom_chat_commands_name_len CHECK (char_length(name) BETWEEN 1 AND 32);

ALTER TABLE public.custom_chat_commands
  DROP CONSTRAINT IF EXISTS custom_chat_commands_response_len;

ALTER TABLE public.custom_chat_commands
  ADD CONSTRAINT custom_chat_commands_response_len CHECK (char_length(response) BETWEEN 1 AND 480);

-- Case-insensitive uniqueness for Latin; Arabic/other scripts are compared as stored.
DROP INDEX IF EXISTS custom_chat_commands_user_name_idx;
CREATE UNIQUE INDEX custom_chat_commands_user_name_idx
  ON public.custom_chat_commands (user_id, lower(name));
