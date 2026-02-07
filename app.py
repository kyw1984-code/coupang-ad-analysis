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
            df = pd.read_excel(uploaded_file)

        # 3. 데이터 분석
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_revenue = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_revenue: 'sum'}
        summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
        summary.columns = ['광고 노출 지면', '노출수', '클릭수', '광고비', '총 판매수량', '총 전환 매출액']

        summary['CPC 평균단가'] = (summary['광고비'] / summary['클릭수']).fillna(0).astype(int)
        summary['광고수익률(ROAS)'] = (summary['총 전환 매출액'] / summary['광고비']).fillna(0)

        # 합계 계산
        total_sum = summary.sum(numeric_only=True)
        total_row = {'광고 노출 지면': '전체 합계'}
        total_row.update(total_sum.to_dict())
        total_row['CPC 평균단가'] = int(total_row['광고비'] / total_row['클릭수']) if total_row['클릭수'] > 0 else 0
        total_row['광고수익률(ROAS)'] = total_row['총 전환 매출액'] / total_row['광고비'] if total_row['광고비'] > 0 else 0
        
        display_df = pd.concat([summary, pd.DataFrame([total_row])], ignore_index=True)

        # 4. 결과 표 출력
        st.subheader("📍 지면별 성과 요약")
        st.dataframe(display_df.style.format({
            '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
            '총 판매수량': '{:,.0f}', '총 전환 매출액': '{:,.0f}원', 
            'CPC 평균단가': '{:,.0f}원', '광고수익률(ROAS)': '{:.2%}'
        }), use_container_width=True)

        # 5. 💡 광고 효율 자동 제안 기능
        st.divider()
        st.subheader("💡 광고 효율 개선 전략 제안")
        
        # 데이터 추출 (비교용)
        search_data = summary[summary['광고 노출 지면'] == '검색 영역'].iloc[0] if '검색 영역' in summary['광고 노출 지면'].values else None
        non_search_data = summary[summary['광고 노출 지면'] == '비검색 영역'].iloc[0] if '비검색 영역' in summary['광고 노출 지면'].values else None
        
        col1, col2 = st.columns(2)

        with col1:
            st.info("🎯 **지면 최적화 제안**")
            if non_search_data is not None and search_data is not None:
                if non_search_data['노출수'] > search_data['노출수'] * 10:
                    st.write("- **비검색 영역 편중 주의**: 현재 비검색 지면(상세페이지 등)에 노출이 너무 치우쳐 있습니다. 구매 의도가 높은 '검색 영역'의 노출을 늘리기 위해 주요 키워드의 입찰가를 높여보세요.")
                
                if search_data['광고수익률(ROAS)'] > non_search_data['광고수익률(ROAS)']:
                    st.write(f"- **검색 지면 효율 우수**: 검색 영역의 ROAS({search_data['광고수익률(ROAS)']:.1%})가 더 높습니다. 예산을 검색 영역으로 좀 더 집중하는 것이 유리합니다.")
                else:
                    st.write(f"- **비검색 지면 효율 우수**: 비검색 영역의 효율이 더 좋습니다. 타겟 상품의 상세페이지 노출이 잘 되고 있으니, 현재 입찰가를 유지하며 소진율을 체크하세요.")

        with col2:
            st.warning("💰 **비용 및 전환 제안**")
            total_roas = total_row['광고수익률(ROAS)']
            if total_roas < 3.0: # ROAS 300% 미만일 때
                st.write("- **수익성 개선 필요**: 현재 전체 ROAS가 낮습니다. 클릭률(CTR)은 높으나 구매가 안 된다면 상세페이지의 매력도를 점검하거나, 단가를 낮춰야 합니다.")
            elif total_roas > 5.0: # ROAS 500% 이상일 때
                st.write("- **공격적 확장 가능**: 광고 효율이 매우 좋습니다! 예산을 증액하여 더 많은 노출을 확보해도 수익이 발생할 가능성이 큽니다.")
            
            avg_cpc = total_row['CPC 평균단가']
            if avg_cpc > 200:
                st.write(f"- **고단가 경고**: 평균 CPC가 {avg_cpc}원으로 다소 높습니다. 경쟁이 너무 치열한 키워드보다는 세부 키워드(롱테일 키워드)를 발굴해 비용을 절감해 보세요.")
            else:
                st.write(f"- **적정 비용 유지**: 현재 유입 단가가 안정적입니다. 유입량을 더 늘릴 수 있는 여유가 있습니다.")

        st.success("위 제안은 업로드된 데이터를 기반으로 생성되었습니다. 매일 성과를 비교하며 조절해 보세요!")

    except Exception as e:
        st.error(f"오류가 발생했습니다: {e}")