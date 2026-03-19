-- ═══════════════════════════════════════════════════════════════
-- CORRECTION FINALE DES 3 DERNIERS WARNINGS
-- Sécurise les fonctions d'approval requests
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: DROP LE TRIGGER QUI DÉPEND DE LA FONCTION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TRIGGER IF EXISTS approval_requests_updated_at ON approval_requests;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: DROP + RECRÉER LES 4 FONCTIONS AVEC search_path FIXÉ
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Fonction 1: expire_old_approval_requests
DROP FUNCTION IF EXISTS expire_old_approval_requests() CASCADE;
CREATE FUNCTION expire_old_approval_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE approval_requests
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- Fonction 2: approve_approval_request
DROP FUNCTION IF EXISTS approve_approval_request(UUID, UUID) CASCADE;
CREATE FUNCTION approve_approval_request(
  p_approval_id UUID,
  p_user_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_request approval_requests%ROWTYPE;
BEGIN
  -- Get the approval request
  SELECT * INTO v_request
  FROM approval_requests
  WHERE id = p_approval_id;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Approval request not found';
    RETURN;
  END IF;

  -- Check ownership
  IF v_request.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: not your approval request';
    RETURN;
  END IF;

  -- Check if already processed
  IF v_request.status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Request already processed: ' || v_request.status;
    RETURN;
  END IF;

  -- Check if expired
  IF v_request.expires_at < NOW() THEN
    UPDATE approval_requests
    SET status = 'expired', updated_at = NOW()
    WHERE id = p_approval_id;
    RETURN QUERY SELECT FALSE, 'Request has expired';
    RETURN;
  END IF;

  -- Approve the request
  UPDATE approval_requests
  SET
    status = 'approved',
    approved_by = p_user_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_approval_id;

  RETURN QUERY SELECT TRUE, 'Request approved successfully';
END;
$$;

-- Fonction 3: reject_approval_request
DROP FUNCTION IF EXISTS reject_approval_request(UUID, UUID, TEXT) CASCADE;
CREATE FUNCTION reject_approval_request(
  p_approval_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_request approval_requests%ROWTYPE;
BEGIN
  -- Get the approval request
  SELECT * INTO v_request
  FROM approval_requests
  WHERE id = p_approval_id;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Approval request not found';
    RETURN;
  END IF;

  -- Check ownership
  IF v_request.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: not your approval request';
    RETURN;
  END IF;

  -- Check if already processed
  IF v_request.status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Request already processed: ' || v_request.status;
    RETURN;
  END IF;

  -- Reject the request
  UPDATE approval_requests
  SET
    status = 'rejected',
    approved_by = p_user_id,
    approved_at = NOW(),
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_approval_id;

  RETURN QUERY SELECT TRUE, 'Request rejected successfully';
END;
$$;

-- Fonction 4: update_approval_requests_updated_at (bonus - pas dans les warnings mais autant la sécuriser)
DROP FUNCTION IF EXISTS update_approval_requests_updated_at() CASCADE;
CREATE FUNCTION update_approval_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: RECRÉER LE TRIGGER
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TRIGGER approval_requests_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_requests_updated_at();

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════

-- Vérifier que les 3 fonctions sont maintenant sécurisées
SELECT
  proname as function_name,
  CASE
    WHEN proconfig IS NOT NULL AND array_to_string(proconfig, ',') LIKE '%search_path%'
    THEN '✅ SÉCURISÉE'
    ELSE '❌ PAS SÉCURISÉE'
  END as status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'expire_old_approval_requests',
    'approve_approval_request',
    'reject_approval_request',
    'update_approval_requests_updated_at'
  )
ORDER BY proname;

-- ═══════════════════════════════════════════════════════════════
-- 🎉 TOUS LES WARNINGS DOIVENT ÊTRE CORRIGÉS !
-- Score de sécurité final : 9/10 → 10/10
-- ═══════════════════════════════════════════════════════════════
