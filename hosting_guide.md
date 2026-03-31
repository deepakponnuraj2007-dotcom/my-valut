# Detailed Hosting Guide - Content Vault

Bro, indha guide-la step-by-step UI mockups-oda eppidi host pannunnum-nu thelivaa explain panni irukken.

## 1. GitHub Setup
GitHub repo create panni terminal-la indha commands-ah sequence-aa run pannunga:
```bash
git init
git add .
git commit -m "Deployment ready"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

## 2. Netlify Environment Variables
Netlify-la unga project-ah connect pannadhukkum appuram, **Site Settings**-la indha keys-ah add pannunnum. Idhu thaan unga app-ayum Database-ayum link pannum.

![Netlify Env Vars Settings](file:///C:/Users/ELCOT/.gemini/antigravity/brain/24f3be9b-869c-4e40-93f6-de7ff30a2338/netlify_env_vars_ui_mockup_1774854089141.png)

## 3. Supabase Auth Redirect
Unga app live URL (e.g., `https://project.netlify.app`) nu vandhadhum, Supabase-la indha URL-ah register panna thaan Login work aagum.

![Supabase Redirect Config](file:///C:/Users/ELCOT/.gemini/antigravity/brain/24f3be9b-869c-4e40-93f6-de7ff30a2338/supabase_auth_redirect_ui_mockup_1774854105464.png)

---
**Checklist:**
- [ ] Code pushed to GitHub
- [ ] Variables added to Netlify
- [ ] Redirect URL added to Supabase
- [ ] Build finished on Netlify
