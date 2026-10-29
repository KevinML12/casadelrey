-- One-time, idempotent publication of existing active CMS content.
-- Run through import_active_content.py after a protected pg_dump snapshot.
-- Source data is staged by import_active_content.py using a read-only connection.
-- Destination credentials never gain access to public; IDs are remapped.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';
SELECT pg_advisory_xact_lock(280102026);
CREATE TABLE IF NOT EXISTS cdr_render_qa.content_import_map (
  source_table text NOT NULL,
  source_id bigint NOT NULL,
  target_id bigint NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_table, source_id)
);
REVOKE ALL ON cdr_render_qa.content_import_map FROM PUBLIC;

CREATE FUNCTION pg_temp.import_content(t text, source_id bigint, payload jsonb, natural_key text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE target_id bigint; columns_sql text; assignments_sql text;
BEGIN
  SELECT m.target_id INTO target_id FROM cdr_render_qa.content_import_map m WHERE m.source_table=t AND m.source_id=import_content.source_id;
  IF target_id IS NOT NULL THEN RETURN target_id; END IF;
  IF natural_key IS NOT NULL AND payload->>natural_key IS NOT NULL THEN
    EXECUTE format('SELECT id FROM cdr_render_qa.%I WHERE deleted_at IS NULL AND %I::text = $1 ORDER BY id LIMIT 1',t,natural_key)
      INTO target_id USING payload->>natural_key;
  END IF;
  SELECT string_agg(format('%I',column_name),', ' ORDER BY ordinal_position),
         string_agg(format('%I = incoming.%I',column_name,column_name),', ' ORDER BY ordinal_position)
    INTO columns_sql,assignments_sql FROM information_schema.columns
    WHERE table_schema='cdr_render_qa' AND table_name=t AND column_name<>'id' AND payload ? column_name;
  IF target_id IS NULL THEN
    EXECUTE format('INSERT INTO cdr_render_qa.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::cdr_render_qa.%I,$1) RETURNING id',t,columns_sql,columns_sql,t)
      INTO target_id USING payload;
  ELSIF t <> 'users' THEN
    EXECUTE format('UPDATE cdr_render_qa.%I target SET %s FROM jsonb_populate_record(NULL::cdr_render_qa.%I,$1) incoming WHERE target.id=$2',t,assignments_sql,t)
      USING payload,target_id;
  END IF;
  INSERT INTO cdr_render_qa.content_import_map(source_table,source_id,target_id) VALUES(t,source_id,target_id);
  RETURN target_id;
END $$;

CREATE FUNCTION pg_temp.imported_id(t text, source_id bigint)
RETURNS bigint LANGUAGE sql AS $$ SELECT target_id FROM cdr_render_qa.content_import_map WHERE source_table=t AND source_id=$2 $$;

DO $$
DECLARE r record; p jsonb; imported bigint;
BEGIN
  -- Preserve existing account identities and roles for the established flows.
  -- Existing destination credentials remain unchanged; session/reset/refresh
  -- tokens are never transferred between environments.
  FOR r IN SELECT u.* FROM pg_temp.source_users u WHERE u.deleted_at IS NULL ORDER BY u.id LOOP
    p := to_jsonb(r) - ARRAY['reset_token','reset_token_expiry','verification_token','verification_token_expiry','refresh_token','refresh_token_expiry'];
    p := p || jsonb_build_object('cell_id',NULL,'session_version',coalesce((p->>'session_version')::integer,0)+1);
    imported := pg_temp.import_content('users',r.id,p,'email');
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM cdr_render_qa.content_import_map WHERE source_table='hero_settings') THEN
    UPDATE cdr_render_qa.hero_settings SET is_active=false WHERE is_active;
    UPDATE cdr_render_qa.leaders SET is_active=false WHERE name='Prueba Render admin';
  END IF;
  FOR r IN SELECT * FROM pg_temp.source_events WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    imported := pg_temp.import_content('events',r.id,p,NULL);
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_cell_categories WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    IF r.type_key='jovenes' THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783054527725443400_DSC03904.jpg'); END IF;
    IF r.type_key='prejus' THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783054386179338900_DSC09353.jpg'); END IF;
    IF r.type_key='hombres' THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783053602425111900_DSC07395.jpg'); END IF;
    IF r.type_key='mujeres' THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783053652256510800_DSC00391.jpg'); END IF;
    IF r.type_key='adolescentes' THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783054506793375800_7A871FBF-B494-476A-88D0-C7CB76C267CB_1_2.jpeg'); END IF;
    imported := pg_temp.import_content('cell_categories',r.id,p,'name');
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_cells WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    p := p || jsonb_build_object('leader_id',pg_temp.imported_id('users',r.leader_id),'pastor_id',pg_temp.imported_id('users',r.pastor_id));
    imported := pg_temp.import_content('cells',r.id,p,'code');
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_posts WHERE deleted_at IS NULL AND status='published' ORDER BY id LOOP
    p := to_jsonb(r);
    p := p || jsonb_build_object('author_id',pg_temp.imported_id('users',r.author_id));
    IF coalesce(p->>'cover_image','') LIKE '%images.unsplash.com%' THEN p := p || jsonb_build_object('cover_image','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783053602425111900_DSC07395.jpg'); END IF;
    imported := pg_temp.import_content('posts',r.id,p,'slug');
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_announcements WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    p := p || jsonb_build_object('created_by_id',pg_temp.imported_id('users',r.created_by_id));
    imported := pg_temp.import_content('announcements',r.id,p,NULL);
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_gallery_photos WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    IF r.id = ANY(ARRAY[12, 39, 64, 90, 140, 151, 190, 430, 452, 487, 528, 607, 629]::bigint[]) THEN p := p || '{"sort_order":-100}'::jsonb; END IF;
    p := p || jsonb_build_object('uploaded_by_id',coalesce(pg_temp.imported_id('users',r.uploaded_by_id),0),'event_id',pg_temp.imported_id('events',r.event_id));
    IF r.id = ANY(ARRAY[196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 404, 1, 2, 3, 4]::bigint[]) THEN p := p || '{"is_active":false}'::jsonb; END IF;
    imported := pg_temp.import_content('gallery_photos',r.id,p,'url');
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_social_posts WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    IF r.id=1 THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783054527725443400_DSC03904.jpg'); END IF;
    IF r.id=4 THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783054527725443400_DSC03904.jpg'); END IF;
    IF r.id=5 THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783054506793375800_7A871FBF-B494-476A-88D0-C7CB76C267CB_1_2.jpeg'); END IF;
    IF r.id=6 THEN p := p || jsonb_build_object('image_url','https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/galeria/1783053602425111900_DSC07395.jpg'); END IF;
    imported := pg_temp.import_content('social_posts',r.id,p,NULL);
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_faqs WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    imported := pg_temp.import_content('faqs',r.id,p,NULL);
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_leaders WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    p := p || jsonb_build_object('user_id',pg_temp.imported_id('users',r.user_id));
    imported := pg_temp.import_content('leaders',r.id,p,'name');
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_volunteer_areas WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    imported := pg_temp.import_content('volunteer_areas',r.id,p,'value');
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_donation_purposes WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    imported := pg_temp.import_content('donation_purposes',r.id,p,'value');
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_hero_settings WHERE deleted_at IS NULL AND is_active ORDER BY id LOOP
    p := to_jsonb(r);
    imported := pg_temp.import_content('hero_settings',r.id,p,NULL);
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_site_photos WHERE deleted_at IS NULL AND true ORDER BY id LOOP
    p := to_jsonb(r);
    imported := pg_temp.import_content('site_photos',r.id,p,'key');
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.source_site_settings WHERE deleted_at IS NULL AND true ORDER BY id LOOP
    p := to_jsonb(r);
    imported := pg_temp.import_content('site_settings',r.id,p,'key');
  END LOOP;
  -- Preserve normalized membership references after importing cells.
  UPDATE cdr_render_qa.users target SET cell_id=cm.target_id
    FROM cdr_render_qa.content_import_map um JOIN pg_temp.source_users source ON source.id=um.source_id
    JOIN cdr_render_qa.content_import_map cm ON cm.source_table='cells' AND cm.source_id=source.cell_id
    WHERE um.source_table='users' AND target.id=um.target_id AND target.cell_id IS NULL;
  IF (SELECT count(*) FROM cdr_render_qa.cells WHERE is_active AND deleted_at IS NULL) < 16 THEN RAISE EXCEPTION 'Missing active cells'; END IF;
  IF EXISTS(SELECT 1 FROM cdr_render_qa.cells c LEFT JOIN cdr_render_qa.users u ON c.leader_id=u.id WHERE c.is_active AND c.deleted_at IS NULL AND u.id IS NULL) THEN RAISE EXCEPTION 'Missing cell leader'; END IF;
END $$;
SELECT source_table,count(*) AS imported_records FROM cdr_render_qa.content_import_map GROUP BY source_table ORDER BY source_table;
COMMIT;
