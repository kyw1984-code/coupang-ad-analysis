import streamlit as st
import pandas as pd

st.set_page_config(page_title="훈프로 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 분석")

uploaded_file = st.file_uploader("보고서 업로드 (CSV/XLSX)", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        # 파일 읽기
        df = pd.read_csv(uploaded_file) if uploaded_file.name.endswith('.csv') \
             else pd.read_excel(uploaded_file, engine='openpyxl')

        # 컬럼명 자동 설정
        c_q = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        c_r = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        # 1. 지면별 요약
        tmp = df.groupby('광고 노출 지면').agg({
            '노출수':'sum','클릭수':'sum','광고비':'sum',c_q:'sum',c_r:'sum'
        }).reset_index()
        tmp.columns = ['지면','노출수','클릭수','광고비','판매수량','매출액']

        # 2. 합계 계산
        tot = tmp.sum(numeric_only=True)
        row = pd.DataFrame([{
            '지면': '🏢 전체 합계',
            '노출수': tot['노출수'], '클릭수': tot['클릭수'], 
            '광고비': tot['광고비'], '판매수량': tot['판매수량'], '매출액': tot['매출액']
        }])
        res = pd.concat([tmp, row], ignore_index=True)

        # 3. 지표 계산
        res['CTR'] = (res['클릭수'] / res['노출수']).fillna(0)
        res['CVR'] = (res['판매수량'] / res['클릭수']).fillna(0)
        res['ROAS'] = (res['매출액'] / res['광고비']).fillna(0)

        st.subheader("📍 성과 상세 지표")
        st.dataframe(res.style.format({
            '광고비':'{:,.0f}원','매출액':'{:,.0f}원',
            'CTR':'{:.2%}','CVR':'{:.2%}','ROAS':'{:.2%}'
        }), use_container_width=True)

        # 4. 광고비