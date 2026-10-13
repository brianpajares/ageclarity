#!/usr/bin/env python3
"""
AgeClarity optional data ingestion / validation helper.

Runtime calculation DOES NOT need external data.
This script is for build-time validation and periodic refresh of:
1) World Bank PPP reference data.
2) NHANES 2021-2023 public-use files needed to reproduce PhenoAge on a modern U.S. cohort.

Respect the NCHS Data User Agreement:
https://www.cdc.gov/nchs/policy/data-user-agreement.html
"""
from __future__ import annotations
import io, json, os, sys, hashlib
from pathlib import Path
import requests
import pandas as pd

OUT = Path(__file__).resolve().parent / "data"
OUT.mkdir(parents=True, exist_ok=True)

WB_URL = "https://api.worldbank.org/v2/country/{country}/indicator/PA.NUS.PPP?format=json&per_page=100"
COUNTRIES = ["ESP","MEX","BRA","COL","PER","ARG"]

NHANES = {
    "DEMO_L": "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/DEMO_L.xpt",
    "BIOPRO_L": "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/BIOPRO_L.xpt",
    "CBC_L": "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/CBC_L.xpt",
    "HSCRP_L": "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/HSCRP_L.xpt",
}

def get(url: str) -> bytes:
    r = requests.get(url, timeout=90)
    r.raise_for_status()
    return r.content

def refresh_ppp():
    rows = []
    for c in COUNTRIES:
        payload = requests.get(WB_URL.format(country=c), timeout=30).json()
        data = payload[1]
        latest = next(x for x in data if x.get("value") is not None)
        rows.append({
            "country_iso3": c,
            "year": int(latest["date"]),
            "ppp_lcu_per_intl_usd": float(latest["value"]),
            "source_url": WB_URL.format(country=c),
        })
    df = pd.DataFrame(rows)
    df.to_csv(OUT/"world_bank_ppp_latest.csv", index=False)
    return df

def download_nhanes():
    paths = {}
    for name, url in NHANES.items():
        raw = get(url)
        path = OUT/f"{name}.xpt"
        path.write_bytes(raw)
        paths[name] = path
        print(name, len(raw), hashlib.sha256(raw).hexdigest())
    return paths

def build_validation_sample(paths):
    demo = pd.read_sas(paths["DEMO_L"], format="xport")
    bio = pd.read_sas(paths["BIOPRO_L"], format="xport")
    cbc = pd.read_sas(paths["CBC_L"], format="xport")
    crp = pd.read_sas(paths["HSCRP_L"], format="xport")

    # Column names follow NHANES documentation. Fail loudly if schema changes.
    cols_demo = ["SEQN","RIDAGEYR"]
    cols_bio = ["SEQN","LBDSALSI","LBDSCRSI","LBDSGLSI","LBXSAPSI"]
    # CBC variable names are validated at execution time; inspect if CDC changes labels.
    candidate_cbc = {
        "wbc": ["LBXWBCSI","LBXWBC"],
        "lymph": ["LBXLYPCT","LBXLYPCTSI"],
        "mcv": ["LBXMCVSI","LBXMCV"],
        "rdw": ["LBXRDW","LBXRDWCV"],
    }
    chosen = {}
    for logical, options in candidate_cbc.items():
        found = [x for x in options if x in cbc.columns]
        if not found:
            raise KeyError(f"Missing CBC variable for {logical}; inspect CBC_L columns")
        chosen[logical] = found[0]

    cols_crp = ["SEQN","LBXHSCRP"]
    d = demo[cols_demo].merge(bio[cols_bio], on="SEQN", how="inner")
    d = d.merge(cbc[["SEQN"]+list(chosen.values())], on="SEQN", how="inner")
    d = d.merge(crp[cols_crp], on="SEQN", how="inner")

    d = d.rename(columns={
        "RIDAGEYR":"age_years",
        "LBDSALSI":"albumin_gL",
        "LBDSCRSI":"creatinine_umolL",
        "LBDSGLSI":"glucose_mmolL",
        "LBXSAPSI":"alp_UL",
        chosen["wbc"]:"wbc_10e3uL",
        chosen["lymph"]:"lymphocyte_pct",
        chosen["mcv"]:"mcv_fL",
        chosen["rdw"]:"rdw_pct",
        "LBXHSCRP":"crp_mg_L",
    })
    d["crp_mg_dL"] = d["crp_mg_L"] * 0.1
    d = d.query("20 <= age_years <= 84")
    required = ["age_years","albumin_gL","creatinine_umolL","glucose_mmolL",
                "alp_UL","wbc_10e3uL","lymphocyte_pct","mcv_fL","rdw_pct","crp_mg_dL"]
    d = d.dropna(subset=required)
    d = d[d["crp_mg_dL"] > 0]
    d[required].to_csv(OUT/"nhanes_2021_2023_phenoage_validation.csv", index=False)
    return d[required]

def main():
    print(refresh_ppp().to_string(index=False))
    paths = download_nhanes()
    sample = build_validation_sample(paths)
    print("NHANES complete cases:", len(sample))

if __name__ == "__main__":
    main()
