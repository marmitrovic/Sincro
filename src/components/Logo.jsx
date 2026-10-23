// Logotipo Sincro (public/Logotipo_sanitario_Sincro_en_azul_y_rojo.png, 500 × 500 px, fondo transparente).
export const LOGO_URL = `${import.meta.env.BASE_URL}Logotipo_sanitario_Sincro_en_azul_y_rojo.png`;

// Zona del dibujo sin la palabra «Sincro» (en píxeles de la imagen original)
const ICON = { x: 130, y: 87, w: 238, h: 252 };

// Solo el símbolo (personas y cruz), recortado de la imagen. Para la cabecera.
export function LogoMark({ size = 44 }) {
  const s = size / ICON.h;
  return (
    <span
      className="logo-mark"
      aria-hidden="true"
      style={{
        width: Math.round(ICON.w * s), height: size,
        backgroundImage: `url(${LOGO_URL})`,
        backgroundSize: `${500 * s}px ${500 * s}px`,
        backgroundPosition: `${-ICON.x * s}px ${-ICON.y * s}px`,
      }}
    />
  );
}

// Logotipo completo, con el nombre
export function LogoFull({ size = 120, alt = 'Sincro' }) {
  return <img className="logo-full" src={LOGO_URL} alt={alt} width={size} height={size} />;
}
