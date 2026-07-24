// Genera el PDF del contrato con la impresión del navegador.
//
// Ponytail: no se suma una librería de PDF (jsPDF/pdf-lib pesan y hay que
// paginar y medir el texto a mano). Se abre una ventana con el contrato
// maquetado para imprimir y el navegador ofrece "Guardar como PDF". Sale un
// PDF de verdad, con paginación real, y cero dependencias. Cuando haga falta
// firma con proveedor, ese sí generará el PDF del lado del servidor.

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Abre la vista imprimible del contrato ya resuelto y dispara la impresión. */
export function imprimirContrato(opts: { titulo: string; oficina: string; cuerpo: string; fecha: string }) {
  const w = window.open('', '_blank', 'width=820,height=1000')
  if (!w) { alert('El navegador bloqueó la ventana. Permití las ventanas emergentes para descargar el PDF.'); return }
  // El cuerpo es texto plano: se respetan los saltos de línea con white-space.
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>${esc(opts.titulo)}</title>
    <style>
      @page { margin: 2.2cm 2cm; }
      * { box-sizing: border-box; }
      body { font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.7; font-size: 12pt; margin: 0; }
      header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 26px; display: flex; justify-content: space-between; align-items: baseline; }
      header .of { font-size: 15pt; font-weight: bold; letter-spacing: .3px; }
      header .fe { font-size: 10pt; color: #555; }
      h1 { font-size: 16pt; margin: 0 0 22px; text-align: center; }
      .cuerpo { white-space: pre-wrap; }
      @media screen { body { max-width: 720px; margin: 30px auto; padding: 0 20px; } }
    </style></head><body>
    <header><span class="of">${esc(opts.oficina)}</span><span class="fe">${esc(opts.fecha)}</span></header>
    <h1>${esc(opts.titulo)}</h1>
    <div class="cuerpo">${esc(opts.cuerpo)}</div>
    <script>window.onload = function(){ setTimeout(function(){ window.print() }, 150) }<\/script>
    </body></html>`)
  w.document.close()
}
