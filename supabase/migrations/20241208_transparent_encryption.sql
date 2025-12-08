-- Migration: Transparent Encryption for Students (User ID: xbxneekbhmabnpxulglt)

-- 1. PGCrypto Extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Helper Functions (Key Encapsulation)
-- WARN: Change the key in production! using Vault or similar is recommended.
-- Here we encapsulate the key in SECURITY DEFINER functions so it's not visible to normal users.

CREATE OR REPLACE FUNCTION public.encrypt_text(input_text text) 
RETURNS bytea AS $$
BEGIN
  IF input_text IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_encrypt(input_text, 'moadream_assignment_secret_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_text(input_data bytea) 
RETURNS text AS $$
BEGIN
  IF input_data IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(input_data, 'moadream_assignment_secret_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.encrypt_array(input_array text[]) 
RETURNS bytea AS $$
BEGIN
  IF input_array IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_encrypt(array_to_json(input_array)::text, 'moadream_assignment_secret_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_array(input_data bytea) 
RETURNS text[] AS $$
BEGIN
  IF input_data IS NULL THEN RETURN NULL; END IF;
  RETURN (
    SELECT array_agg(x) 
    FROM json_array_elements_text(
        pgp_sym_decrypt(input_data, 'moadream_assignment_secret_key')::json
    ) t(x)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Rename Table
-- renaming 'students' to 'students_secure'
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
    ALTER TABLE public.students RENAME TO students_secure;
  END IF;
END $$;


-- 4. Convert Data (Using temporary columns)

-- (A) behaviors
ALTER TABLE public.students_secure ADD COLUMN IF NOT EXISTS behaviors_encrypted BYTEA;
-- Only update if not already encrypted (null check on encrypted col)
UPDATE public.students_secure SET behaviors_encrypted = encrypt_array(behaviors) WHERE behaviors IS NOT NULL AND behaviors_encrypted IS NULL;
-- Drop original column if exists
ALTER TABLE public.students_secure DROP COLUMN IF EXISTS behaviors;
-- Rename encrypted column to original name
ALTER TABLE public.students_secure RENAME COLUMN behaviors_encrypted TO behaviors;

-- (B) special_notes
ALTER TABLE public.students_secure ADD COLUMN IF NOT EXISTS special_notes_encrypted BYTEA;
UPDATE public.students_secure SET special_notes_encrypted = encrypt_array(special_notes) WHERE special_notes IS NOT NULL AND special_notes_encrypted IS NULL;
ALTER TABLE public.students_secure DROP COLUMN IF EXISTS special_notes;
ALTER TABLE public.students_secure RENAME COLUMN special_notes_encrypted TO special_notes;

-- (C) custom_behavior
ALTER TABLE public.students_secure ADD COLUMN IF NOT EXISTS custom_behavior_encrypted BYTEA;
UPDATE public.students_secure SET custom_behavior_encrypted = encrypt_text(custom_behavior) WHERE custom_behavior IS NOT NULL AND custom_behavior_encrypted IS NULL;
ALTER TABLE public.students_secure DROP COLUMN IF EXISTS custom_behavior;
ALTER TABLE public.students_secure RENAME COLUMN custom_behavior_encrypted TO custom_behavior;

-- (D) custom_special_note
ALTER TABLE public.students_secure ADD COLUMN IF NOT EXISTS custom_special_note_encrypted BYTEA;
UPDATE public.students_secure SET custom_special_note_encrypted = encrypt_text(custom_special_note) WHERE custom_special_note IS NOT NULL AND custom_special_note_encrypted IS NULL;
ALTER TABLE public.students_secure DROP COLUMN IF EXISTS custom_special_note;
ALTER TABLE public.students_secure RENAME COLUMN custom_special_note_encrypted TO custom_special_note;

-- (E) memo
ALTER TABLE public.students_secure ADD COLUMN IF NOT EXISTS memo_encrypted BYTEA;
UPDATE public.students_secure SET memo_encrypted = encrypt_text(memo) WHERE memo IS NOT NULL AND memo_encrypted IS NULL;
ALTER TABLE public.students_secure DROP COLUMN IF EXISTS memo;
ALTER TABLE public.students_secure RENAME COLUMN memo_encrypted TO memo;


-- 5. Create Updatable View
-- Use 'security_invoker = true' to enforce RLS of the underlying table (students_secure) based on the user calling the view.
CREATE OR REPLACE VIEW public.students WITH (security_invoker = true) AS
SELECT
    id,
    project_id,
    name,
    current_class,
    target_class,
    gender,
    decrypt_array(behaviors) AS behaviors,
    decrypt_array(special_notes) AS special_notes,
    decrypt_text(custom_behavior) AS custom_behavior,
    decrypt_text(custom_special_note) AS custom_special_note,
    decrypt_text(memo) AS memo,
    created_by,
    created_at,
    student_number,
    original_class
FROM public.students_secure;


-- 6. Create Trigger for View Updates
CREATE OR REPLACE FUNCTION public.handle_students_view()
RETURNS TRIGGER AS $$
DECLARE
    inserted_record public.students_secure%ROWTYPE;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.students_secure (
            project_id, name, current_class, target_class, gender,
            student_number, original_class, created_by,
            behaviors, special_notes, custom_behavior, custom_special_note, memo
        ) VALUES (
            NEW.project_id, NEW.name, NEW.current_class, NEW.target_class, NEW.gender,
            NEW.student_number, NEW.original_class, COALESCE(NEW.created_by, auth.uid()),
            encrypt_array(NEW.behaviors),
            encrypt_array(NEW.special_notes),
            encrypt_text(NEW.custom_behavior),
            encrypt_text(NEW.custom_special_note),
            encrypt_text(NEW.memo)
        ) RETURNING * INTO inserted_record;
        
        -- Map generated fields back to NEW
        NEW.id := inserted_record.id;
        NEW.created_at := inserted_record.created_at;
        NEW.created_by := inserted_record.created_by;
        -- Other fields are already in NEW (the plaintext input)
        
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE public.students_secure SET
            project_id = NEW.project_id,
            name = NEW.name,
            current_class = NEW.current_class,
            target_class = NEW.target_class,
            gender = NEW.gender,
            student_number = NEW.student_number,
            original_class = NEW.original_class,
            behaviors = encrypt_array(NEW.behaviors),
            special_notes = encrypt_array(NEW.special_notes),
            custom_behavior = encrypt_text(NEW.custom_behavior),
            custom_special_note = encrypt_text(NEW.custom_special_note),
            memo = encrypt_text(NEW.memo)
        WHERE id = OLD.id;
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM public.students_secure WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS students_view_trigger ON public.students;
CREATE TRIGGER students_view_trigger
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.handle_students_view();
