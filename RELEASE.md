# Nexus Crosshair Pro Release

## GitHub Releases

1. Create a public GitHub repository:
   `NexusTools/nexus-crosshair-pro`

2. Push this project to the repository.

3. Create a version tag:
   ```powershell
   git tag v0.0.1
   git push origin v0.0.1
   ```

4. GitHub Actions will build and publish the release with:
   - `Nexus Crosshair Pro Setup.exe`
   - `Nexus Crosshair Pro Setup.exe.blockmap`
   - `latest.yml`
   - `Nexus Crosshair Pro Portable.exe`

5. In the app, open Settings -> Updater and enable `Online Update Checks`.

## Manual Generic Server Upload

Build locally:

```powershell
npm run dist
```

Upload everything from:

```text
dist/release-upload/
```

Your server must expose:

```text
https://your-domain.example/nexus-crosshair-pro/latest.yml
https://your-domain.example/nexus-crosshair-pro/Nexus-Crosshair-Pro-Setup.exe
https://your-domain.example/nexus-crosshair-pro/Nexus-Crosshair-Pro-Setup.exe.blockmap
```

Then update the `generic` URL in `package.json`, rebuild, and enable `Online Update Checks` in Settings.
