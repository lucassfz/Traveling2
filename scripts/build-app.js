// Compila a interface React (src/) para app/, que fica versionada: o GitHub Pages
// publica a raiz do repositório sem etapa de build.
//
//   npm run build      (o npm run dev recompila sozinho ao salvar)
//
// - js/ (dados, regras e motor 3D) continua como módulos nativos: fica fora do
//   pacote e é importado como ../js/..., o mesmo arquivo que os validadores leem.
// - app/build.json guarda o hash das fontes; validate-react.js reprova a interface
//   compilada fora de dia, sem precisar do esbuild.
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { outputHash, sourceHash } from './app-hash.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app');

// Caminhos para js/ viram ../js/... (relativos a app/) e não entram no pacote.
const nativeModules = {
  name: 'native-modules',
  setup(build) {
    build.onResolve({ filter: /\/js\// }, args => {
      if (!args.path.startsWith('.')) return undefined;
      const relative = path.relative(path.join(ROOT, 'js'), path.resolve(args.resolveDir, args.path));
      if (relative.startsWith('..')) return undefined;
      return { path: `../js/${relative.replaceAll('\\', '/')}`, external: true };
    });
  }
};

const OPTIONS = {
  absWorkingDir: ROOT,
  entryPoints: { main: 'src/main.jsx' },
  outdir: 'app',
  bundle: true,
  splitting: true,
  format: 'esm',
  target: ['es2022'],
  jsx: 'automatic',
  minify: true,
  charset: 'utf8',
  legalComments: 'linked',
  entryNames: '[name]',
  chunkNames: '[name]-[hash]',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [nativeModules],
  write: false,
  logLevel: 'silent'
};

/** Compila e grava em app/, sem sobras de builds anteriores. @returns {Promise<{ files: number, kb: number }>} */
export async function buildApp() {
  const { build } = await import('esbuild');
  const { outputFiles } = await build(OPTIONS);
  await mkdir(OUT, { recursive: true });
  const names = new Set(outputFiles.map(file => path.basename(file.path)));
  for (const file of await readdir(OUT)) if (!names.has(file)) await rm(path.join(OUT, file), { recursive: true });
  for (const file of outputFiles) await writeFile(file.path, file.contents);
  const hashes = { source: await sourceHash(ROOT), output: await outputHash(ROOT) };
  await writeFile(path.join(OUT, 'build.json'), `${JSON.stringify(hashes, null, 2)}\n`);
  return { files: outputFiles.length, kb: Math.round(outputFiles.reduce((sum, file) => sum + file.contents.length, 0) / 1024) };
}

/** Erros do esbuild numa linha cada. */
export function buildErrors(error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return ['Dependências não instaladas. Rode: npm ci'];
  return error.errors?.map(item => `${item.location?.file ?? ''}:${item.location?.line ?? ''} ${item.text}`) ?? [String(error.stack ?? error)];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { files, kb } = await buildApp();
    console.log(`app/: ${files} arquivos, ${kb} KB.`);
  } catch (error) {
    for (const line of buildErrors(error)) console.error(line);
    process.exit(1);
  }
}
