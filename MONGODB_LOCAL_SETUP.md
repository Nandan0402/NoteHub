# MongoDB Local Installation Guide

## Download & Install

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Windows 10/11, Latest version (7.0), MSI
   - Click Download

2. **Run Installer**
   - Double-click the downloaded `.msi` file
   - Choose "Complete" installation
   - **IMPORTANT**: Check ✓ "Install MongoDB as a Service"
   - Service Name: `MongoDB`
   - Leave other defaults
   - Click Install

3. **Verify Installation**
   ```powershell
   # Check if service exists
   Get-Service MongoDB
   
   # Start service
   net start MongoDB
   ```

4. **Test Connection**
   ```powershell
   # This should work now
   cd c:\Users\Admin\OneDrive\Desktop\NoteHub\backend
   python app.py
   ```

## If Installation Fails

Use Option 1 (MongoDB Atlas) instead - it's faster and easier!
