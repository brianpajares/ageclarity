# Informe QA · AgeClarity v3.0.0 · 13-10-2026

**Veredicto: PASS_WITH_FIXES** para pasar a diseño de PRD; **no** autorización de uso clínico o despliegue comercial con datos reales.

## Entrada
- `handoff.stage_completed = 2` comprobado; 40 entradas antes del empaquetado final; archivos de contrato presentes.
- Base XLSX: 10 hojas; hoja Parametros con 17 parámetros numéricos y encabezados esperados; filas preformateadas vacías no se consideran falta de datos.

## Doble verificación
- 28/28 vectores pasan comparando implementación matemática independiente, valores esperados y motor de referencia (tolerancia relativa 1e-6, absoluta 1e-8).
- 18 vectores originales y 10 adversariales (NaN, infinito, CRP cero, rangos edad, unidades, límites de linfocitos y extremos).
- Pruebas sintéticas; no constituyen validación clínica independiente ni calibración prospectiva multicéntrica.

## Hallazgos
- **MAYOR corregido**: fórmula original evaluaba `1-exp(...)` y después `log(1-M)`; en datos extremos sufre cancelación/saturación. Cálculo equivalente en espacio logarítmico implementado en ambas copias del motor, documentado y probado.
- **MAYOR abierto, fuera de alcance QA documental**: sin validación clínica/calibración para países objetivo ni aprobación jurídica local; impedir interpretación clínica o pronósticos individuales. Comparaciones país/percentil y velocidad de envejecimiento fuera del MVP.
- **MAYOR preliminar**: comprobación web directa de constante BioAge `0.090165` y precios PPP por país incompleta; debe contrastarse el archivo R bruto versionado y descargas WDI antes de anuncios comerciales. Fórmula y vectores conservan constante explícita del paquete de entrada.
- **MENOR corregido**: ampliar pruebas de bordes y registrar trazabilidad en Excel y especificación.

## Fuentes/licencias
- S201: **verificado** — Comprobada existencia y descripción principal de la fuente, no significa validación clínica del producto. https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718
- S202: **verificado** — Comprobada existencia y descripción principal de la fuente, no significa validación clínica del producto. https://pmc.ncbi.nlm.nih.gov/articles/PMC6388911/
- S203: **no_verificado** — Repositorio accesible, pero 0.090165 no recuperado como texto verificable en navegación; comprobación numérica de constante marcada preliminar. https://github.com/dayoonkwon/BioAge/blob/master/R/phenoage_calc.R
- S204: **no_verificado** — Enlace/dato específico o licencia exacta no confirmados independientemente en esta sesión; requiere comprobación antes de publicación. https://github.com/dayoonkwon/BioAge/activity
- S205: **verificado** — Comprobada existencia y descripción principal de la fuente, no significa validación clínica del producto. https://github.com/dayoonkwon/BioAge/blob/master/DESCRIPTION
- S206: **verificado** — Comprobada existencia y descripción principal de la fuente, no significa validación clínica del producto. https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2011/DataFiles/BIOPRO_G.htm
- S207: **no_verificado** — Enlace/dato específico o licencia exacta no confirmados independientemente en esta sesión; requiere comprobación antes de publicación. https://github.com/dayoonkwon/BioAge/discussions/35
- S208: **no_verificado** — Enlace/dato específico o licencia exacta no confirmados independientemente en esta sesión; requiere comprobación antes de publicación. https://pmc.ncbi.nlm.nih.gov/articles/PMC6312200/
- S209: **verificado** — Comprobada existencia y descripción principal de la fuente, no significa validación clínica del producto. https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/HSCRP_L.htm
- S210: **verificado** — Comprobada existencia y descripción principal de la fuente, no significa validación clínica del producto. https://data.worldbank.org/indicator/PA.NUS.PPP
- S211: **no_verificado** — PPP 2025 y seis cifras nacionales no contrastadas directamente contra descarga versionada del Banco Mundial; precios quedan hipotéticos. https://wdi.worldbank.org/table/4.16
- S212: **no_verificado** — Enlace/dato específico o licencia exacta no confirmados independientemente en esta sesión; requiere comprobación antes de publicación. https://github.com/ComputationalAgingLab/ComputBioAge
- S213: **no_verificado** — Enlace/dato específico o licencia exacta no confirmados independientemente en esta sesión; requiere comprobación antes de publicación. https://www.aging-us.com/article/100968/text
- S214: **no_verificado** — Enlace/dato específico o licencia exacta no confirmados independientemente en esta sesión; requiere comprobación antes de publicación. https://www.cdc.gov/nchs/policy/data-user-agreement.html

BioAge declara GPL-3 para su código. La reimplementación Python está escrita independientemente desde ecuaciones de referencia; no copiar ni incorporar el repositorio GPL en el producto propietario sin revisión legal. Los documentos PLOS y los archivos CDC pueden tener términos distintos: validar licencia individual antes de distribuir contenido. No almacenar muestras clínicas reales en analytics; exigir aviso de privacidad, consentimiento válido si aplica, retención, borrado y control de acceso.

## Checklist de salida
Prohibidas frases «detecta enfermedades», «cuánto vivirás», «ritmo de envejecimiento» o «recuperarás X años». Edad fenotípica no es edad biológica definitiva. Sensibilidades locales son perturbaciones matemáticas y **no** contribuciones causales ni recomendaciones terapéuticas. Pago deshabilitado hasta evidencias, revisión regulatoria y cumplimiento privacidad por país.
