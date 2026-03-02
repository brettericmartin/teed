-- Migration 094: Expand item history tracking to cover all significant fields
-- Previously only tracked: custom_name, why_chosen, photo_url on UPDATE
-- Now also tracks: brand, custom_description, notes, is_featured, sort_index,
--   compared_to, price_paid, quantity, promo_codes

CREATE OR REPLACE FUNCTION public.track_item_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Track new item added with comprehensive snapshot
        INSERT INTO item_version_history (item_id, bag_id, change_type, new_value, item_snapshot)
        VALUES (
            NEW.id,
            NEW.bag_id,
            'added',
            jsonb_build_object(
                'custom_name', NEW.custom_name,
                'photo_url', NEW.photo_url,
                'brand', NEW.brand
            ),
            jsonb_build_object(
                'custom_name', NEW.custom_name,
                'photo_url', NEW.photo_url,
                'brand', NEW.brand,
                'custom_description', NEW.custom_description,
                'why_chosen', NEW.why_chosen,
                'notes', NEW.notes,
                'is_featured', NEW.is_featured,
                'price_paid', NEW.price_paid,
                'promo_codes', NEW.promo_codes,
                'compared_to', NEW.compared_to,
                'quantity', NEW.quantity
            )
        );

        -- Update bag version tracking
        UPDATE bags
        SET update_count = update_count + 1,
            last_major_update = NOW()
        WHERE id = NEW.bag_id;

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Track updates to ALL significant fields

        IF OLD.custom_name IS DISTINCT FROM NEW.custom_name THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'custom_name', to_jsonb(OLD.custom_name), to_jsonb(NEW.custom_name));
        END IF;

        IF OLD.brand IS DISTINCT FROM NEW.brand THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'brand', to_jsonb(OLD.brand), to_jsonb(NEW.brand));
        END IF;

        IF OLD.custom_description IS DISTINCT FROM NEW.custom_description THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'custom_description', to_jsonb(OLD.custom_description), to_jsonb(NEW.custom_description));
        END IF;

        IF OLD.why_chosen IS DISTINCT FROM NEW.why_chosen THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'why_chosen', to_jsonb(OLD.why_chosen), to_jsonb(NEW.why_chosen));
        END IF;

        IF OLD.notes IS DISTINCT FROM NEW.notes THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'notes', to_jsonb(OLD.notes), to_jsonb(NEW.notes));
        END IF;

        IF OLD.photo_url IS DISTINCT FROM NEW.photo_url THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'photo_url', to_jsonb(OLD.photo_url), to_jsonb(NEW.photo_url));
        END IF;

        IF OLD.is_featured IS DISTINCT FROM NEW.is_featured THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'is_featured', to_jsonb(OLD.is_featured), to_jsonb(NEW.is_featured));
        END IF;

        IF OLD.sort_index IS DISTINCT FROM NEW.sort_index THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'sort_index', to_jsonb(OLD.sort_index), to_jsonb(NEW.sort_index));
        END IF;

        IF OLD.compared_to IS DISTINCT FROM NEW.compared_to THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'compared_to', to_jsonb(OLD.compared_to), to_jsonb(NEW.compared_to));
        END IF;

        IF OLD.price_paid IS DISTINCT FROM NEW.price_paid THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'price_paid', to_jsonb(OLD.price_paid), to_jsonb(NEW.price_paid));
        END IF;

        IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'quantity', to_jsonb(OLD.quantity), to_jsonb(NEW.quantity));
        END IF;

        IF OLD.promo_codes IS DISTINCT FROM NEW.promo_codes THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'promo_codes', to_jsonb(OLD.promo_codes), to_jsonb(NEW.promo_codes));
        END IF;

        -- Track if item was replaced by another
        IF NEW.replaced_item_id IS NOT NULL AND OLD.replaced_item_id IS NULL THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, change_note, old_value)
            VALUES (
                NEW.id,
                NEW.bag_id,
                'replaced',
                NEW.replacement_reason,
                jsonb_build_object('replaced_item_id', NEW.replaced_item_id)
            );
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- Track item removal with full snapshot for preservation
        INSERT INTO item_version_history (item_id, bag_id, change_type, old_value, item_snapshot)
        VALUES (
            OLD.id,
            OLD.bag_id,
            'removed',
            jsonb_build_object(
                'custom_name', OLD.custom_name,
                'photo_url', OLD.photo_url
            ),
            jsonb_build_object(
                'custom_name', OLD.custom_name,
                'photo_url', OLD.photo_url,
                'brand', OLD.brand,
                'custom_description', OLD.custom_description,
                'why_chosen', OLD.why_chosen,
                'notes', OLD.notes,
                'specs', OLD.specs,
                'compared_to', OLD.compared_to,
                'price_paid', OLD.price_paid,
                'promo_codes', OLD.promo_codes,
                'quantity', OLD.quantity,
                'is_featured', OLD.is_featured
            )
        );

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
