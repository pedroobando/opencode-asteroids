# Asteroids

Clon del clásico arcade **Asteroids** implementado en **HTML5 Canvas** puro, sin dependencias externas ni bundler. Todo reside en un solo archivo `game.js` y se ejecuta directamente en el navegador.

## Descripción

Pilotá una nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruí asteroides para sumar puntos, esquivá colisiones, aprovechá power-ups de velocidad y perseguí la estrella fugaz antes de que desaparezca. Cada nivel aumenta la dificultad agregando más asteroides.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en `game.js`
- **Web Audio API** — efectos de sonido simples
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abrí `index.html` directamente en el navegador (doble clic), o usá un servidor local:

```bash
npx serve .
```

Luego visitá `http://localhost:3000`.

## Controles

| Tecla       | Acción                            |
| ----------- | --------------------------------- |
| `←` `→`     | Rotar la nave                     |
| `↑`         | Propulsar                         |
| `Espacio`   | Disparar                          |
| `S`         | Activar el escudo                 |
| `Shift + S` | Cambiar la skin de la nave        |

> **Nota:** las teclas de dirección y `Espacio` evitan el desplazamiento de la página.

## Objetivo y estados

- Sobreviví el mayor tiempo posible y acumulá puntos destruyendo asteroides.
- El juego alterna entre tres estados:
  - **Jugando** (`playing`): controlás la nave y combatís.
  - **Muerto** (`dead`): la nave explotó; esperás 2 segundos para reaparecer con invencibilidad temporal.
  - **Game Over** (`gameover`): no quedan vidas. Presioná `Espacio` para reiniciar.

## Sistema de niveles

- Comenzás en el **nivel 1**.
- Cada nivel inicia con `3 + nivel` asteroides grandes.
- Cuando destruís todos los asteroides del nivel, pasás automáticamente al siguiente.
- El HUD muestra el nivel actual en la parte superior de la pantalla.

## Asteroides

Los asteroides se generan con formas irregulares y rotación propia. Al destruirlos, se parten en fragmentos más pequeños.

| Asteroide | Tamaño | Puntos |
| --------- | ------ | ------ |
| Grande    | 3      | 20     |
| Mediano   | 2      | 50     |
| Pequeño   | 1      | 100    |

## Estrella fugaz

- Aparece periódicamente cada **15–25 segundos** si no hay otra activa.
- Es un objeto rápido de color cyan con estela brillante.
- Duración: **10 segundos**.
- Puntos por destruirla: **500**.
- ⚠️ Si desaparece sin ser destruida, se divide en **2 asteroides pequeños**.

## Power-ups

Al destruir un asteroide hay un **10% de probabilidad** de soltar un power-up. Hay dos variantes:

### Velocidad (V) — 70% de los power-ups

- Aparece como un anillo dorado con la letra **V**.
- El power-up dura **8 segundos** en pantalla antes de desaparecer.
- Al recogerlo:
  - La velocidad máxima de la nave se duplica durante **5 segundos**.
  - Aparece una estela visual azul.
  - Se reproduce un efecto de sonido.

### Triple disparo (3) — 30% de los power-ups

- Aparece como un anillo naranja con el número **3**.
- Al recogerlo, durante **5 segundos** la nave dispara **3 balas en abanico**: una central y dos laterales que se abren progresivamente (drift perpendicular de 90 px/s por bala).
- Se reproduce un arpegio mayor ascendente al recogerlo.
- El HUD muestra el tiempo restante del efecto con una barra.

El HUD muestra el tiempo restante de cada efecto con su propia barra.

## Escudo

- Pulsá `S` para activar un escudo temporal que te protege de una colisión con un asteroide o una estrella fugaz.
- Duración del escudo: **3 segundos** con efecto visual de anillo cian pulsante.
- Al colisionar con el escudo activo, el asteroide o la estrella rebota y explota en partículas en vez de matarte.
- Tras agotarse, el escudo entra en **cooldown de 8 segundos** antes de poder volver a usarlo.
- El HUD muestra el estado del escudo en la esquina superior izquierda:
  - **ESCUDO** (cian) mientras está activo, con barra de tiempo restante.
  - **ESCUDO LISTO** (verde) cuando se puede volver a usar.
  - **ESCUDO** (gris) durante el cooldown, con barra de progreso de recarga.

## Skins

Pulsá `Shift + S` para ciclar entre las apariencias disponibles de la nave. La elección se guarda en `localStorage` y se restaura automáticamente al recargar la página. Al cambiar de skin se muestra brevemente el nombre en el HUD y los iconos de vida se actualizan a la nueva apariencia.

| Skin        | Color  | Descripción                              |
| ----------- | ------ | ---------------------------------------- |
| Clásica     | Blanca | Triángulo con muesca trasera (original). |
| Cazadora    | Roja   | Delta agresivo de 5 vértices.            |
| Acorazado   | Cyan   | Polígono ancho de 6 vértices.            |
| Espectral   | Violeta| Delta compacto con brillo (glow).         |

> Agregar más skins es trivial: basta con sumar un objeto más al array `SKINS` en `game.js`.

## Vidas e invencibilidad

- Tenés **3 vidas**.
- Al reaparecer tras morir, la nave es invencible durante **3 segundos** y parpadea.
- Durante la invencibilidad no colisionás con asteroides ni estrellas fugaces.

## Características

- Mundo toroidal: objetos reaparecen por el borde opuesto.
- Sistema de niveles progresivos.
- 3 vidas con invencibilidad temporal al reaparecer.
- Asteroides que se fragmentan al destruirse.
- Partículas de explosión al impactar.
- Power-ups de **velocidad** y **triple disparo** con drop aleatorio e indicador en pantalla.
- **Escudo** activable con cooldown para sobrevivir colisiones.
- **Skins** intercambiables para la nave (con persistencia en `localStorage`).
- Estrella fugaz con mecánica de recompensa/riesgo.
- Pantalla de Game Over con puntaje final.
- HUD en español: puntaje, nivel, vidas y estado de power-ups y escudo.
