"""Independent AgeClarity PhenoAge QA math: built from model_spec + Excel Parametros.
No source code from reference engine is imported.
"""
import math

FIELDS = {"albumin_gL":"beta_albumin","creatinine_umolL":"beta_creatinine","glucose_mmolL":"beta_glucose","lymphocyte_pct":"beta_lymphocyte","mcv_fL":"beta_mcv","rdw_pct":"beta_rdw","alp_UL":"beta_alp","wbc_10e3uL":"beta_wbc","age_years":"beta_age"}
def _val(obj, valid):
    v=float(obj["value"]);u=obj["unit"]
    if not math.isfinite(v) or v<=0 or u not in valid:raise ValueError("invalid value/unit")
    return v,u
def normalize(d):
    a=float(d["age"]);
    if not math.isfinite(a) or not 20<=a<=84:raise ValueError("age")
    chem=d["chemistry"]; cbc=d["cbc"];infl=d["inflammation"]
    al,u=_val(chem["albumin"],("g/L","g/dL"));al*=10 if u=="g/dL" else 1
    cr,u=_val(chem["creatinine"],("umol/L","mg/dL"));cr*=88.4 if u=="mg/dL" else 1
    gl,u=_val(chem["glucose"],("mmol/L","mg/dL"));gl*=0.05551 if u=="mg/dL" else 1
    ap,u=_val(chem["alp"],("U/L",))
    cp,u=_val(infl["crp"],("mg/dL","mg/L"));cp*=0.1 if u=="mg/L" else 1
    mc,u=_val(cbc["mcv"],("fL",));rd,u=_val(cbc["rdw"],("%",));wc,u=_val(cbc["wbc"],("10^3/uL","10^9/L"))
    ly=float(cbc["lymphocyte_pct"]);
    if not math.isfinite(ly) or not 0<=ly<=100:raise ValueError("lymphocyte_pct")
    return dict(age_years=a,albumin_gL=al,creatinine_umolL=cr,glucose_mmolL=gl,alp_UL=ap,crp_mg_dL=cp,lymphocyte_pct=ly,mcv_fL=mc,rdw_pct=rd,wbc_10e3uL=wc)
def calc(d,p):
    x=normalize(d)
    xb=p["intercept"]+sum(p[v]*x[k] for k,v in FIELDS.items())+p["beta_ln_crp"]*math.log(x["crp_mg_dL"])
    # Algebraically exact log-space evaluation: avoids subtracting nearly equal floating-point numbers.
    log_term=math.log(p["age_transform_scale"]*p["gompertz_num"]/p["gompertz_den"])+xb
    pheno=log_term/p["age_transform_den"]+p["age_transform_intercept"]
    alt=log_term/p["historical_alt_den"]+p["age_transform_intercept"]
    loghaz=math.log(-p["gompertz_num"]/p["gompertz_den"])+xb
    m=-math.expm1(-math.exp(loghaz)) if loghaz<700 else 1.0
    return {"phenoage_years":pheno,"age_gap_years":pheno-x["age_years"],"alternate_0_09165_years":alt,"alternate_delta_years":alt-pheno,"xb":xb,"internal_mortality_component_120m":m,"normalized_inputs":x}
