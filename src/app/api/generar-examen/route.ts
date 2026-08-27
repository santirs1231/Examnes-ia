import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerarExamenBody {
  materia_id: string
  semanas: number[]
  temas: number[]
  tipo: 'parcial' | 'quiz' | 'taller'
  nivel: 'basico' | 'intermedio' | 'avanzado'
  cantidad_preguntas: number
  formato: 'aiken' | 'palabra_ausente' | 'desarrollo' | 'GITF'
  titulo: string
  porcentaje_nota: string
  instrucciones_adicionales: string
  incluir_respuestas: boolean
  mezclar_opciones: boolean
  idioma: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function obtenerContextoMateria(body: GenerarExamenBody) {
  // Obtener nombre de la materia
  const { data: materia } = await supabase
    .from('materias')
    .select('nombre, codigo, descripcion')
    .eq('id', Number(body.materia_id))
    .single()

  // Obtener semanas seleccionadas con sus temas
  const { data: semanas } = await supabase
    .from('semanas')
    .select(`
      id, numero_semana, objetivo_semanal,
      temas ( id, titulo, descripcion )
    `)
    .in('id', body.semanas)
    .order('numero_semana')

  // Si el usuario seleccionó temas específicos, filtrarlos
  let temasTexto = ''
  if (body.temas.length > 0) {
    const temasSeleccionados = (semanas ?? [])
      .flatMap((s: any) => s.temas ?? [])
      .filter((t: any) => body.temas.includes(t.id))

    temasTexto = temasSeleccionados
      .map((t: any) => `- ${t.titulo}${t.descripcion ? `: ${t.descripcion}` : ''}`)
      .join('\n')
  } else {
    temasTexto = (semanas ?? [])
      .flatMap((s: any) => (s.temas ?? []).map((t: any) =>
        `- [Semana ${s.numero_semana}] ${t.titulo}${t.descripcion ? `: ${t.descripcion}` : ''}`
      ))
      .join('\n')
  }

  const semanasTexto = (semanas ?? [])
    .map((s: any) => `Semana ${s.numero_semana}: ${s.objetivo_semanal || 'Sin objetivo definido'}`)
    .join('\n')

  return { materia, semanasTexto, temasTexto }
}

function construirPrompt(body: GenerarExamenBody, contexto: {
  materia: any
  semanasTexto: string
  temasTexto: string
}): string {
  const idiomas: Record<string, string> = {
    es: 'español',
    en: 'inglés',
    pt: 'portugués',
  }

  const formatoDescripcion: Record<string, string> = {
    aiken: `Formato AIKEN (opción múltiple). Cada pregunta tiene un enunciado, 4 opciones (A, B, C, D), y una línea ANSWER indicando la respuesta correcta. Ejemplo:
¿Cuál es la capital de Francia?
A. Madrid
B. París
C. Berlín
D. Roma
ANSWER: B`,

    palabra_ausente: `Formato de Palabra Ausente (Cloze / fill-in-the-blank). Cada pregunta es una oración con un espacio en blanco marcado con "________" que el estudiante debe completar. Incluye la respuesta correcta.`,

    desarrollo: `Formato de Desarrollo (respuesta abierta). Cada pregunta requiere una respuesta argumentativa y detallada. Incluye una rúbrica de evaluación o respuesta modelo.`,

    GITF: `Formato GIFT (compatible con Moodle). Usa la sintaxis GIFT para las preguntas. Ejemplo para opción múltiple:
::Pregunta 1:: ¿Cuál es la capital de Francia? {
=París
~Madrid
~Berlín
~Roma
}`,
  }

  return `Eres un profesor universitario experto en la materia "${contexto.materia?.nombre || 'No especificada'}" (${contexto.materia?.codigo || ''}).

TAREA: Genera un examen tipo ${body.tipo.toUpperCase()} con las siguientes especificaciones:

📋 CONFIGURACIÓN DEL EXAMEN:
- Tipo de evaluación: ${body.tipo}
- Número de preguntas: ${body.cantidad_preguntas}
- Nivel de dificultad: ${body.nivel}
- Idioma: ${idiomas[body.idioma] || 'español'}
${body.titulo ? `- Título: ${body.titulo}` : '- Genera un título apropiado para el examen'}
${body.porcentaje_nota ? `- Porcentaje de la nota: ${body.porcentaje_nota}%` : ''}
${body.mezclar_opciones ? '- Mezcla el orden de las opciones de respuesta' : ''}

📚 CONTENIDO A EVALUAR:

Semanas y objetivos:
${contexto.semanasTexto}

Temas:
${contexto.temasTexto}

📝 FORMATO DE LAS PREGUNTAS:
${formatoDescripcion[body.formato] || 'Opción múltiple estándar'}

${body.incluir_respuestas ? '✅ INCLUYE una sección de RESPUESTAS CORRECTAS al final del examen, separada claramente.' : ''}

${body.instrucciones_adicionales ? `📌 INSTRUCCIONES ADICIONALES DEL PROFESOR:\n${body.instrucciones_adicionales}` : ''}

REGLAS IMPORTANTES:
1. Las preguntas deben estar basadas EXCLUSIVAMENTE en los temas proporcionados.
2. Distribuye las preguntas de manera equilibrada entre los temas.
3. Adapta la complejidad al nivel "${body.nivel}":
   - Básico: conceptos fundamentales, definiciones, identificación.
   - Intermedio: aplicación, análisis, comparación.
   - Avanzado: síntesis, evaluación, casos complejos, pensamiento crítico.
4. Cada pregunta debe ser clara, precisa y sin ambigüedad.
5. Numera las preguntas secuencialmente.

Responde SOLAMENTE con el contenido del examen en formato JSON con la siguiente estructura:
{
  "titulo": "Título del examen",
  "materia": "Nombre de la materia",
  "tipo": "parcial|quiz|taller",
  "nivel": "basico|intermedio|avanzado",
  "total_preguntas": <número>,
  "preguntas": [
    {
      "numero": 1,
      "enunciado": "Texto de la pregunta",
      "opciones": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "respuesta_correcta": "B",
      "justificacion": "Breve explicación de por qué es correcta"
    }
  ]
}

Nota: Para formato "desarrollo", omite "opciones" y "respuesta_correcta", y usa "rubrica" en su lugar.
Para formato "palabra_ausente", usa "texto_con_espacio" y "palabra_correcta" en lugar de "opciones".
Para formato "GIFT", incluye un campo "gift_text" con la pregunta en sintaxis GIFT.`
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Validar que existe la API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'No se ha configurado la API key de OpenAI. Agrega OPENAI_API_KEY en .env.local' },
        { status: 500 }
      )
    }

    const body: GenerarExamenBody = await request.json()

    // Validaciones básicas
    if (!body.materia_id || body.semanas.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar una materia y al menos una semana.' },
        { status: 400 }
      )
    }

    // Obtener contexto de la materia desde Supabase
    const contexto = await obtenerContextoMateria(body)

    // Construir el prompt
    const prompt = construirPrompt(body, contexto)

    // Llamar a OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un generador de exámenes universitarios. Responde SOLO con JSON válido, sin bloques de código markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const contenido = completion.choices[0]?.message?.content

    if (!contenido) {
      return NextResponse.json(
        { error: 'No se recibió respuesta de la IA.' },
        { status: 500 }
      )
    }

    // Parsear la respuesta JSON
    const examen = JSON.parse(contenido)

    return NextResponse.json({
      success: true,
      examen,
      uso: {
        tokens_prompt: completion.usage?.prompt_tokens,
        tokens_respuesta: completion.usage?.completion_tokens,
        tokens_total: completion.usage?.total_tokens,
        modelo: completion.model,
      },
    })

  } catch (error: any) {
    console.error('Error al generar examen:', error)

    // Errores específicos de OpenAI
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'API key de OpenAI inválida. Verifica tu OPENAI_API_KEY en .env.local' },
        { status: 401 }
      )
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Se excedió el límite de la API de OpenAI. Intenta de nuevo en unos minutos.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor al generar el examen.' },
      { status: 500 }
    )
  }
}
