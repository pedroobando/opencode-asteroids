---
description: Crea un worktree de git en .worktrees/<nombre> normalizando el argumento recibido (sin truncar, aplicando analisis semantico y abreviaturas).
agent: build
---

El usuario ejecuto `/worktree $ARGUMENTS`.

Tu unica tarea es tomar el texto recibido en `$ARGUMENTS`, normalizarlo siguiendo las reglas de abajo y crear el worktree.

## Reglas de normalizacion (aplicar en este orden estricto)

1. **Trim** de espacios al inicio y al final.
2. **Minusculas** en todo el texto.
3. **Quitar acentos y diacriticos**: normalizar a NFD y eliminar diacriticos (a, e, i, o, u, n). Queda ASCII limpio.
4. **Eliminar prefijo numerico heredado** al inicio: cualquier secuencia `^(\d{1,2}-)+` (ej: `01-`, `02-03-`). No coincide con prefijos de 3 o mas digitos como `123-`. Si no existe, no hacer nada en este paso.
5. **Detectar intencion** (cualquier coincidencia en el texto, sin importar donde):
   - `feat`: feat, feature, nueva, nuevo, agregar, agrega, crear, crea, implementar, implementa, sumar, suma, anadir, incorpora, incorporar
   - `fix`: fix, bug, error, arreglar, arregla, corregir, corrige, reparar, repara, rompe, roto, rota
   - `refactor`: refactor, limpiar, limpia, reestructurar, reorganizar, reducir
   - `chore`: chore, tarea, mantenimiento, mover, renombrar
   - `docs`: docs, doc, documentacion, readme, comentario, comentarios
   - Si hay mas de una intencion detectada o hay ambiguedad, NO anteponer prefijo.
   - Si no se detecta ninguna, NO anteponer prefijo.
6. **Eliminar la palabra-intencion del cuerpo**: si se detecto intencion en el paso 5, quitar del cuerpo todas las ocurrencias exactas de esa palabra (comparacion en minusculas, sin acentos). Esto evita duplicados como `fix-fix`. Si no se detecto intencion, no hacer nada en este paso.
7. **Tokenizar** el texto por espacios y guiones existentes.
8. **Eliminar stopwords** en espanol (en cualquier forma, comparando en minusculas sin acentos): de, del, la, las, el, los, y, e, o, u, para, con, por, a, en, un, una, unos, unas, al, lo, le, se, que, si, no, mi, tu, su, este, esta, estos, estas.
   - Si la unica palabra que queda del texto era una stopword, se elimina tambien.
9. **Abreviar con juicio si sigue siendo largo** (solo si se cumple CUALQUIERA de estas condiciones):
   - Hay mas de 4 tokens (sin contar el prefijo semantico).
   - El nombre resultante con prefijo incluido supera 30 caracteres.
   - Para cada palabra restante que tenga mas de 7 letras, reducir a sus primeras 4 letras (preservar la raiz legible). Si la primera forma de 4 letras colisiona con otra ya presente o con el prefijo semantico, ajustar a 3 o 5 letras para evitar duplicados.
10. **Colapsar guiones** repetidos y recortar guiones al inicio/fin.
11. **Sanitizar**: cualquier caracter fuera de `[a-z0-9-]` se reemplaza por `-`, luego colapsar guiones repetidos y recortar extremos otra vez.
12. **Validacion final**: si el resultado esta vacio, devolver error y NO ejecutar nada.

## Comportamiento final

- Si es valido, ejecutar exactamente este comando, sin cambiar de directorio y sin nada mas:

  ```bash
  git worktree add .worktrees/<nombre-normalizado>
  ```

- Reportar en DOS lineas:
  - Linea 1: `Normalizado: "<texto-despues-de-trim>" -> "<nombre-normalizado>"`
  - Linea 2: `Worktree creado: .worktrees/<nombre-normalizado>` o `Error: <motivo>`

## Restricciones estrictas

- No cambiar de directorio.
- No ejecutar comandos adicionales al `git worktree add`.
- No modificar archivos del proyecto (solo crear el worktree).
- NO truncar el nombre arbitrariamente; las abreviaciones del paso 9 si estan permitidas.
- Si dudas entre varias opciones de normalizacion, elegi la que produzca el nombre mas corto y entendible.
