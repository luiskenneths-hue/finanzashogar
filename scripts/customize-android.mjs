// Personaliza el proyecto Android que genera "cap add android":
//  1) copia los íconos y la pantalla de arranque de resources/res
//  2) firma siempre con keystore/finanzas.keystore (así cada APK nuevo se instala encima del anterior)
//  3) pone un versionCode que sube en cada compilación de GitHub
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidApp = path.join(root, 'android', 'app');
const resDir = path.join(androidApp, 'src', 'main', 'res');

function copyDir(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dst, { recursive: true });
      copyDir(src, dst);
    } else {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }
}

function patch(file, edits) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to, label] of edits) {
    if (!text.includes(from)) {
      throw new Error(`No se pudo ajustar ${path.basename(file)} (${label}). La plantilla de Capacitor cambió.`);
    }
    text = text.replace(from, to);
  }
  fs.writeFileSync(file, text);
}

// 1) Íconos y pantalla de arranque
copyDir(path.join(root, 'resources', 'res'), resDir);

// 2) Firma fija + 3) versión
const run = Number(process.env.GITHUB_RUN_NUMBER || 1);
patch(path.join(androidApp, 'build.gradle'), [
  [
    'android {\n',
    `android {
    signingConfigs {
        debug {
            storeFile file("../../keystore/finanzas.keystore")
            storePassword "finanzas-hogar"
            keyAlias "finanzas"
            keyPassword "finanzas-hogar"
            storeType "pkcs12"
        }
    }
`,
    'firma',
  ],
  ['versionCode 1', `versionCode ${run}`, 'versionCode'],
  ['versionName "1.0"', `versionName "1.0.${run}"`, 'versionName'],
]);

// Fondo de la pantalla de arranque de Android 12+
patch(path.join(resDir, 'values', 'styles.xml'), [
  [
    '<item name="android:background">@drawable/splash</item>',
    '<item name="android:background">@drawable/splash</item>\n        <item name="windowSplashScreenBackground">#3A3FBF</item>',
    'splash',
  ],
]);

console.log(`Proyecto Android personalizado (versión 1.0.${run}).`);
