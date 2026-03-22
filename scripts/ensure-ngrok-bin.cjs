/**
 * @expo/ngrok expects a real ngrok binary at
 * node_modules/@expo/ngrok-bin-{platform}-{arch}/ngrok
 * If npm only installs package.json (optional dep quirk / interrupted install),
 * require("@expo/ngrok-bin") is null and `expo start --tunnel` throws ERR_INVALID_ARG_TYPE.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const platform = process.platform;
const arch = process.arch;
const pkgName = `@expo/ngrok-bin-${platform}-${arch}`;
const binName = platform === "win32" ? "ngrok.exe" : "ngrok";
const version = "2.3.41";

const targetDir = path.join(__dirname, "..", "node_modules", pkgName);
const targetBin = path.join(targetDir, binName);

function main() {
  if (fs.existsSync(targetBin)) {
    try {
      fs.chmodSync(targetBin, 0o755);
    } catch {
      /* ignore */
    }
    return;
  }

  if (!fs.existsSync(path.join(targetDir, "package.json"))) {
    console.warn(
      `[ensure-ngrok-bin] ${pkgName} is not installed; skip (tunnel unavailable).`
    );
    return;
  }

  console.warn(
    `[ensure-ngrok-bin] Missing ${pkgName}/${binName}; extracting from npm tarball…`
  );

  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "ngrok-bin-"));
  try {
    execSync(`npm pack ${pkgName}@${version}`, { cwd: tmp, stdio: "inherit" });
    const tgz = fs.readdirSync(tmp).find((f) => f.endsWith(".tgz"));
    if (!tgz) throw new Error("npm pack produced no .tgz");
    execSync(`tar -xzf ${JSON.stringify(tgz)}`, { cwd: tmp, stdio: "inherit" });
    const packed = path.join(tmp, "package", binName);
    if (!fs.existsSync(packed)) {
      throw new Error(`expected ${packed} in tarball`);
    }
    fs.copyFileSync(packed, targetBin);
    fs.chmodSync(targetBin, 0o755);
    console.warn(`[ensure-ngrok-bin] Installed ${targetBin}`);
  } catch (e) {
    console.warn(
      "[ensure-ngrok-bin] Failed to extract ngrok:",
      e && e.message ? e.message : e
    );
    console.warn(
      "Tunnel may fail. Try: rm -rf node_modules && npm install\n" +
        "Or move the project to a path without spaces (e.g. ~/dev/okrai-personal)."
    );
  } finally {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

main();
