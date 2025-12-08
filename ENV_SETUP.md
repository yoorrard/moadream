# 환경 변수 설정 가이드

모아드림(MoaDream) 앱을 실행하려면 프로젝트 루트(`C:\Users\유영재\.gemini\antigravity\scratch\moadream`)에 `.env.local` 파일을 생성하고 아래 내용을 붙여넣으세요.

## 1. Supabase 설정 (자동 생성됨)

이미 생성된 `moadream` 프로젝트의 실제 키 값입니다. 그대로 복사해서 사용하세요.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xbxneekbhmabnpxulglt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhieG5lZWtiaG1hYm5weHVsZ2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzMxMjcsImV4cCI6MjA4MDUwOTEyN30.xbHpdCxb29c7QZ6RTxrGaVp2Q0HjdRbxZe16b06QXZs
```

## 2. Gemini API 설정 (직접 발급 필요)

AI 자동 배정 기능을 위해 Google AI Studio에서 API 키를 발급받아야 합니다.

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. **Create API Key** 클릭
3. 생성된 키를 아래 변수에 입력

```env
GEMINI_API_KEY=여기에_API_키를_입력하세요
```

---

## 전체 `.env.local` 파일 예시

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xbxneekbhmabnpxulglt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhieG5lZWtiaG1hYm5weHVsZ2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzMxMjcsImV4cCI6MjA4MDUwOTEyN30.xbHpdCxb29c7QZ6RTxrGaVp2Q0HjdRbxZe16b06QXZs

# Google Gemini API
GEMINI_API_KEY=AIzaSy...
```
