import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="훈프로 쿠팡 광고 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 성과 분석")
st.markdown("쿠팡 보고서를 업로드하면 훈프로의 정밀 운영 전략이 자동으로 생성됩니다.")

# 2. 파일 업로드
uploaded_file = st.file_uploader("보고서 파일을 선택하세요 (CSV 또는 XLSX)", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 3. 데이터 분석 로직 (중략 - 기존과 동일)
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_rev = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_rev: 'sum'}
        summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
        summary.columns = ['지면', '노출수', '클릭수', '광고비', '판매수량', '매출액']

        # ... (계산 로직 중략) ...
        summary['클릭률(CTR)'] = (summary['클릭수'] / summary['노출수']).fillna(0)
        summary['구매전환율(CVR)'] = (summary['판매수량'] / summary['클릭수']).fillna(0)
        summary['CPC'] = (summary['광고비'] / summary['클릭수']).fillna(0).astype(int)
        summary['ROAS'] = (summary['매출액'] / summary['광고비']).fillna(0)

        total = summary.sum(numeric_only=True)
        total_row = pd.DataFrame([{
            '지면': '🏢 전체 합계',
            '노출수': total['노출수'], '클릭수': total['클릭수'], '광고비': total['광고비'],
            '판매수량': total['판매수량'], '매출액': total['매출액'],
            '클릭률(CTR)': total['클릭수'] / total['노출수'] if total['노출수'] > 0 else 0,
            '구매전환율(CVR)': total['판매수량'] / total['클릭수'] if total['클릭수'] > 0 else 0,
            'CPC': int(total['광고비'] / total['클릭수']) if total['클릭수'] > 0 else 0,
            'ROAS': total['매출액'] / total['광고비'] if total['광고비'] > 0 else 0
        }])
        
        display_df = pd.concat([summary, total_row], ignore_index=True)

        st.subheader("📍 성과 상세 지표")
        st.dataframe(display_df.style.format({
            '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
            '판매수량': '{:,.0f}', '매출액': '{:,.0f}원', 'CPC': '{:,.0f}원',
            '클릭률(CTR)': '{:.2%}', '구매전환율(CVR)': '{:.2%}', 'ROAS': '{:.2%}'
        }), use_container_width=True)

        # --- 이 부분의 들여쓰기를 확인하세요 (st.dataframe과 수직 선상에 있어야 함) ---
        st.divider()
        st.subheader("✂️ 광고비 도둑 키워드 (제외 대상 제안)")
        
        if '키워드' in df.columns:
            kw_analysis = df.groupby('키워드').agg({'광고비': 'sum', col_qty: 'sum'}).reset_index()
            bad_kws = kw_analysis[(kw_analysis['광고비'] > 0) & (kw_analysis[col_qty] == 0)].sort_values(by='광고