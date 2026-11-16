# InstaSave — GitHub Pages + backend

A maroon-themed static frontend with a small Python API. The browser makes PDFs locally; the API attempts to fetch supported **public** Instagram post/Reel media and returns it as a ZIP.

## Important limitations and responsible use
- Only use this for media you own or have permission to download. Respect copyright, creators' rights and Instagram/Meta terms.
- This is an independent project, not affiliated with Instagram or Meta.
- Instagram changes its website and access controls frequently. Public post extraction may stop working without warning; yt-dlp updates may be required.
- Private posts, stories, login-protected content, age/region-restricted content and anything requiring account cookies are not supported.
- GitHub Pages hosts only the frontend. The Python backend must be deployed separately.
- Do not add Instagram passwords, session cookies, or other credentials to this project.

## 1. Deploy the backend on Render
1. Create a GitHub repository and upload this project, keeping the `frontend/` and `backend/` folders.
2. In Render, choose **New → Blueprint** and connect the repository. Render detects `backend/render.yaml`.
   Alternatively create a Python web service with root directory `backend`, build command `pip install -r requirements.txt`, and start command `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. After deployment, open `https://YOUR-SERVICE.onrender.com/`. It should return `{"service":"InstaSave API","status":"ok"}`.
4. Copy your Render service URL.

Render free services may sleep when idle and take time to wake. Availability and free-tier limits can change.

## 2. Connect the frontend to the backend
1. Open `frontend/app.js`.
2. Replace:
   `const API_BASE = "https://YOUR-BACKEND-URL.onrender.com";`
   with your actual Render URL, without a trailing slash.
3. Save and push the change to GitHub.

## 3. Publish the website with GitHub Pages
1. In your repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/frontend`, then Save.
4. Wait for GitHub Pages to publish the site. Your public site URL will appear in Settings → Pages.

If GitHub Pages does not offer `/frontend` as a folder in your configuration, move the contents of `frontend/` into the repository root and select `/(root)` instead.

## 4. Local testing
Backend:
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Open `http://127.0.0.1:8000/` to check the API. For local frontend testing, change `API_BASE` to `http://127.0.0.1:8000` and serve `frontend/` with a local static server.

## Project structure
```text
instasave/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── render.yaml
└── README.md
```

## Security and production notes
This is a starter project, not a hardened public download service. Before sharing it widely, add rate limiting, request quotas, monitoring, abuse reporting, temporary-file cleanup, and a clear privacy policy. Restrict `ALLOWED_ORIGINS` to your GitHub Pages domain instead of `*`. Keep the backend updated and check the current legal/platform requirements for your intended use.
