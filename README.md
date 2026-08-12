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

| Tecla     | Acción         |
| --------- | -------------- |
| `←` `→`   | Rotar la nave  |
| `↑`       | Propulsar      |
| `Espacio` | Disparar       |

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

## Power-up de velocidad

- Al destruir un asteroide hay un **10% de probabilidad** de soltar un power-up dorado con la letra **V**.
- El power-up dura **8 segundos** en pantalla antes de desaparecer.
- Al recogerlo:
  - La velocidad máxima de la nave se duplica durante **5 segundos**.
  - Aparece una estela visual azul.
  - Se reproduce un efecto de sonido.
- El HUD muestra el tiempo restante del efecto con una barra.

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
- Power-up de velocidad con indicador en pantalla.
- Estrella fugaz con mecánica de recompensa/riesgo.
- Pantalla de Game Over con puntaje final.
- HUD en español: puntaje, nivel, vidas y estado del power-up.
