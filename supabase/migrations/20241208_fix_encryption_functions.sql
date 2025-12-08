-- Fix: Qualify pgcrypto functions with 'extensions' schema
-- 'pgcrypto' is installed in 'extensions' namespace, but helper functions were assuming it's in search_path.

CREATE OR REPLACE FUNCTION public.encrypt_text(input_text text) 
RETURNS bytea AS $$
BEGIN
  IF input_text IS NULL THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_encrypt(input_text, 'moadream_assignment_secret_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_text(input_data bytea) 
RETURNS text AS $$
BEGIN
  IF input_data IS NULL THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_decrypt(input_data, 'moadream_assignment_secret_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.encrypt_array(input_array text[]) 
RETURNS bytea AS $$
BEGIN
  IF input_array IS NULL THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_encrypt(array_to_json(input_array)::text, 'moadream_assignment_secret_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_array(input_data bytea) 
RETURNS text[] AS $$
BEGIN
  IF input_data IS NULL THEN RETURN NULL; END IF;
  RETURN (
    SELECT array_agg(x) 
    FROM json_array_elements_text(
        extensions.pgp_sym_decrypt(input_data, 'moadream_assignment_secret_key')::json
    ) t(x)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
