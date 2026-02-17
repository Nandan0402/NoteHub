# MongoDB Atlas Setup (5 Minutes)

## Step 1: Create Free Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or email
3. Choose **FREE** M0 tier

## Step 2: Create Cluster
1. After signup, click "Create" 
2. Choose: **FREE Shared Cluster**
3. Select: Any region close to you
4. Click "Create Cluster" (takes 1-3 minutes)

## Step 3: Setup Database Access
1. Click "Database Access" in left menu
2. Click "+ ADD NEW DATABASE USER"
3. Username: `notehub_user`
4. Password: Click "Autogenerate Secure Password" and **COPY IT**
5. Database User Privileges: **Read and write to any database**
6. Click "Add User"

## Step 4: Setup Network Access
1. Click "Network Access" in left menu
2. Click "+ ADD IP ADDRESS"
3. Click "ALLOW ACCESS FROM ANYWHERE" (for development)
4. Click "Confirm"

## Step 5: Get Connection String
1. Click "Database" in left menu
2. Click "Connect" button
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://notehub_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you copied earlier

## Step 6: Update Your .env File

Paste this in `backend/.env`:
```
MONGODB_URI=mongodb+srv://notehub_user:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/notehub?retryWrites=true&w=majority
```

## Step 7: Restart Backend

Stop backend (Ctrl+C) and run again:
```powershell
python app.py
```

You should see: ✅ MongoDB connected successfully
