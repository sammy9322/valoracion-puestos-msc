# Ejemplos de Descomposición de Historias (Slicing)

Este documento contiene ejemplos concretos de cómo las historias de usuario grandes (Épicas o Features) se "cortan" en rebanadas más pequeñas y manejables que aportan valor independiente.

## 1. Slicing por Pasos de Flujo de Trabajo (Workflow Steps)

**Historia Original (Demasiado Grande):**
> "Como gerente de contenido, quiero publicar noticias en el portal para que los usuarios puedan leerlas."

**Historias Descompuestas:**
- **US 1 (Borrador):** "Como gerente, quiero crear y guardar un borrador de noticia para poder revisarlo más tarde."
- **US 2 (Publicación):** "Como gerente, quiero publicar un borrador existente para que sea visible a los usuarios."
- **US 3 (Edición):** "Como gerente, quiero editar una noticia ya publicada para corregir errores."
- **US 4 (Archivo):** "Como gerente, quiero archivar noticias antiguas para mantener el portal actualizado."

## 2. Slicing por Reglas de Negocio (Business Rules)

**Historia Original (Demasiado Grande):**
> "Como cliente, quiero comprar productos usando mi tarjeta de crédito para recibir mi pedido."

**Historias Descompuestas:**
- **US 1 (Happy Path - Visa/MC):** "Como cliente, quiero pagar mi carrito usando tarjetas Visa o Mastercard."
- **US 2 (Regla de Límite):** "Como sistema, quiero rechazar compras superiores a $10,000 con un mensaje explicativo por prevención de fraude."
- **US 3 (Tarjetas Extendidas):** "Como cliente, quiero pagar mi carrito usando American Express o Discover."
- **US 4 (Tarjetas Rechazadas):** "Como cliente, quiero ver un mensaje de error detallado si mi tarjeta es rechazada por fondos insuficientes."

## 3. Slicing por Esfuerzo de Interfaz de Usuario (UI Actions)

**Historia Original (Demasiado Grande):**
> "Como administrador, quiero gestionar los usuarios del sistema (Crear, Leer, Modificar, Borrar)."

**Historias Descompuestas:**
- **US 1 (Listado Básico):** "Como administrador, quiero ver una lista tabular de todos los usuarios registrados."
- **US 2 (Búsqueda):** "Como administrador, quiero buscar usuarios por email o nombre dentro del listado."
- **US 3 (Alta):** "Como administrador, quiero crear un nuevo usuario con permisos básicos."
- **US 4 (Desactivación Soft-Delete):** "Como administrador, quiero desactivar a un usuario existente (soft-delete) para revocar su acceso sin perder su histórico."

## 4. Slicing por Plataforma / Cliente

**Historia Original (Demasiado Grande):**
> "Como viajero, quiero ver el itinerario de mi vuelo para conocer los horarios."

**Historias Descompuestas:**
- **US 1 (WebApp):** "Como viajero, quiero ver el itinerario de mi vuelo en la aplicación web de escritorio."
- **US 2 (App Móvil iOS):** "Como viajero, quiero ver el itinerario de mi vuelo en la app de iOS nativa."
- **US 3 (App Móvil Android):** "Como viajero, quiero ver el itinerario de mi vuelo en la app nativa de Android con soporte para Material You."
- **US 4 (Email):** "Como viajero, quiero recibir mi itinerario por correo electrónico."
