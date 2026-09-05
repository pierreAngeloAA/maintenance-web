#!/usr/bin/env bash
# Junta las tres apps en un solo sitio.
#
# Tienen que salir del MISMO dominio para que compartan localStorage: asi la
# sesion sobrevive al cambio de contexto y no hay que volver a iniciarla. Con
# subdominios serian origenes distintos y el token de una no existiria en la
# otra.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/dist/site"

rm -rf "$SITE"
mkdir -p "$SITE"

for app in cliente taller almacen; do
  cp -r "$ROOT/dist/app-$app/browser" "$SITE/$app"
done

# La raiz lleva al cliente: es el contexto que tiene todo el mundo.
cat > "$SITE/index.html" <<'HTML'
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Maintenance</title>
  <meta http-equiv="refresh" content="0; url=/cliente/">
</head>
<body><a href="/cliente/">Ir a Maintenance</a></body>
</html>
HTML
