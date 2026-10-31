import type { PreguntaExamen } from '@/types/examen'

export interface ExamenExportable {
  titulo: string
  preguntas: PreguntaExamen[]
}

function textoPregunta(pregunta: PreguntaExamen, numero: number): string {
  const texto = pregunta.enunciado?.trim() || pregunta.texto_con_espacio?.trim()
  if (!texto) throw new Error(`La pregunta ${numero} no tiene enunciado.`)
  return texto
}

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(texto: string): string {
  return `<![CDATA[${texto.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`
}

function desglosarOpcion(opcion: string, indice: number): { letra: string; texto: string } {
  const match = opcion.trim().match(/^([A-Z])[\.\)]\s*(.*)$/i)
  return {
    letra: match?.[1].toUpperCase() ?? String.fromCharCode(65 + indice),
    texto: match?.[2]?.trim() || opcion.trim(),
  }
}

function respuestaNormalizada(respuesta: string | undefined): string | null {
  if (!respuesta) return null
  const trimmed = respuesta.trim().toUpperCase()
  const match = trimmed.match(/^([A-Z])(?:[\.\)])?$/)
  return match?.[1] ?? null
}

function parsearGift(pregunta: PreguntaExamen, numero: number) {
  if (!pregunta.gift_text) return null
  const gift = pregunta.gift_text.trim()
  const match = gift.match(/^(?:::([^:]+)::\s*)?([\s\S]*?)\s*\{([\s\S]*)\}\s*$/)
  if (!match) {
    throw new Error(`La pregunta ${numero} tiene sintaxis GIFT no compatible con la exportación Moodle XML.`)
  }

  const [, nombre, enunciado, bloqueRespuestas] = match
  const respuestas = Array.from(bloqueRespuestas.matchAll(/([=~])([^=~]*)/g))
    .map((respuesta) => ({
      correcta: respuesta[1] === '=',
      texto: respuesta[2].trim(),
    }))
    .filter((respuesta) => respuesta.texto)

  if (!enunciado.trim() || respuestas.length < 2 || respuestas.filter((r) => r.correcta).length !== 1) {
    throw new Error(`La pregunta ${numero} GIFT debe tener enunciado, al menos dos opciones y una respuesta correcta.`)
  }

  return { nombre: nombre?.trim(), enunciado: enunciado.trim(), respuestas }
}

function construirPreguntaXml(pregunta: PreguntaExamen, indice: number): string {
  const numero = pregunta.numero ?? indice + 1
  const nombre = `Pregunta ${numero}`
  const gift = parsearGift(pregunta, numero)
  const enunciado = gift?.enunciado ?? textoPregunta(pregunta, numero)
  const nombrePregunta = gift?.nombre || nombre
  const questionText = `<questiontext format="html"><text>${cdata(`<p>${escaparXml(enunciado).replace(/\n/g, '<br />')}</p>`)}</text></questiontext>`
  const generalFeedback = `<generalfeedback format="html"><text>${cdata(escaparXml(pregunta.justificacion ?? ''))}</text></generalfeedback>`
  const common = `<name><text>${escaparXml(nombrePregunta)}</text></name>${questionText}${generalFeedback}<defaultgrade>1.0000000</defaultgrade><hidden>0</hidden><idnumber></idnumber>`

  if (gift || pregunta.opciones?.length) {
    const opciones = gift?.respuestas ?? pregunta.opciones?.map((opcion, opcionIndice) => ({
      ...desglosarOpcion(opcion, opcionIndice),
      correcta: false,
    }))
    if (!opciones || opciones.length < 2) {
      throw new Error(`La pregunta ${numero} necesita al menos dos opciones para exportarse como opción múltiple.`)
    }

    let respuestas: Array<{ texto: string; correcta: boolean }>
    if (gift) {
      respuestas = gift.respuestas
    } else {
      const correcta = respuestaNormalizada(pregunta.respuesta_correcta)
      if (!correcta) throw new Error(`La pregunta ${numero} no tiene una respuesta correcta válida.`)
      const marcada = opciones.filter((opcion) => 'letra' in opcion && opcion.letra === correcta)
      if (marcada.length !== 1) {
        throw new Error(`La respuesta correcta de la pregunta ${numero} no coincide con sus opciones.`)
      }
      respuestas = opciones.map((opcion) => ({
        texto: opcion.texto,
        correcta: 'letra' in opcion && opcion.letra === correcta,
      }))
    }

    return `<question type="multichoice">${common}<penalty>0.3333333</penalty><single>true</single><shuffleanswers>true</shuffleanswers><answernumbering>abc</answernumbering>${respuestas.map((respuesta) => `<answer fraction="${respuesta.correcta ? '100' : '0'}" format="html"><text>${cdata(respuesta.texto)}</text><feedback format="html"><text></text></feedback></answer>`).join('')}</question>`
  }

  if (pregunta.texto_con_espacio || pregunta.palabra_correcta) {
    if (!pregunta.palabra_correcta?.trim()) {
      throw new Error(`La pregunta ${numero} no tiene la palabra correcta para completar el espacio.`)
    }
    return `<question type="shortanswer">${common}<penalty>0.3333333</penalty><usecase>0</usecase><answer fraction="100"><text>${cdata(pregunta.palabra_correcta.trim())}</text><feedback format="html"><text></text></feedback></answer></question>`
  }

  if (pregunta.rubrica !== undefined) {
    return `<question type="essay">${common}<penalty>0.0000000</penalty><responseformat>editor</responseformat><responserequired>1</responserequired><responsefieldlines>15</responsefieldlines><attachments>0</attachments><attachmentsrequired>0</attachmentsrequired><graderinfo format="html"><text>${cdata(escaparXml(pregunta.rubrica))}</text></graderinfo><responsetemplate format="html"><text></text></responsetemplate></question>`
  }

  throw new Error(`El formato de la pregunta ${numero} no se puede convertir a Moodle XML.`)
}

export function generarMoodleXml(examen: ExamenExportable): string {
  if (examen.preguntas.length === 0) throw new Error('El examen no contiene preguntas para exportar.')
  const titulo = escaparXml(examen.titulo.trim() || 'Examen')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n<question type="category"><category><text>$course$/top/${titulo}</text></category></question>\n${examen.preguntas.map(construirPreguntaXml).join('\n')}\n</quiz>\n`
}

export function generarAiken(examen: ExamenExportable): string {
  if (examen.preguntas.length === 0) throw new Error('El examen no contiene preguntas para exportar.')

  return examen.preguntas.map((pregunta, indice) => {
    const numero = pregunta.numero ?? indice + 1
    const enunciado = textoPregunta(pregunta, numero)
    if (!pregunta.opciones || pregunta.opciones.length < 2) {
      throw new Error(`AIKEN solo admite opción múltiple; la pregunta ${numero} no tiene opciones.`)
    }

    const opciones = pregunta.opciones.map((opcion, opcionIndice) => desglosarOpcion(opcion, opcionIndice))
    const correcta = respuestaNormalizada(pregunta.respuesta_correcta)
    if (!correcta || opciones.filter((opcion) => opcion.letra === correcta).length !== 1) {
      throw new Error(`La respuesta correcta de la pregunta ${numero} no coincide con sus opciones.`)
    }

    return [
      enunciado,
      ...opciones.map((opcion) => `${opcion.letra}. ${opcion.texto}`),
      `ANSWER: ${correcta}`,
    ].join('\n')
  }).join('\n\n') + '\n'
}

export function descargarArchivo(nombre: string, contenido: string, tipo: string): void {
  const blob = new Blob([contenido], { type: `${tipo};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombre
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function nombreArchivo(titulo: string): string {
  const nombre = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return nombre || 'examen'
}
