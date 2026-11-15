// "Reduzir movimento": vale o ajuste do sistema OU a opção "Sem animações" do
// painel de acessibilidade do site (data-motion="reduce" no <html>). Mesmo
// formato de um MediaQueryList (.matches), para trocar sem mudar quem usa.
const query = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

export const reducedMotion = {
  get matches() {
    return query.matches || globalThis.document?.documentElement?.dataset.motion === 'reduce';
  }
};
