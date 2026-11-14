/** Moeda de ouro desenhada em CSS (tamanho relativo à fonte por padrão). */
export default function Coin({ size = '0.95em', className = '' }) {
  return <span className={`coin ${className}`} style={{ width: size, height: size }} aria-hidden="true" />;
}
