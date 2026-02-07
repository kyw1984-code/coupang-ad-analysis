import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="쿠팡 광고 분석기", layout="wide")
st.title("📊 쿠팡 광고 성과 분석기 (웹 버전)")
st.markdown("쿠팡 광고 보고서를 업로드하면 자동으로 성과를 분석하고 전략을 제안합니다.")

# 2. 파일 업로드
uploaded_file = st.file_uploader("보고서 파일을 선택하세요 (CSV 또는 Excel)", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        # 파일 읽기
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file)

        # 3. 데이터 분석 로직
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_rev = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_rev: 'sum'}
        summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
        summary.columns = ['지면', '노출', '클릭', '광고비', '판매수량', '매출액']

        summary['CPC'] = (summary['광고비'] / summary['클릭']).fillna(0).astype(int)
        summary['ROAS'] = (summary['매출액'] / summary['광고비']).fillna(0)

        # 합계 계산
        total_sum = summary.sum(numeric_only=True)
        total_row = pd.DataFrame([{
            '지면': '🏢 전체 합계',
            '노출': total_sum['노출'],
            '클릭': total_sum['클릭'],
            '광고비': total_sum['광고비'],
            '판매수량': total_sum['판매수량'],
            '매출액': total_sum['매출액'],
            'CPC': int(total_sum['광고비'] / total_sum['클릭']) if total_sum['클릭'] > 0 else 0,
            'ROAS': total_sum['매출액'] / total_sum['광고비'] if total_sum['광고비'] > 0 else 0
        }])
        
        summary = pd.concat([summary, total_row], ignore_index=True)

        # 4. 결과 출력
        st.subheader("📍 지면별 성과 요약")
        st.dataframe(summary.style.format({
            '노출': '{:,.0f}', '클릭': '{:,.0f}', '광고비': '{:,.0f}원', 
            '판매수량': '{:,.0f}', '매출액': '{:,.0f}원', 
            'CPC': '{:,.0f}원', 'ROAS': '{:.2%}'
        }), use_container_width=True)

        # 5. 전략 제안
        st.divider()
        st.subheader("💡 전문가 전략 제안")
        final_roas = total_row.iloc[0]['ROAS']
        
        if final_roas < 3.0:
            st.error(f"현재 ROAS({final_roas:.2%})가 낮습니다. 유입 대비 전환율을 점검하고 입찰가를 조정하세요.")
        elif final_roas > 5.0:
            st.success(f"현재 ROAS({final_roas:.2%})가 매우 훌륭합니다! 공격적인 예산 증액을 추천합니다.")
        else:
            st.info(f"현재 ROAS({final_roas:.2%})는 안정적입니다. 세부 키워드 최적화에 집중하세요.")

    except Exception as e:
        st.error(f"분석 중 오류가 발생했습니다: {e}")