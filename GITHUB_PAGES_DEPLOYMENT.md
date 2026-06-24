# Deploy Baby Games to GitHub Pages

## Step-by-Step Guide

### Step 1: Create a GitHub Account (if needed)
- Go to [github.com](https://github.com)
- Sign up or log in

### Step 2: Create a New Repository on GitHub

1. Click the **+** icon (top right) → **New repository**
2. Fill in the repository name: `baby_games` (or `baby-games`)
3. Add description: "Learning and fun game for toddlers"
4. Choose **Public** (so it's accessible on GitHub Pages)
5. ✅ Check "Add a README file"
6. Click **Create repository**

### Step 3: Clone Repository to Your Local Machine

1. In your new GitHub repository, click the green **Code** button
2. Copy the HTTPS URL (e.g., `https://github.com/YOUR_USERNAME/baby_games.git`)
3. Open PowerShell/Terminal and run:

```powershell
cd e:\Ahmed\Code
git clone https://github.com/YOUR_USERNAME/baby_games.git baby_games_new
cd baby_games_new
```

### Step 4: Copy Your Project Files

Move all your Baby Games files into the cloned repository:

```powershell
# Copy all files (replace existing README)
Copy-Item -Path "e:\Ahmed\Code\baby_games\*" -Destination "e:\Ahmed\Code\baby_games_new" -Recurse -Force
```

### Step 5: Commit and Push to GitHub

```powershell
cd e:\Ahmed\Code\baby_games_new

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Baby Games platform with Alphabet Learner game"

# Push to GitHub
git push -u origin main
```

### Step 6: Enable GitHub Pages

1. Go to your GitHub repository: `github.com/YOUR_USERNAME/baby_games`
2. Click **Settings** (top right)
3. Scroll down to **Pages** section (left sidebar)
4. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**

### Step 7: Your Game is Live! 🎉

Your game will be available at: `https://YOUR_USERNAME.github.io/baby_games/`

Example: If your GitHub username is "ahmed", your game URL is:
```
https://ahmed.github.io/baby_games/
```

The GitHub Pages site may take 1-2 minutes to build and go live.

---

## Alternative: Quick Deploy (Easier)

If you don't want to use command line, GitHub provides a web interface:

1. Go to your GitHub repository
2. Click **Add file** → **Upload files**
3. Drag and drop your `baby_games` folder contents
4. Write commit message and click **Commit changes**
5. Enable Pages in Settings (same as Step 6 above)

---

## Updating Your Game

After deploying, to update your game:

```powershell
cd e:\Ahmed\Code\baby_games_new

# Make your changes to files
# Then:

git add .
git commit -m "Update: Added new images and sounds"
git push
```

The website updates automatically within a few seconds!

---

## Helpful Commands

| Command | What it does |
|---------|-------------|
| `git status` | See which files changed |
| `git log` | View commit history |
| `git pull` | Download latest changes from GitHub |
| `git push` | Upload your changes to GitHub |
| `git add .` | Add all changed files |
| `git commit -m "message"` | Save changes with a message |

---

## Troubleshooting

### Pages not showing?
- Wait 2-3 minutes for GitHub to build
- Check Settings → Pages and confirm main branch is selected
- Check "Actions" tab - if there's a red ✗, click it to see build errors

### Getting 404 errors?
- Make sure `index.html` is in the root directory (not in a subfolder)
- Check the URL: should be `YOUR_USERNAME.github.io/baby_games/`

### Can't push changes?
- Run: `git config --global user.email "your_email@example.com"`
- Run: `git config --global user.name "Your Name"`
- Then retry: `git push`

### Images/sounds not loading?
- Check browser console (F12) for 404 errors
- Verify files exist in `games/alphabet-learner/assets/`
- Update manifest.json with correct file paths

---

## Next Steps After Deployment

1. **Share the link** with friends/family: `https://YOUR_USERNAME.github.io/baby_games/`
2. **Add assets** (images and sounds) - push again automatically updates live site
3. **Enable monetization** in `config/ads.json` - push updates the live game
4. **Add more games** - create new GameModule, register, and push

---

## Optional: Custom Domain

If you want `yourbabygames.com` instead of `github.io`:

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In repo Settings → Pages → Custom domain: Enter your domain
3. Add DNS records as instructed by GitHub
4. Enable HTTPS

---

That's it! Your Baby Games platform is now live on GitHub Pages! 🚀
