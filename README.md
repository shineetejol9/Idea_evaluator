# 🚀 IdeaLens AI

<p align="center">
  <strong>Evaluate startup ideas with AI before you build them.</strong><br>
  Get intelligent scores, detailed feedback, and actionable suggestions to turn ideas into viable businesses.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</p>

---

## 📖 About

**IdeaLens AI** is an AI-powered startup idea evaluation platform designed to help entrepreneurs, students, founders, and innovators validate their ideas before investing significant time and resources.

Users simply describe their startup idea in natural language, and the AI analyzes it using a structured evaluation framework. Instead of providing generic feedback, the platform generates detailed scores, explains the reasoning behind each score, highlights strengths and weaknesses, identifies potential risks, and offers practical suggestions to improve the idea.

The goal is to simulate an initial startup review—similar to what a mentor, incubator, or investor might provide—helping users refine their concepts before moving to development.

---

## ✨ What It Evaluates

* 💡 Innovation & Originality
* 📈 Market Potential
* 🎯 Problem-Solution Fit
* 👥 Target Audience
* 💰 Business Model
* ⚙️ Technical Feasibility
* 📊 Scalability
* 🏆 Competitive Advantage
* ⚠️ Risks & Challenges
* 🚀 Overall Startup Potential

---

## 🤖 AI Evaluation Report

For every submitted idea, IdeaLens AI generates:

* 📊 Detailed category-wise scores
* 📝 Overall evaluation summary
* ✅ Key strengths
* ❌ Weaknesses and gaps
* 💡 Actionable improvement suggestions
* 🚀 Recommendations to increase the idea's success potential

---

## ⚡ Key Features

* AI-powered startup idea analysis
* Intelligent scoring across multiple business dimensions
* Comprehensive evaluation reports
* Actionable feedback instead of generic responses
* Fast and responsive user experience
* Clean and modern interface
* Real-time AI-generated insights

---

## Tech Stack

| Category | Technologies |
| --- | --- |
| Frontend | React, Vite |
| Backend | Flask, Gunicorn |
| ML | scikit-learn |
| AI | OpenRouter |
| Styling | CSS, Tailwind |

## Local Development

```powershell
cd my-project
npm install
npm run dev
```

Vite uses `http://127.0.0.1:5000` for the local API unless `VITE_API_BASE_URL` is set. Run the backend from the repository root in another terminal:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python api.py
```

## Deployment

Update the existing Render web service (do not create a second service) with **Root Directory** `.`, **Build Command** `pip install -r requirements.txt`, **Start Command** `gunicorn api:app`, and `PYTHON_VERSION=3.11.9`. Render supplies the `PORT` variable. The tracked `startup_model.pkl` is in the repository root beside `api.py`.

For the Vercel project, set **Root Directory** to `my-project`, then set `VITE_API_BASE_URL` to `https://idea-evaluator.onrender.com` for Production (and Preview if needed). Redeploy after changing the variable.

In the existing Render service's environment settings, set `FRONTEND_ORIGINS` to `https://idea-evaluator-jet.vercel.app,http://localhost:5173,http://127.0.0.1:5173`, `OPENROUTER_API_KEY` as a secret, and `OPENROUTER_MODEL` to a free model ID enabled for your OpenRouter account. `recursive/flint-v1.0:free` appeared in OpenRouter's public model catalog when this configuration was prepared; per-account availability is not guaranteed. The backend rejects model IDs that are not marked `:free` and does not fall back to a paid model. If this model is unavailable to your account, choose an available free ID from OpenRouter's catalog and update `OPENROUTER_MODEL` in Render.

`backend.py` trains on `startup_data.csv`: it selects `int64`/`float64` columns, removes `labels`, and fills missing values with zero. It does not encode categorical text or convert startup-idea prose. The trained model expects 34 ordered numeric company attributes, including funding, location, and milestone data. The chat has an optional metrics section that requests these actual inputs; it never derives them from the idea text. One input, `Unnamed: 0`, is a dataset row index artifact rather than a company metric and must not be guessed. `/model-info` returns feature names in model order, and `/evaluate` accepts a validated numeric `features` array in that order, with `null` values zero-filled to match training. In this dataset label `1` means `acquired`, and label `0` means `closed`; `acquisition_probability` (also returned under the legacy `success_probability` key) is the model's estimated class-1 probability, not a verified measure of startup success or model accuracy.

A `VITE_OPENROUTER_API_KEY` variable was present in the ignored local frontend environment and the old frontend source contained a provider authorization value. Remove any old frontend key from local and hosted Vercel settings, rotate the OpenRouter key if it was real, and configure the replacement only in Render. Ignored local `.env` files are not committed.

Local tests cannot verify Render secrets, per-account model availability, or that the hosted Vercel deployment has been updated. Verify the live app in both hosting dashboards after deployment.

## 🎯 Use Cases

* Startup Validation
* Hackathon Projects
* Entrepreneurship Programs
* Product Brainstorming
* Business Idea Refinement
* Student Innovation Projects

---

https://github.com/user-attachments/assets/d0f225dd-5e8a-428a-bd74-b8b3e9a03527





## 📌 Vision

IdeaLens AI aims to make startup validation accessible to everyone by providing instant, structured, and insightful feedback. Instead of relying solely on intuition, founders can use AI to identify blind spots, strengthen their business concepts, and make more informed decisions before building their products.

---

<p align="center">
If you found this project helpful, consider giving it a ⭐ on GitHub!
</p>
