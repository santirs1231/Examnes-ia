'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getMaterias, getMicrocurriculoCompleto } from '@/lib/queries'
import type { Materia, Tema, SemanaConTemas, MateriaConSemanas } from '@/types/microcurriculo'

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoEvaluacion = 'parcial' | 'quiz' | 'taller'
type FormatoEvaluacion = 'aiken' | 'palabra_ausente' | 'desarrollo' | 'GITF'
type NivelDificultad = 'basico' | 'intermedio' | 'avanzado'
type PageTab = 'generar' | 'avanzado'

interface FormState {
  materia_id: string
  semanas: number[]
  temas: number[]
  tipo: TipoEvaluacion
  nivel: NivelDificultad
  cantidad_preguntas: number
  formato: FormatoEvaluacion
  titulo: string
  porcentaje_nota: string
  instrucciones_adicionales: string
  incluir_respuestas: boolean
  mezclar_opciones: boolean
  idioma: string
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function CheckChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        checked
          ? 'bg-purple-600 border-purple-600 text-white'
          : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700'
      }`}
    >
      {label}
    </button>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: () => void; label: string; description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${checked ? 'bg-purple-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// ─── Tab Generar ──────────────────────────────────────────────────────────────

function TabGenerar({ form, setForm, materias, semanas, temasList }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  materias: Materia[]
  semanas: SemanaConTemas[]
  temasList: Tema[]
}) {
  const toggleSemana = (id: number) =>
    setForm((f) => ({
      ...f,
      semanas: f.semanas.includes(id) ? f.semanas.filter((s) => s !== id) : [...f.semanas, id],
      temas: [],
    }))

  const toggleTema = (id: number) =>
    setForm((f) => ({
      ...f,
      temas: f.temas.includes(id) ? f.temas.filter((t) => t !== id) : [...f.temas, id],
    }))

  const tipos: { value: TipoEvaluacion; label: string; icon: string }[] = [
    { value: 'parcial', label: 'Parcial', icon: '📋' },
    { value: 'quiz', label: 'Quiz', icon: '⚡' },
    { value: 'taller', label: 'Taller', icon: '🔧' },
  ]

  const niveles: { value: NivelDificultad; label: string; colorClass: string }[] = [
    { value: 'basico', label: 'Básico', colorClass: 'bg-green-50 border-green-400 text-green-700' },
    { value: 'intermedio', label: 'Intermedio', colorClass: 'bg-amber-50 border-amber-400 text-amber-700' },
    { value: 'avanzado', label: 'Avanzado', colorClass: 'bg-red-50 border-red-400 text-red-700' },
  ]

  return (
    <div className="space-y-5">
      {/* Materia */}
      <div>
        <FieldLabel required>Materia / Curso</FieldLabel>
        <select
          value={form.materia_id}
          onChange={(e) => setForm((f) => ({ ...f, materia_id: e.target.value, semanas: [], temas: [] }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        >
          <option value="">Selecciona una materia...</option>
          {materias.map((m) => (
            <option key={m.id} value={String(m.id)}>{m.codigo} — {m.nombre}</option>
          ))}
        </select>
      </div>

      {/* Semanas */}
      {semanas.length > 0 && (
        <div>
          <FieldLabel required>Semanas a evaluar</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {semanas.map((s) => (
              <CheckChip
                key={s.id}
                label={`Semana ${s.numero_semana}`}
                checked={form.semanas.includes(s.id)}
                onChange={() => toggleSemana(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Temas */}
      {temasList.length > 0 && (
        <div>
          <FieldLabel>Temas específicos</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {temasList.map((t) => (
              <CheckChip
                key={t.id}
                label={t.titulo}
                checked={form.temas.includes(t.id)}
                onChange={() => toggleTema(t.id)}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            Si no seleccionas ninguno, se usarán todos los temas de las semanas elegidas.
          </p>
        </div>
      )}

      <SectionDivider label="Configuración" />

      {/* Tipo */}
      <div>
        <FieldLabel required>Tipo de evaluación</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {tipos.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, tipo: t.value }))}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                form.tipo === t.value
                  ? 'bg-purple-50 border-purple-400 text-purple-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nivel y Cantidad */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Nivel de dificultad</FieldLabel>
          <div className="flex flex-col gap-1.5">
            {niveles.map((n) => (
              <button
                key={n.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, nivel: n.value }))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  form.nivel === n.value ? n.colorClass : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel required>Número de preguntas</FieldLabel>
          <input
            type="number"
            min={1}
            max={100}
            value={form.cantidad_preguntas}
            onChange={(e) => setForm((f) => ({ ...f, cantidad_preguntas: parseInt(e.target.value) || 1 }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-400">Entre 1 y 100 preguntas</p>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Avanzado ─────────────────────────────────────────────────────────────

function TabAvanzado({ form, setForm }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
}) {
  const formatos: { value: FormatoEvaluacion; label: string; desc: string }[] = [
    { value: 'aiken', label: 'Aiken', desc: 'Opción múltiple compatible con Moodle' },
    { value: 'palabra_ausente', label: 'Palabra ausente', desc: 'Completar el espacio en blanco' },
    { value: 'desarrollo', label: 'Desarrollo', desc: 'Respuesta abierta y argumentativa' },
    { value: 'GITF', label: 'GITF', desc: 'Formato de respuesta integrada' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Título del examen</FieldLabel>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          placeholder="Ej: Parcial 1 — Cálculo Diferencial"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-400">Si lo dejas vacío, la IA generará un título automáticamente.</p>
      </div>

      <div>
        <FieldLabel required>Formato de preguntas</FieldLabel>
        <div className="grid grid-cols-1 gap-2">
          {formatos.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, formato: f.value }))}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                form.formato === f.value ? 'bg-purple-50 border-purple-400' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-3.5 h-3.5 mt-0.5 rounded-full border-2 flex-shrink-0 ${
                form.formato === f.value ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'
              }`} />
              <div>
                <p className={`text-sm font-medium ${form.formato === f.value ? 'text-purple-800' : 'text-gray-700'}`}>{f.label}</p>
                <p className={`text-xs mt-0.5 ${form.formato === f.value ? 'text-purple-600' : 'text-gray-500'}`}>{f.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <SectionDivider label="Detalles adicionales" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Porcentaje de la nota (%)</FieldLabel>
          <input
            type="number"
            min={0}
            max={100}
            value={form.porcentaje_nota}
            onChange={(e) => setForm((f) => ({ ...f, porcentaje_nota: e.target.value }))}
            placeholder="Ej: 30"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>
        <div>
          <FieldLabel>Idioma del examen</FieldLabel>
          <select
            value={form.idioma}
            onChange={(e) => setForm((f) => ({ ...f, idioma: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="pt">Portugués</option>
          </select>
        </div>
      </div>

      <div>
        <FieldLabel>Instrucciones adicionales para la IA</FieldLabel>
        <textarea
          value={form.instrucciones_adicionales}
          onChange={(e) => setForm((f) => ({ ...f, instrucciones_adicionales: e.target.value }))}
          placeholder="Ej: Incluye preguntas de análisis de caso, evita preguntas memorísticas, enfócate en aplicaciones prácticas..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        />
      </div>

      <SectionDivider label="Opciones de exportación" />

      <div className="space-y-4">
        <Toggle
          checked={form.incluir_respuestas}
          onChange={() => setForm((f) => ({ ...f, incluir_respuestas: !f.incluir_respuestas }))}
          label="Incluir hoja de respuestas"
          description="Genera un documento separado con las respuestas correctas."
        />
        <Toggle
          checked={form.mezclar_opciones}
          onChange={() => setForm((f) => ({ ...f, mezclar_opciones: !f.mezclar_opciones }))}
          label="Mezclar opciones de respuesta"
          description="Aleatoriza el orden de las opciones en preguntas de selección múltiple."
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExamenesPage() {
  const [tab, setTab] = useState<PageTab>('generar')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    materia_id: '',
    semanas: [],
    temas: [],
    tipo: 'parcial',
    nivel: 'intermedio',
    cantidad_preguntas: 10,
    formato: 'aiken',
    titulo: '',
    porcentaje_nota: '',
    instrucciones_adicionales: '',
    incluir_respuestas: false,
    mezclar_opciones: true,
    idioma: 'es',
  })

  const [materias, setMaterias] = useState<Materia[]>([])
  const [micro, setMicro] = useState<MateriaConSemanas | null>(null)
  const [semanasOptions, setSemanasOptions] = useState<SemanaConTemas[]>([])
  const [temasOptions, setTemasOptions] = useState<Tema[]>([])

  useEffect(() => {
    let mounted = true
    getMaterias().then((m) => { if (mounted) setMaterias(m) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!form.materia_id) {
      setMicro(null); setSemanasOptions([]); setTemasOptions([])
      return
    }
    getMicrocurriculoCompleto({ materiaId: Number(form.materia_id) }).then((res) => {
      const m = res[0] ?? null
      setMicro(m)
      setSemanasOptions(m?.semanas ?? [])
      setForm((f) => ({ ...f, semanas: [], temas: [] }))
      setTemasOptions([])
    })
  }, [form.materia_id])

  useEffect(() => {
    if (!micro) { setTemasOptions([]); return }
    const temas = micro.semanas
      .filter((s) => form.semanas.includes(s.id))
      .flatMap((s) => s.temas ?? [])
    setTemasOptions(temas)
  }, [form.semanas, micro])

  const canGenerate = !!form.materia_id && form.semanas.length > 0

  const handleGenerar = async () => {
    if (!canGenerate) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 2000))
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Generador de Exámenes</h1>
            <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              Beta
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Genera exámenes automáticamente con IA a partir de los microcurrículos cargados.
          </p>
        </div>
      </div>

      {/* Formulario principal */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Pestañas */}
        <div className="flex gap-1 px-6 pt-4 pb-0">
          {([
            { key: 'generar' as PageTab, label: 'Generar', icon: '🤖' },
            { key: 'avanzado' as PageTab, label: 'Opciones avanzadas', icon: '⚙️' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                tab === t.key
                  ? 'border-purple-600 text-purple-700 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-px bg-gray-100 mx-6" />

        {/* Contenido de la pestaña */}
        <div className="px-6 py-5">
          {tab === 'generar' ? (
            <TabGenerar
              form={form}
              setForm={setForm}
              materias={materias}
              semanas={semanasOptions}
              temasList={temasOptions}
            />
          ) : (
            <TabAvanzado form={form} setForm={setForm} />
          )}
        </div>

        {/* Footer con resumen y acción */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500 leading-tight">
            {canGenerate ? (
              <>
                <span className="font-semibold text-gray-700">{form.cantidad_preguntas} preguntas</span>
                {' · '}{form.tipo}{' · '}{form.nivel}
                {` · ${form.semanas.length} semana${form.semanas.length > 1 ? 's' : ''}`}
              </>
            ) : (
              <span className="text-amber-600">Selecciona materia y semanas para continuar</span>
            )}
          </p>
          <button
            onClick={handleGenerar}
            disabled={!canGenerate || loading}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              canGenerate && !loading
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generar examen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}