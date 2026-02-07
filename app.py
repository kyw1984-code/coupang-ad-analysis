import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="쿠팡 광고 분석기", layout="wide")
st.title("📊 쿠팡 광고 성과 분석 및 전략 제안")

# 2. 파일 업로드
uploaded_file = st.file_uploader("쿠팡 광고 보고서(CSV/XLSX)를 업로드하세요", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        # 데이터 읽기
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 3. 데이터 분석
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_revenue = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_revenue: 'sum'}
        summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
        summary.columns = ['광고 노출 지면', '노출수', '클릭수', '광고비', '총 판매수량', '총 전환 매출액']

        summary['CPC 평균단가'] = (summary['광고비'] / summary['클릭수']).fillna(0).astype(int)
        summary['광고수익률(ROAS)'] = (summary['총 전환 매출액'] / summary['광고비']).fillna(0)

        # 4. 합계 계산 (문법 오류 수정 지점)
        total_sum = summary.sum(numeric_only=True)
        total_row = {
            '광고 노출 지면': '전체 합계',
            '노출수': total_sum['노출수'],
            '클릭수': total_sum['클릭수'],
            '광고비': total_sum['광고비'],
            '총 판매수량': total_sum['총 판매수량'],
            '총 전환 매출액': total_sum['총 전환 매출액']
        }
        
        # 합계 행 지표 별도 계산
        total_row['CPC 평균단가'] = int(total_row['광고비'] / total_row['클릭수']) if total_row['클릭수'] > 0 else 0
        total_row['광고수익률(ROAS)'] = total_row['총 전환 매출액'] / total_row['광고비'] if total_row['광고비'] > 0 else 0
        
        display_df = pd.concat([summary, pd.DataFrame([total_row])], ignore_index=True)

        # 5. 결과 표 출력
        st.subheader("📍 지면별 성과 요약")
        st.dataframe(display_df.style.format({
            '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
            '총 판매수량': '{:,.0f}', '총 전환 매출액': '{:,.0f}원', 
            'CPC 평균단가': '{:,.0f}원', '광고수익률(ROAS)': '{:.2%}'
        }), use_container_width=True)

        # 6. 전문가 전략 제안
        st.divider()
        st.subheader("💡 훈프로의 전략 제안")
        
        total_roas = total_row['광고수익률(ROAS)']
        if total_roas < 3.0:
            st.warning(f"현재 전체 ROAS가 {total_roas:.1%}로 낮은 편입니다. 상세페이지 보완이 필요합니다.")
        elif total_roas > 5.0:
            st.success(f"ROAS가 {total_roas:.1%}로 매우 좋습니다! 예산을 공격적으로 늘려보세요.")
        else:
            st.info(f"수익률이 {total_roas:.1%}로 안정적입니다. 효율이 낮은 지면의 단가를 미세 조정하세요.")

    except Exception as e:
        st.error(f"오류가 발생했습니다: {e}")