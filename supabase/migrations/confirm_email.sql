-- 이메일 인증 강제 완료 처리
-- 실행: https://supabase.com/dashboard/project/xbxneekbhmabnpxulglt/sql/new

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'yoorrard96@naver.com';
