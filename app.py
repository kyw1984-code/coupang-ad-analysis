import os
import subprocess
import sys

# [강제 해결책] 서버 시작 시 openpyxl이 없으면 강제로 설치함
try:
    import openpyxl
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    import openpyxl

import streamlit as st
import pandas as pd

# 여기서부터는 기존 분석 코드입니다.
st.set_page_config(page_title="쿠팡 광고 분석기", layout="wide")
st.title("📊 쿠팡 광고 성과 분석기")

uploaded_file = st.file_uploader("쿠팡 보고서(Excel/CSV)를 올려주세요.", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            # engine='openpyxl'을 명시하여 강제로 부품을 사용하게 합니다.
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 분석 로직
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_rev = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        summary = df.groupby('광고 노출 지면').agg({
            '노출수':'sum', '클릭수':'sum', '광고비':'sum', col_qty:'sum', col_rev:'sum'
        }).reset_index()
        
        summary.columns = ['지면', '노출', '클릭', '광고비', '판매수량', '매출액']
        summary['ROAS'] = (summary['매출액'] / summary['광고비']).fillna(0)

        st.dataframe(summary.style.format({'노출':'{:,}', '클릭':'{:,}', '광고비':'{:,}원', '매출액':'{:,}원', 'ROAS':'{:.2%}'}))
        st.success("✅ 분석 완료!")

    except Exception as e:
        st.error(f"오류 발생: {e}")