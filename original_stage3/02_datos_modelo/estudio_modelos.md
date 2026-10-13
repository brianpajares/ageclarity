# AgeClarity · Estudio de modelos

**Versión:** 2.0.0 · **Fecha:** 13 octubre 2026  
**Objetivo de producto:** estimar Clinical PhenoAge de forma reproducible, auditable y local a partir de edad + analítica rutinaria.

## Criterios de selección
La cifra principal debe salir de un cálculo reproducible. Se prioriza evidencia publicada, estabilidad de inputs, licencia/uso comercial, coste marginal, latencia, explicabilidad y ausencia de dependencia externa.

| Candidato | Tipo | Precisión/evidencia reportada | Licencia / uso | Coste por consulta | Latencia | Explicabilidad | Dependencia externa | Veredicto |
|---|---|---|---|---:|---|---|---|---|
| Clinical PhenoAge (Levine/Liu) | Fórmula publicada | Validado en NHANES IV; HR all-cause 1.09 por año de Phenotypic Age en muestra completa | Artículo PLOS CC0; ecuación factual | ~0 | sub-ms local | Muy alta | Ninguna | **PRINCIPAL** |
| BioAge R `phenoage0` | Implementación open source de fórmula | Replica PhenoAge original; paquete científico 2021; código actual usa 0.090165 | GPL-3.0; se usa solo como oracle de verificación, no se copia código | ~0 | ms local | Muy alta | Ninguna si no se embebe | **RESPALDO / ORACLE** |
| KDM Biological Age (BioAge) | Modelo estadístico entrenable | Método publicado y reimplementado sobre NHANES | Implementación GPL-3.0; método publicado | ~0 | ms | Alta | Requiere fit/biomarcadores adicionales | Descartado para MVP |
| Homeostatic Dysregulation (BioAge) | Distancia multivariante | Toolkit BioAge; útil para desregulación, no entrega edad equivalente de forma natural | GPL-3.0 | ~0 | ms | Media | Requiere cohorte de referencia | Descartado |
| ComputBioAge KDM | Open source preentrenable | Implementación KDM con selección propia de features; evidencia del repo menor que PhenoAge publicado | MIT | ~0 | ms | Alta | Modelo/feature set externo | Alternativa técnica, no científica principal |
| Aging.AI | API/modelo cerrado histórico | DNN: MAE 5.55 años para predecir edad cronológica, r≈0.91; no es Clinical PhenoAge | Paper CC BY; pesos no publicados; servicio histórico no confiable como dependencia | Desconocido | Red | Baja | Alta / servicio discontinuado | Rechazado |

## Fuentes clave
1. Liu Z et al. *A new aging measure captures morbidity and mortality risk across diverse subpopulations from NHANES IV*. PLOS Medicine (2018).  
   https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718
2. Corrección PLOS (2019), que añadió un paso faltante y publicó la variante `0.09165`.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC6388911/
3. BioAge R, implementación actual `phenoage_calc.R` con coeficientes de alta precisión y `0.090165`.  
   https://github.com/dayoonkwon/BioAge/blob/master/R/phenoage_calc.R
4. Actividad BioAge abril 2026: restauración/actualización de la constante a `0.090165`.  
   https://github.com/dayoonkwon/BioAge/activity
5. ComputBioAge (MIT).  
   https://github.com/ComputationalAgingLab/ComputBioAge
6. Putin et al. Aging.AI / DNN sanguínea.  
   https://www.aging-us.com/article/100968/text

## Decisión
### Modelo principal
**Clinical PhenoAge con coeficientes de alta precisión y denominador final 0.090165.**

Razones:
- es exactamente la variable prometida por la estrategia;
- usa 9 biomarcadores rutinarios + edad;
- no necesita entrenamiento en producción;
- coste/latencia son despreciables;
- cada paso puede auditarse;
- el paquete BioAge actual funciona como implementación independiente de verificación.

### Modelo de respaldo
**Misma ecuación con denominador 0.09165 como escenario de sensibilidad de versión**, no como cifra secundaria para confundir al usuario. Se conserva porque esa constante aparece en la corrección publicada de 2019. La app debe enseñar la existencia de la discrepancia en “Cómo funciona” y el informe completo.

## Resolución del conflicto 0.090165 vs 0.09165
La literatura contiene ambas constantes. La corrección PLOS de 2019 usa 0.09165. Sin embargo, en abril de 2026 el mantenedor de BioAge restauró y volvió a publicar la implementación original con 0.090165; el código actual de `phenoage0` la usa. Para maximizar paridad reproducible con el oracle científico vigente del brief, AgeClarity fija **0.090165** como canónica y guarda **0.09165** como escenario auditable.

Esta decisión no afirma que una constante “sea clínicamente verdadera” y la otra no; reconoce un conflicto documental y bloquea una versión concreta para evitar resultados silenciosamente cambiantes.

## Drivers y sensibilidad
No se atribuyen “años causados” a un marcador. Tampoco se fija una referencia “saludable” inventada por país. En v1 el informe usa **sensibilidad local one-at-a-time**: recalcula el resultado aumentando cada biomarcador 1%, manteniendo los demás constantes. Es un gradiente interpretable del modelo, no causal y no un intervalo clínico.

## Datos y entrenamiento
No se requiere `train.py`: la cifra principal usa parámetros publicados fijos. El dataset NHANES no forma parte del runtime. `ingest/ingest.py` queda como herramienta de validación/reproducción para descargar archivos públicos de NHANES y refrescar PPP del World Bank; su ejecución se deja al build con internet.

## Riesgos científicos abiertos
- validez externa fuera de EE.UU. no demostrada específicamente para los seis países objetivo;
- el age gap no es un “pace of aging”;
- no hay CI individual publicado que pueda trasladarse honestamente a cada usuario;
- CRP censurada (`<x`) no debe sustituirse por `x` sin una regla de laboratorio validada;
- percentiles regionales quedan fuera hasta disponer de cohortes licenciadas y validadas.
