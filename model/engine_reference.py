#!/usr/bin/env python3
from __future__ import annotations
import json, math, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict

NS = {"m":"http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r":"http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "pr":"http://schemas.openxmlformats.org/package/2006/relationships"}

def _col_num(cell_ref: str) -> int:
    s="".join(c for c in cell_ref if c.isalpha())
    n=0
    for c in s:
        n=n*26+(ord(c.upper())-64)
    return n

def _read_sheet_rows_xlsx(path: str | Path, sheet_name: str):
    """Minimal read-only XLSX parser. Reads cached values only; enough for Parametros."""
    path = str(path)
    with zipfile.ZipFile(path) as z:
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        relmap={r.attrib["Id"]:r.attrib["Target"] for r in rels}
        target=None
        for s in wb.find("m:sheets", NS):
            if s.attrib.get("name")==sheet_name:
                target=relmap[s.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
                break
        if not target:
            raise KeyError(f"Sheet {sheet_name!r} not found")
        target=target.lstrip("/")
        if target.startswith("xl/"):
            pass
        else:
            target="xl/"+target
        shared=[]
        if "xl/sharedStrings.xml" in z.namelist():
            ss=ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in ss.findall("m:si",NS):
                shared.append("".join(t.text or "" for t in si.iterfind(".//m:t",NS)))
        root=ET.fromstring(z.read(target))
        out=[]
        for row in root.findall(".//m:sheetData/m:row",NS):
            vals={}
            for c in row.findall("m:c",NS):
                ref=c.attrib["r"]; typ=c.attrib.get("t"); v=c.find("m:v",NS)
                value=None if v is None else v.text
                if value is None and typ=="inlineStr":
                    value="".join(t.text or "" for t in c.findall(".//m:is/m:t", NS))
                if value is not None and typ=="s":
                    value=shared[int(value)]
                elif value is not None and typ=="b":
                    value=(value=="1")
                elif value is not None:
                    try: value=float(value)
                    except ValueError: pass
                vals[_col_num(ref)]=value
            out.append(vals)
        return out

def load_base(base: str | Path | Dict[str,float]) -> Dict[str,float]:
    if isinstance(base, dict):
        return dict(base)
    rows=_read_sheet_rows_xlsx(base,"Parametros")
    params={}
    for r in rows[1:]:
        name=r.get(1); val=r.get(2)
        if name and isinstance(val,(int,float)):
            params[str(name)]=float(val)
    required={"intercept","beta_albumin","beta_creatinine","beta_glucose","beta_ln_crp",
              "beta_lymphocyte","beta_mcv","beta_rdw","beta_alp","beta_wbc","beta_age",
              "gompertz_num","gompertz_den","age_transform_scale","age_transform_den",
              "age_transform_intercept","historical_alt_den"}
    missing=required-set(params)
    if missing:
        raise ValueError(f"Missing parameters in base: {sorted(missing)}")
    return params

def _positive(name, x):
    x=float(x)
    if not math.isfinite(x) or x<=0:
        raise ValueError(f"{name} must be finite and > 0")
    return x

def _value_unit(obj, name):
    if not isinstance(obj,dict) or "value" not in obj or "unit" not in obj:
        raise ValueError(f"{name} requires value and unit")
    return _positive(name,obj["value"]), str(obj["unit"])

def normalize_inputs(inputs: Dict[str,Any]) -> Dict[str,float]:
    try:
        age=float(inputs["age"])
        chem=inputs["chemistry"]; infl=inputs["inflammation"]; cbc=inputs["cbc"]
    except KeyError as e:
        raise ValueError(f"missing required input: {e.args[0]}")
    if not (20 <= age <= 84) or not math.isfinite(age):
        raise ValueError("age must be between 20 and 84 years")

    albumin,u=_value_unit(chem["albumin"],"albumin")
    if u=="g/dL": albumin*=10
    elif u!="g/L": raise ValueError("albumin unit must be g/L or g/dL")

    creat,u=_value_unit(chem["creatinine"],"creatinine")
    if u=="mg/dL": creat*=88.4
    elif u!="umol/L": raise ValueError("creatinine unit must be umol/L or mg/dL")

    glucose,u=_value_unit(chem["glucose"],"glucose")
    if u=="mg/dL": glucose*=0.05551
    elif u!="mmol/L": raise ValueError("glucose unit must be mmol/L or mg/dL")

    alp,u=_value_unit(chem["alp"],"alp")
    if u!="U/L": raise ValueError("alp unit must be U/L")

    crp,u=_value_unit(infl["crp"],"crp")
    if u=="mg/L": crp*=0.1
    elif u!="mg/dL": raise ValueError("crp unit must be mg/dL or mg/L")

    lymph=float(cbc["lymphocyte_pct"])
    if not math.isfinite(lymph) or not (0 <= lymph <= 100):
        raise ValueError("lymphocyte_pct must be between 0 and 100")

    mcv,u=_value_unit(cbc["mcv"],"mcv")
    if u!="fL": raise ValueError("mcv unit must be fL")
    rdw,u=_value_unit(cbc["rdw"],"rdw")
    if u!="%": raise ValueError("rdw unit must be %")
    wbc,u=_value_unit(cbc["wbc"],"wbc")
    if u not in ("10^3/uL","10^9/L"):
        raise ValueError("wbc unit must be 10^3/uL or 10^9/L")

    return {
        "age_years":age,"albumin_gL":albumin,"creatinine_umolL":creat,
        "glucose_mmolL":glucose,"crp_mg_dL":crp,"lymphocyte_pct":lymph,
        "mcv_fL":mcv,"rdw_pct":rdw,"alp_UL":alp,"wbc_10e3uL":wbc
    }

def _core(x: Dict[str,float], p: Dict[str,float], denominator: float | None=None):
    xb=(p["intercept"] + p["beta_albumin"]*x["albumin_gL"]
        + p["beta_creatinine"]*x["creatinine_umolL"]
        + p["beta_glucose"]*x["glucose_mmolL"]
        + p["beta_ln_crp"]*math.log(x["crp_mg_dL"])
        + p["beta_lymphocyte"]*x["lymphocyte_pct"]
        + p["beta_mcv"]*x["mcv_fL"]
        + p["beta_rdw"]*x["rdw_pct"]
        + p["beta_alp"]*x["alp_UL"]
        + p["beta_wbc"]*x["wbc_10e3uL"]
        + p["beta_age"]*x["age_years"])
    # Stable algebraic form of ln(-scale * ln(1 - M)); avoids cancellation at M≈0 or 1.
    log_term=math.log(p["age_transform_scale"]*p["gompertz_num"]/p["gompertz_den"])+xb
    log_hazard=math.log(-p["gompertz_num"]/p["gompertz_den"])+xb
    m=-math.expm1(-math.exp(log_hazard)) if log_hazard < 700 else 1.0
    den=p["age_transform_den"] if denominator is None else denominator
    pheno=log_term/den+p["age_transform_intercept"]
    return xb,m,pheno

def calculate(inputs: Dict[str,Any], base: str | Path | Dict[str,float]) -> Dict[str,Any]:
    p=load_base(base)
    x=normalize_inputs(inputs)
    xb,m,pheno=_core(x,p)
    _,_,alt=_core(x,p,p["historical_alt_den"])
    sens={}
    for key in ("albumin_gL","creatinine_umolL","glucose_mmolL","crp_mg_dL",
                "lymphocyte_pct","mcv_fL","rdw_pct","alp_UL","wbc_10e3uL"):
        x2=dict(x)
        if key=="lymphocyte_pct" and x2[key]==0:
            x2[key]=0.01
        else:
            x2[key]*=1.01
        _,_,p2=_core(x2,p)
        sens[key]=p2-pheno
    return {
        "model_version":"clinical_phenoage_levine_bioage_2026@2.0.0",
        "normalized_inputs":x,
        "phenoage_years":pheno,
        "age_gap_years":pheno-x["age_years"],
        "internal_mortality_component_120m":m,
        "xb":xb,
        "alternate_0_09165_years":alt,
        "alternate_delta_years":alt-pheno,
        "local_sensitivity_plus_1pct_years":sens,
        "disclaimer":"Educational/wellness model output; not diagnosis, treatment, pace of aging, or individual life-expectancy prediction."
    }

if __name__=="__main__":
    import argparse
    ap=argparse.ArgumentParser()
    ap.add_argument("inputs_json")
    ap.add_argument("base_xlsx")
    args=ap.parse_args()
    data=json.loads(Path(args.inputs_json).read_text(encoding="utf-8"))
    print(json.dumps(calculate(data,args.base_xlsx),indent=2,ensure_ascii=False))
