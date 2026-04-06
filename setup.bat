@echo off
cd /d C:\Users\jake3\jake\pokemon-tcg-dex\frontend
echo Deleting App_new.css...
if exist src\App_new.css (
    del src\App_new.css
    echo App_new.css deleted successfully
) else (
    echo App_new.css not found
)
echo.
echo Installing @supabase/supabase-js...
call npm install @supabase/supabase-js
echo.
echo Starting dev server...
call npm run dev
