# Deployment Guide: Numerical Aptitude Assessment Portal

This guide provides step-by-step instructions for deploying the **Numerical Aptitude Assessment Portal** to **Render** (or any Node.js hosting platform) with persistent SQLite storage for student attempts.

---

## 🏗️ Architecture Overview

- **Single Web Service**: The Express server (`server/index.js`) serves both the REST API (`/api/*`) and the built React frontend (`dist/`).
- **Database Engine**: SQLite with Write-Ahead Logging (`WAL`) mode enabled.
- **Configurable Database Location**: Controlled via the `DATABASE_PATH` environment variable:
  - **Local Development**: `data/exam.db`
  - **Render Production (with Persistent Disk)**: `/var/data/exam.db`
- **Initial Question Population**: The database automatically populates all 200 questions from `questions.json` on initial boot if empty, preserving any existing attempts and student records.

---

## 🚀 Step 1: Push Code to GitHub

1. On [GitHub](https://github.com/), create a new empty repository (do not check README or .gitignore).
2. Link your local repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
*(Note: All sensitive database files and student records are excluded via `.gitignore` and remain protected.)*

---

## ☁️ Step 2: Create a Web Service on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Fill in the service settings:
   - **Name**: `numerical-aptitude-portal` (or your choice)
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Starter (or higher) with persistent disk support.

---

## 💾 Step 3: Configure Persistent Disk & Environment Variables

> **⚠️ Important regarding SQLite on Cloud Hosting:**
> Cloud containers (like Render, Heroku, Railway) have ephemeral file systems. Any file written to the default container directory will reset when the server redeploys or restarts.
> To keep student attempt history permanently safe across restarts and deployments, you must attach a **Persistent Disk**.

1. In your Render Web Service page, scroll down to **Disks** (under *Advanced*).
2. Click **Add Disk**:
   - **Name**: `exam_data`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GB` (sufficient for millions of attempts)
3. Under **Environment Variables**, add:
   - **Key**: `DATABASE_PATH`
   - **Value**: `/var/data/exam.db`
4. Click **Create Web Service** (or **Save Changes**).

Render will automatically run `npm install && npm run build`, mount `/var/data`, and start the server using `npm start`.

---

## 🔄 Step 4: Restoring the Verified Backup Onto the Persistent Disk

When your Render service first launches, it will start with a fresh persistent disk and automatically seed all 200 questions.

To restore your pre-existing student attempts (e.g., `Vidya Sagar S`, Roll `25E5223`) from your local verified backup:

### Option A: Using the Render Web Shell (Easiest & Safest)
1. In the Render Dashboard, open your Web Service and click the **Shell** tab.
2. In the Shell, you have access to `/var/data/exam.db`.
3. You can run the restoration utility directly:
   ```bash
   node server/restore_db.js backups/exam_backup_2026-10-18T04-51-30-362Z.db /var/data/exam.db
   ```
   *(If you transferred your backup file to the server)*

### Option B: Local Migration Command
You can also run the restoration script locally pointing to any disk or path:
```bash
node server/restore_db.js [path_to_backup.db] [target_db_path]
```
The script performs the following safety checks:
1. Validates the backup integrity (verifying 200 questions and existing student records).
2. Creates an automated safety backup if the target database already exists.
3. Restores records atomically and performs a WAL checkpoint (`TRUNCATE`).

---

## 🔍 Step 5: Verification Checklist

Once deployed and accessible at your Render URL (e.g. `https://numerical-aptitude-portal.onrender.com`):
- [ ] Landing page loads with 200 Questions, 90 Minutes, and 200 Max Marks.
- [ ] Enter a test student name and roll number; verify the confirmation dialog appears.
- [ ] Exam interface displays randomized questions and live countdown timer.
- [ ] Answer questions, mark for review, and submit.
- [ ] Score and detailed review load accurately.
- [ ] Visit the History page to confirm attempts are listed.
- [ ] Trigger a manual redeploy in Render; verify all past attempts remain intact.
