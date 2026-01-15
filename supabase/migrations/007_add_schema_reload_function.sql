-- Create a function to reload the PostgREST schema cache
-- This sends a NOTIFY to the pgrst channel which triggers a schema reload

CREATE OR REPLACE FUNCTION reload_schema_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify PostgREST to reload its schema cache
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Grant execute permission to authenticated users
-- The API will restrict this to super_admin only
GRANT EXECUTE ON FUNCTION reload_schema_cache() TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION reload_schema_cache() IS 'Triggers a PostgREST schema cache reload. Use this after applying database migrations.';
