# Institution Logo Setup Instructions

## Adding Your Institution Logo

### For Web Pages (Top Left of Each Page)

1. **Prepare your logo:**
   - Format: PNG or SVG (PNG recommended)
   - Recommended size: 200x200 pixels or higher (square aspect ratio works best)
   - Background: Transparent or white
   - File name: `logo.png`

2. **Add the logo file:**
   - Place your logo file in: `client/public/logo.png`
   - The logo will automatically appear in:
     - Top-left corner of the sidebar
     - Top-left of the header bar (next to "Student Participation Tracker")

3. **If logo doesn't appear:**
   - Make sure the file is named exactly `logo.png`
   - Clear browser cache (Ctrl+Shift+R)
   - Check browser console for errors

### For Excel Report Headers

1. **Prepare your logo for reports:**
   - Format: PNG or JPEG
   - Recommended size: 150x150 pixels
   - File name: `logo.png`

2. **Add the logo file:**
   - Place your logo file in: `server/public/logo.png`
   - Create the `public` folder if it doesn't exist

3. **The logo will appear:**
   - Centered at the top of generated Excel reports
   - Above the report title and data table

### Current Status

✅ Logo integration code is ready
⏳ Waiting for logo file to be added

### Example Logo Placement

```
client/public/
  └── logo.png          (for web pages)

server/public/
  └── logo.png          (for Excel reports)
```

### Alternative: Use Different Logo Files

If you want different logos for web and reports, you can:
- Use `client/public/logo.png` for web
- Use `server/public/report-logo.png` for reports
- Update the code references accordingly

### Testing

1. **Web Logo:**
   - Navigate to any page after login
   - Logo should appear in sidebar and header

2. **Report Logo:**
   - Generate any Excel report
   - Open the Excel file
   - Logo should appear at the top with institution name
