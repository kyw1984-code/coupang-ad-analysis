import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="훈프로 쿠팡 광고 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 성과 분석")
st.markdown("수강생 여러분 환영합니다! 보고서를 업로드하면 훈프로의 전략 제안이 자동으로 생성됩니다.")

# 2. 파일 업로드
uploaded_file = st.file_uploader("쿠팡 광고 보고서(CSV/XLSX)를 업로드하세요", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        # 데이터 읽기
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 3. 데이터 분석 (컬럼 감지)
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_revenue = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_revenue: 'sum'}
        summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
        summary.columns = ['지면', '노출수', '클릭수', '광고비', '판매수량', '매출액']

        # 주요 지표 계산
        summary['클릭률(CTR)'] = (summary['클릭수'] / summary['노출수']).fillna(0)
        summary['구매전환율(CVR)'] = (summary['판매수량'] / summary['클릭수']).fillna(0)
        summary['CPC'] = (summary['광고비'] / summary['클릭수']).fillna(0).astype(int)
        summary['ROAS'] = (summary['매출액'] / summary['광고비']).fillna(0)

        # 전체 합계 계산
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

        # 4. 결과 표 출력
        st.subheader("📍 지면별 성과 상세 지표")
        st.dataframe(display_df.style.format({
            '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
            '판매수량': '{:,.0f}', '매출액': '{:,.0f}원', 'CPC': '{:,.0f}원',
            '클릭률(CTR)': '{:.2%}', '구매전환율(CVR)': '{:.2%}', 'ROAS': '{:.2%}'
        }), use_container_width=True)

        # 5. 💡 훈프로의 디테일 자동 운영 제안
        st.divider()
        st.subheader("💡 지표 기반 정밀 운영 전략 제안")
        
        search_data = summary[summary['지면'] == '검색 영역'].iloc[0] if '검색 영역' in summary['지면'].values else None
        non_search_data = summary[summary['지면'] == '비검색 영역'].iloc[0] if '비검색 영역' in summary['지면'].values else None
        total_perf = total_row.iloc[0]

        t_col1, t_col2, t_col3 = st.columns(3)

        with t_col1:
            st.info("🖼️ **클릭률(CTR) 분석**")
            avg_ctr = total_perf['클릭률(CTR)']
            if avg_ctr < 0.01:
                st.write(f"- **현재 CTR({avg_ctr:.2%}) 위험**: 노출 대비 클릭이 적습니다. **썸네일**을 고화질로 교체하거나 매력적인 문구를 추가하세요.")
            else:
                st.write(f"- **현재 CTR({avg_ctr:.2%}) 양호**: 상품 이미지의 매력도가 높습니다. 현재 구성을 유지하세요.")

        with t_col2:
            st.warning("🛒 **전환율(CVR) 분석**")
            avg_cvr = total_perf['구매전환율(CVR)']
            if avg_cvr < 0.05:
                st.write