// Aviso de link de parceiro (afiliado), com a página que explica.
export function PartnerNote({ plural = true, className = 'partner-note' }) {
  return (
    <small className={className}>
      {plural ? 'Links de parceiro' : 'Link de parceiro'}: o Traveling pode receber comissão, sem custo extra para você.{' '}
      <a href="parceiros.html" target="_blank" rel="noopener">Saiba mais<span className="sr-only"> sobre os parceiros (abre em nova aba)</span></a>
    </small>
  );
}
