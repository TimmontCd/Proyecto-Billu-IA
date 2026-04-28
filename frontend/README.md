# Frontend runtime

La UI activa se sirve desde `backend/src/main/resources/static`.

Este directorio queda reservado para una futura aplicacion frontend con build
propio. Mientras no exista ese pipeline, evitar duplicar aqui los HTML, CSS o
scripts que ya carga Spring Boot desde `backend/src/main/resources/static`.
