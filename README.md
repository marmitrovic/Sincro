# Sincro · CitaFácil · Prototipo (MVP)

Web en React para que **cualquier paciente**, aunque no esté acostumbrado a la tecnología, pueda:

0. **Identificarse solo con su tarjeta sanitaria**, en su idioma (10 idiomas).
1. **Contar sus síntomas** en un formulario sencillo.
2. Enviar su solicitud: un profesional la revisa y le da la cita adecuada.
3. **Elegir día y hora** de su cita según esa prioridad.
4. **Gestionar sus citas**: confirmar asistencia, cambiar fecha, anular, y **guardarla donde quiera**: Google Calendar, Calendario de Apple, Outlook, archivo .ics, código QR para pasarla del ordenador al móvil, WhatsApp, correo, SMS, copiar o imprimir/PDF.
5. Recibir **avisos**, entre ellos la **oferta de adelanto** cuando se libera un hueco antes.

Además incluye un **Panel de triaje para el personal** (enlace «Acceso para profesionales» al pie, o `#staff`), con las solicitudes ordenadas por prioridad y un resumen listo para el médico.

---

## Cómo ejecutarlo

Necesita **Node.js 18 o superior**.

```bash
npm install
npm run dev
```

Abra la dirección que aparece (normalmente http://localhost:5173).

Versión para publicar:

```bash
npm run build      # genera la carpeta dist/
npm run preview    # la sirve en local para comprobarla
```

La carpeta `dist/` (ya incluida en el zip) se puede subir tal cual a cualquier hosting estático, como Netlify, Vercel, GitHub Pages o un servidor del hospital. Debe servirse desde un servidor web: abriendo `index.html` con doble clic no funciona.

---

## Recorrido del paciente

| Paso | Pantalla | Qué hace |
|---|---|---|
| 1 | **Tarjeta sanitaria + documento** | Código de la tarjeta y DNI, NIE o pasaporte (se comprueba la letra del DNI/NIE). Solo se muestra «Tarjeta válida» y el número de la tarjeta: nunca el nombre ni la edad |
| 2 | **Señales de alarma** | Si marca alguna (dolor fuerte en el pecho, falta de aire, signos de ictus…), **no se da cita**: se le muestra «Llame al 112» |
| 3 | Zona del cuerpo | 6 zonas con iconos + «No lo sé» |
| 4 | Síntomas | Lista de la zona elegida (varias opciones) |
| 5 | Con sus palabras | Texto libre (opcional) |
| 6 | **Cómo es la molestia** | Tres preguntas cortas en una sola pantalla: desde cuándo (4 opciones), cómo va (3) y cuánto molesta (4 caras) |
| 7 | ¿Revisión o primera vez? | Tipo de visita P / S, como en el dataset |
| 8 | Necesidades | Movilidad reducida, intérprete, acompañante, auditiva, visual |
| 9 | Avisos | Se pueden marcar **varias** formas: SMS, llamada, email, web o carta. Según lo elegido se pide teléfono, correo o dirección postal (con código postal), y se comprueba cada dato |
| 10 | Revisión | Todas las respuestas; «Cambiar» lleva a la pregunta y vuelve directamente aquí |
| → | Resultado | Especialidad + prioridad + «¿Por qué?». Si no se puede saber la especialidad, **la decide un profesional** (ya no se pregunta al paciente) y se le avisa en 2 días laborables |
| → | Elegir hueco | Días y horas libres según la prioridad |
| → | Confirmación | Guardar la cita (ver abajo), imprimir, cómo prepararse |

### Idiomas
- Botón **🌐** en la cabecera con 10 idiomas, cada uno escrito en su propia lengua: español, català, euskara, galego, English, français, português, română, українська y العربية (de derecha a izquierda).
- **Por defecto se usa el idioma del dispositivo** desde el que entra el paciente (configuración de idioma y región del móvil u ordenador). No pide permisos ni envía datos fuera. Si el idioma no está disponible, español. Si el paciente elige otro, se recuerda.
- «Escuchar» lee las preguntas en el idioma elegido.
- El panel del personal sigue en español: las respuestas le llegan traducidas y se indica el idioma del paciente (el texto libre llega tal cual).
- Traducciones en `src/i18n/locales/`. Para añadir un idioma: copiar `en.js`, traducirlo y sumarlo a `LANGUAGES` en `src/i18n/index.js`.

### Guardar la cita
La primera opción es la recomendada para el dispositivo (Calendario de Apple en iPhone/Mac, Google Calendar en Android y ordenadores):
- **Calendarios**: Google Calendar, Calendario de Apple, Outlook.com y archivo `.ics` para cualquier otro (con recordatorio el día antes y 2 horas antes).
- **Del ordenador al móvil**: código QR que la cámara del iPhone o Android reconoce como evento de calendario.
- **Enviar**: compartir (menú del móvil), WhatsApp, correo, SMS o copiar el texto, para uno mismo o un familiar.
- **Papel**: imprimir o guardar en PDF.
Todo se genera en el navegador, sin enviar datos a ningún servidor.

### Pensado para personas no tecnológicas
- Pocas preguntas y cortas, con barra de progreso («Paso 3 de 10»).
- Letra grande y botón **A / A / A** para agrandarla aún más; la preferencia se guarda.
- Botón **🔊 Escuchar** en cada pregunta, que la lee en voz alta.
- Botones de al menos 56 px, mucho contraste y lenguaje sencillo (de «usted»).
- Botones «Atrás» y «Continuar» siempre fijos abajo; también funciona el botón atrás del móvil.
- Confirmaciones dentro de la propia página, sin ventanas emergentes del navegador.
- Opción **«Prefiero hablar con una persona / que me llamen»** en todo momento.

---

## Cómo funciona el triaje (`src/data/triage.js`)

Reglas simples y transparentes, fáciles de revisar por personal sanitario:

- **Señal de alarma** → derivación inmediata al 112 / Urgencias.
- Puntos por: síntomas importantes (p. ej. sangre en heces, lunar que cambia, palpitaciones), intensidad, duración reciente, si va a peor, palabras clave en el texto libre y edad ≥ 75. Los motivos se guardan como códigos y se muestran en el idioma de cada persona.
- **≥ 7 puntos → URGENTE** (cita en 1–4 días) · **4–6 → PREFERENTE** (≤ 15 días) · **< 4 → ORDINARIA** (primera libre, con aviso si se libera un hueco antes).
- Si elige «No lo sé», se deduce la especialidad por las palabras de su descripción; si tampoco se puede, la solicitud pasa al personal (estado `EN_REVISION`), que asigna la especialidad y contacta con el paciente.
- Mayores de 75 años suman 1 punto: la edad se obtiene de la tarjeta sanitaria.

> ⚠️ Es un **prototipo**: el triaje es orientativo, no es un producto sanitario y no sustituye la valoración de un profesional. Las reglas deben validarse con el equipo clínico.

## Relación con el dataset

Los códigos y estados son los mismos que en los CSV (`AGENDAS`, `HUECOS_AGENDA`, `CITAS`, `DERIVACIONES_AP`, `COMUNICACIONES`, `MOVIMIENTOS_CITAS`, `PACIENTES`):

- Especialidades: `CAR, DER, DIG, NRL, OFT, TRA`
- Prioridad: `URGENTE / PREFERENTE / ORDINARIA` · tipo de visita `P / S`
- Agendas de 08:00 a 15:00 con huecos de 20 min
- Avisos: `CONFIRMACION_CITA, RECORDATORIO, AVISO_CAMBIO_CITA, OFERTA_ADELANTO` y respuestas `ACEPTA / RECHAZA`
- Historial de la cita: `CREACION, REPROGRAMACION, ANULACION, CONFIRMACION`
- Paciente: `preferencias_contacto` y `necesidades_accesibilidad` con los mismos valores

## Estructura

```
src/
  App.jsx                  navegación, cabecera (logo, idioma, tamaño de letra), avisos automáticos
  i18n/index.js            idiomas, detección, traducción, fechas
  i18n/I18nProvider.jsx    idioma activo de la app
  i18n/locales/*.js        textos de cada idioma (es.js es la base)
  data/patients.js         identificación por tarjeta sanitaria (simulada)
  data/calendar.js         .ics, Google, Outlook, QR, WhatsApp, correo, SMS
  components/SaveOptions.jsx  opciones para guardar o enviar la cita
  components/LanguagePicker.jsx  selector de idioma
  components/Logo.jsx      logotipo Sincro (public/)
  data/triage.js           preguntas, síntomas y motor de triaje
  data/slots.js            huecos de agenda de demostración
  data/store.jsx           estado global guardado en el navegador (localStorage)
  components/ui.jsx        botones, tarjetas de opción, voz (leer en alto), modal
  screens/Home.jsx         inicio
  screens/Triage.jsx       formulario de síntomas paso a paso
  screens/Result.jsx       resultado, urgencia (112), «le llamaremos»
  screens/PickSlot.jsx     elegir día y hora
  screens/Appointments.jsx cita reservada, mis citas, oferta de adelanto, avisos
  screens/Staff.jsx        panel de triaje para profesionales
  styles.css               estilos (accesibles, adaptados a móvil)
```

## Limitaciones del MVP y siguientes pasos

- **Sin servidor**: los datos se guardan solo en el navegador. Siguiente paso: una API que lea y escriba en las tablas reales (citas, huecos, comunicaciones).
- **Huecos simulados**: se generan con el mismo patrón que `HUECOS_AGENDA`; hay que conectarlos a la agenda real.
- **La oferta de adelanto es una simulación**: aparece unos segundos después de reservar una cita lejana. En producción se lanzaría cuando otro paciente anula.
- **Identificación simulada**: el código de la tarjeta sanitaria genera un paciente de ejemplo (`src/data/patients.js`). Hay que conectarlo al registro real de pacientes (y, si se quiere, a Cl@ve). Tampoco hay envío real de SMS o email.
- **Traducciones**: hechas para el prototipo; deben revisarlas traductores profesionales, sobre todo los textos médicos y de urgencias. Las palabras clave del texto libre que ajustan la prioridad solo están en español.
- **Idioma por defecto**: se toma del dispositivo. Detectar la región exacta (p. ej. Cataluña o Galicia con un móvil en castellano) necesitaría geolocalización por IP en un servidor.
- **Triaje con IA**: el texto libre podría analizarse con un modelo de lenguaje para sugerir la especialidad y resumir el caso al médico, siempre con revisión humana.
