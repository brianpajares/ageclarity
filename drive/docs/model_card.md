# AgeClarity · Cómo funciona el modelo

**Versión del modelo:** 2.0.0 · **Fecha:** 13 octubre 2026  
**Uso previsto:** información y wellness. No es diagnóstico, tratamiento ni una predicción individual de esperanza de vida.

## Qué calcula
AgeClarity calcula **Clinical Phenotypic Age (PhenoAge)**, una medida publicada que combina tu edad cronológica con nueve biomarcadores rutinarios: albúmina, creatinina, glucosa, proteína C reactiva (PCR/CRP), porcentaje de linfocitos, VCM/MCV, RDW/ADE, fosfatasa alcalina y leucocitos.

El resultado se expresa en años. También mostramos la **brecha** entre PhenoAge y edad cronológica. Una brecha positiva o negativa es una salida matemática del modelo; no equivale a un “ritmo de envejecimiento” ni demuestra causa.

## De dónde salen los datos y la fórmula
La metodología fue desarrollada y validada con NHANES en Estados Unidos. La validación publicada en PLOS Medicine evaluó adultos de 20–84 años y encontró que Phenotypic Age estaba asociado con mortalidad y morbilidad a nivel poblacional. Fuente principal:  
https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718

La implementación numérica de AgeClarity usa los coeficientes de alta precisión que mantiene el paquete científico BioAge y su versión actual de 2026:  
https://github.com/dayoonkwon/BioAge/blob/master/R/phenoage_calc.R

## Un detalle importante sobre la constante final
Existe una discrepancia histórica: una corrección publicada mostró `0.09165`, mientras que el repositorio BioAge restauró en abril de 2026 `0.090165` y lo usa actualmente para `phenoage0`. AgeClarity usa **0.090165** para la cifra principal y conserva **0.09165** como escenario de sensibilidad visible en el informe completo. Así el cálculo es auditable y la diferencia no queda escondida.

## Unidades
Antes de calcular, AgeClarity normaliza unidades. NHANES documenta, entre otras, estas conversiones:
- albúmina g/dL → g/L: ×10;
- creatinina mg/dL → µmol/L: ×88.4;
- glucosa mg/dL → mmol/L: ×0.05551;
- CRP mg/L → mg/dL: ÷10;
- WBC 10^9/L y 10^3/µL son numéricamente equivalentes.

Fuente de conversiones bioquímicas:  
https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2011/DataFiles/BIOPRO_G.htm

## Qué tan confiable es
El cálculo es **determinista**: con los mismos inputs y unidades normalizadas produce exactamente el mismo resultado. La suite de AgeClarity incluye pruebas de bordes y equivalencia de unidades, y la hoja `Motor` del Excel replica el mismo cálculo.

Eso no convierte a PhenoAge en una medición directa de “edad biológica verdadera”. Es un modelo poblacional derivado de asociaciones con riesgo de mortalidad y estado fisiológico. No existe un intervalo de confianza individual publicado que podamos aplicar honestamente a una persona.

## Límites
- Rango operativo de edad: **20–84 años**.
- La evidencia de origen proviene sobre todo de población de EE.UU.; no asumimos calibración específica para México, España, Brasil, Colombia, Perú o Argentina.
- Se necesitan los nueve biomarcadores: **no imputamos faltantes**.
- CRP debe ser mayor que cero porque entra como logaritmo natural. Si el laboratorio informa un resultado censurado como `<0.3`, AgeClarity no inventa un valor.
- Cambiar un biomarcador y observar el cambio del modelo sirve como **sensibilidad matemática**, no prueba que ese marcador cause años de envejecimiento.
- No deben usarse los resultados para cambiar medicación, dieta, suplementos o tratamiento sin un profesional de salud.

## Privacidad
El motor puede calcular sin enviar los valores clínicos a un LLM. En validación, cualquier envío por email debe tener consentimiento explícito, minimización de datos y una base legal adecuada. Los valores de laboratorio no deben enviarse a analytics de producto.

## Para conversar con un profesional
Usa el informe para verificar unidades, entender qué valores movieron matemáticamente el resultado, comparar analíticas realizadas en condiciones similares y preparar preguntas. No lo uses como sustituto de evaluación clínica.
