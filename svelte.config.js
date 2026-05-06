import adapter from '@sveltejs/adapter-static';

const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    paths: { base },
    prerender: {
      // TODO: eliminar esta excepción cuando T-08 esté implementado:
      //   /linea-tiempo → T-08
      //   /img/         → imágenes locales aún no en static/img/
      handleHttpError: ({ status, path, message }) => {
        const pendingPrefixes = ['/img/'];
        const isPending = pendingPrefixes.some(
          (r) => path.endsWith(r) || path.endsWith(r.replace(/\/$/, '')) || path.includes(r)
        );
        if (status === 404 && isPending) return;
        throw new Error(message);
      }
    }
  }
};

export default config;
