# Checklist INVEST para Historias de Usuario

Usa este checklist para validar que una historia de usuario está correctamente dimensionada y redactada. Si alguna de estas condiciones falla, la historia debe ser re-evaluada y posiblemente descompuesta.

- [ ] **I - Independent (Independiente)**
  - ¿La historia se puede desarrollar y entregar de manera autónoma sin depender estrictamente de otra historia en el mismo Sprint?
  - Si hay dependencias técnicas inevitables, ¿el valor de negocio sigue siendo evaluable por separado?

- [ ] **N - Negotiable (Negociable)**
  - ¿La historia deja espacio para discutir el "cómo" con los desarrolladores?
  - Evitar el exceso de especificaciones técnicas rígidas si no son restricciones de negocio absolutas.

- [ ] **V - Valuable (Valiosa)**
  - ¿Queda claro el valor (el "para qué") que aporta al usuario, al cliente o a la empresa?
  - Si una historia solo dice "Crear tabla de base de datos X", no es V. Debe reformularse como "Como sistema, quiero persistir datos X para que la funcionalidad Y sea posible".

- [ ] **E - Estimable (Estimable)**
  - ¿El equipo puede entender de qué trata la historia lo suficiente como para asignarle un tamaño (Story Points)?
  - Si no es estimable, se necesita una tarea de `Spike` para investigar y reducir la incertidumbre.

- [ ] **S - Small / Sized Appropriately (Clara/Pequeña)**
  - ¿Es posible completar esta historia holgadamente dentro de un Sprint estándar (típicamente de 2 semanas) junto con otras historias?
  - Si la historia estimada es de `13 SP` o `21 SP` (o similar valor alto en la escala elegida), divídela en historias más pequeñas.

- [ ] **T - Testable (Testeable)**
  - ¿Están escritos los Criterios de Aceptación?
  - ¿Sabe un tester (o el Product Owner) qué pasos seguir para decir "Sí, esta historia está terminada"?
  - ¿Existen escenarios para el camino feliz y los caminos de error?
