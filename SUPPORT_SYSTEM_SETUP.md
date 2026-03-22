# Support System - Setup & Testing Guide

**Status:** Implementation Complete - Ready for Setup & Testing
**Date:** 2026-03-22

---

## ✅ Completed Phases

- ✅ **Phase 0** - Documentation PRD (SUPPORT_SYSTEM_PRD.md)
- ✅ **Phase 1** - Database Migration 017 (support_tickets + support_messages)
- ✅ **Phase 2** - TypeScript Types & Services (support.types.ts, support.service.ts, cloudinary.ts)
- ✅ **Phase 3.1** - SupportView.tsx (user ticket list + creation form)
- ✅ **Phase 3.2** - SupportTicketDetailView.tsx (conversation view + realtime)
- ✅ **Phase 3.3** - Routes + TopBar (Support menu item with badge)
- ✅ **Phase 4** - Admin Dashboard (Tickets tab with filters)

---

## 🔧 Phase 5 - Setup & Configuration

### Step 1: Apply Database Migration

**Location:** `/cockpit/supabase/migrations/017_support_tickets.sql`

**How to apply:**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Navigate to: **SQL Editor**
3. Create new query
4. Copy entire contents of `017_support_tickets.sql`
5. Paste into SQL Editor
6. Click **Run**
7. Verify success (no errors)

**What this creates:**
- ENUM types: `ticket_status`, `ticket_priority`, `ticket_category`, `message_sender_type`
- Tables: `support_tickets`, `support_messages`
- RLS policies (users see own tickets, admins see all)
- Triggers (auto-update timestamps)
- Helper functions (`get_user_unread_ticket_messages`, `get_ticket_stats`)

### Step 2: Configure Cloudinary

**Get credentials:**

1. Go to: https://console.cloudinary.com/
2. Sign up / Log in
3. Navigate to: **Settings → Upload**
4. Create an **Unsigned Upload Preset**:
   - Click "Add upload preset"
   - Signing Mode: **Unsigned**
   - Folder: `support-screenshots`
   - Save
5. Copy:
   - **Cloud name** (top-right corner of dashboard)
   - **Upload preset name** (you just created)

**Set environment variables:**

Edit `/cockpit/.env` and add:

```bash
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset-name
```

**Restart dev server:**

```bash
cd cockpit
npm run dev
```

---

## 🧪 Phase 6 - Testing

### Test 1: User Creates Ticket

**Steps:**
1. Login as regular user
2. Click **Support** in TopBar menu
3. Click **+ Nouveau ticket**
4. Fill form:
   - Category: Bug
   - Subject: "Test ticket création"
   - Description: "Ceci est un test de création de ticket support avec description suffisamment longue"
   - (Optional) Upload a screenshot
5. Click **Créer le ticket**

**Expected:**
- ✅ Ticket appears in list
- ✅ Status badge shows "Ouvert"
- ✅ Priority auto-set to "High" (bug category)
- ✅ If screenshot uploaded: visible in ticket
- ✅ Database: `page_url` and `user_agent` auto-captured

**Verify in Supabase:**
```sql
SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 1;
```

### Test 2: User Views Ticket Detail

**Steps:**
1. From Support list, click on the ticket you just created
2. Verify conversation view appears
3. Write a message: "Message test utilisateur"
4. Click **Envoyer**

**Expected:**
- ✅ Message appears in timeline (left side, gray bubble)
- ✅ Timestamp shows "À l'instant"
- ✅ No page refresh needed

**Verify in Supabase:**
```sql
SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 1;
```

### Test 3: Admin Sees All Tickets

**Steps:**
1. Login as admin user
2. Navigate to `/admin`
3. Click **Tickets** tab

**Expected:**
- ✅ See ALL tickets (not just your own)
- ✅ Table shows: ID, Priority, Category, Subject, User email, Status, Created, Updated
- ✅ Filters work (status, priority, category dropdowns)
- ✅ Click row → navigates to `/support/:ticketId`

### Test 4: Admin Responds

**Steps:**
1. As admin, open a user's ticket
2. Notice admin controls visible:
   - Change status dropdown
   - Change priority dropdown
   - "S'assigner" button (if not assigned)
3. Write message: "Réponse admin test"
4. Click **Envoyer**

**Expected:**
- ✅ Message appears right side, cyan bubble
- ✅ Shows "Support Team" badge
- ✅ `sender_type` = 'admin' in database

**Verify in Supabase:**
```sql
SELECT sender_type, message FROM support_messages WHERE sender_type = 'admin' ORDER BY created_at DESC LIMIT 1;
```

### Test 5: Realtime Updates (Critical!)

**Setup:**
- Open ticket detail in **TWO browser windows**:
  - Window 1: User view
  - Window 2: Admin view (same ticket)

**Steps:**
1. In Window 1 (user): Write message "Test realtime user"
2. **Do NOT refresh Window 2**
3. Observe Window 2

**Expected:**
- ✅ Message appears in Window 2 automatically (within 1-2 seconds)
- ✅ No page refresh needed

**Repeat reverse:**
1. In Window 2 (admin): Write message "Test realtime admin"
2. Observe Window 1

**Expected:**
- ✅ Message appears in Window 1 automatically

### Test 6: Badge Notifications

**Setup:**
- User has an open ticket
- Admin responds (as in Test 4)

**Steps:**
1. As user, navigate away from Support (e.g., go to `/projects`)
2. Look at TopBar menu
3. Check **Support** menu item

**Expected:**
- ✅ Red badge appears with count (e.g., `1`)
- ✅ Badge shows number of unread admin messages

**Clear badge:**
1. Click **Support** → open ticket
2. Navigate away again
3. Badge should be gone (messages marked as read)

**Verify in Supabase:**
```sql
SELECT get_user_unread_ticket_messages('USER_ID_HERE');
```

### Test 7: Screenshot Upload

**Steps:**
1. Create new ticket with screenshot
2. Upload image (JPG/PNG/WebP, < 5MB)

**Expected:**
- ✅ File uploads successfully
- ✅ Shows checkmark ✓ with filename
- ✅ Ticket detail shows image below initial description
- ✅ Image hosted on Cloudinary (check URL starts with `res.cloudinary.com`)

**If upload fails:**
- Check Cloudinary credentials in `.env`
- Check browser console for errors
- Verify upload preset is **Unsigned** mode

### Test 8: Mark as Resolved

**Steps:**
1. As user, open an open ticket
2. Scroll to bottom
3. Click **Marquer comme résolu**

**Expected:**
- ✅ Status changes to "Résolu"
- ✅ Status badge updates (green)
- ✅ Button disappears
- ✅ `resolved_at` timestamp set in database

**Verify in Supabase:**
```sql
SELECT status, resolved_at FROM support_tickets WHERE id = 'TICKET_ID';
```

### Test 9: Admin Actions

**Steps:**
1. As admin, open any ticket
2. Change status to "En cours"
3. Change priority to "Critical"
4. Click "S'assigner"

**Expected:**
- ✅ Status dropdown works
- ✅ Priority dropdown works
- ✅ Assignment button works
- ✅ Changes persist after page refresh
- ✅ Database updated

### Test 10: RLS Security (Critical!)

**Setup:**
- User A creates ticket
- User B logs in (different user)

**Steps:**
1. As User B, navigate to `/support`
2. Try to view tickets

**Expected:**
- ✅ User B sees ONLY their own tickets
- ✅ User B does NOT see User A's ticket
- ✅ Direct URL `/support/USER_A_TICKET_ID` → redirect or 404

**As Admin:**
- ✅ Admin sees ALL tickets (both User A and User B)

---

## 📊 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Migration applies without errors | ✅ | ⬜ |
| Screenshot upload works | ✅ | ⬜ |
| Realtime messages < 2s latency | ✅ | ⬜ |
| Badge notifications work | ✅ | ⬜ |
| RLS policies enforce security | ✅ | ⬜ |
| Admin sees all tickets | ✅ | ⬜ |
| User sees only own tickets | ✅ | ⬜ |
| Auto-capture page_url/user_agent | ✅ | ⬜ |
| Ticket creation < 3s | ✅ | ⬜ |
| Zero TypeScript errors | ✅ | ⬜ |

---

## 🐛 Common Issues & Fixes

### Issue: "Migration failed"

**Cause:** Conflicting enum types or tables already exist

**Fix:**
```sql
-- Drop existing types/tables first (CAUTION: loses data!)
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS ticket_category CASCADE;
DROP TYPE IF EXISTS message_sender_type CASCADE;

-- Then re-run the migration
```

### Issue: "Screenshot upload fails"

**Possible causes:**
1. Missing Cloudinary credentials → Check `.env`
2. Upload preset is "Signed" → Must be **Unsigned**
3. File > 5MB → Reduce file size
4. Invalid file type → Must be JPG/PNG/WebP

### Issue: "Badge doesn't update"

**Cause:** Realtime subscription not working

**Fix:**
1. Check Supabase Realtime is enabled (Dashboard → Database → Replication)
2. Verify `support_messages` table has realtime enabled
3. Check browser console for WebSocket errors

### Issue: "User sees other users' tickets"

**Cause:** RLS policies not applied correctly

**Fix:**
1. Re-run migration (RLS policies included)
2. Verify in Supabase Dashboard → Authentication → Policies
3. Check `user_roles` table for correct role assignments

---

## 📝 Post-Testing Checklist

After all tests pass:

- [ ] Commit Phase 5 changes (if any)
- [ ] Update this document with test results
- [ ] Create final commit with "Phase 6 - Tests Complete"
- [ ] Push to GitHub
- [ ] Mark todo as completed
- [ ] Optional: Create GitHub release tag `v4.4-support-system`

---

## 🎉 Next Steps

Once testing is complete, the support system is **production-ready**.

**Future enhancements (Post-MVP):**
- Email notifications (when admin responds)
- Attachments (multiple files, not just one screenshot)
- Full-text search across tickets
- Admin response templates
- SLA tracking (response time, resolution time)
- Custom tags
- Satisfaction survey after resolution
- CSV export for admins

---

**Created:** 2026-03-22
**By:** Claude Code
**Status:** Ready for Setup & Testing
