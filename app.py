import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="쿠팡 광고 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 성과 분석")

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
        
        # 데이터 변수화
        search_data = summary[summary['지면'] == '검색 영역'].iloc[0] if '검색 영역' in summary['지면'].values else None
        non_search_data = summary[summary['지면'] == '비검색 영역'].iloc[0] if '비검색 영역' in summary['지면'].values else None
        total_perf = total_row.iloc[0]

        t_col1, t_col2, t_col3 = st.columns(3)

        # [1] 클릭률(CTR) 분석 및 썸네일 제안
        with t_col1:
            st.info("🖼️ **클릭률(CTR) 분석**")
            avg_ctr = total_perf['클릭률(CTR)']
            if avg_ctr < 0.01: # CTR 1% 미만
                st.write(f"- **현재 CTR({avg_ctr:.2%}) 위험**: 노출 대비 클릭이 너무 적습니다. **썸네일 이미지**가 매력적이지 않거나, 상품명 첫 단어가 타겟 키워드와 맞지 않을 수 있습니다.")
                st.write("- **액션**: 썸네일에 텍스트를 추가하거나 고화질로 교체하세요.")
            else:
                st.write(f"- **현재 CTR({avg_ctr:.2%}) 양호**: 상품의 시각적 매력도가 충분합니다. 현재 이미지를 유지하세요.")

        # [2] 전환율(CVR) 분석 및 상세페이지 제안
        with t_col2:
            st.warning("🛒 **전환율(CVR) 분석**")
            avg_cvr = total_perf['구매전환율(CVR)']
            if avg_cvr < 0.05: # CVR 5% 미만
                st.write(f"- **현재 CVR({avg_cvr:.2%}) 저조**: 클릭은 발생하나 구매로 이어지지 않습니다. **상세페이지 상단**의 소구점이 부족하거나 리뷰 관리가 안 되고 있습니다.")
                st.write("- **액션**: 구매평 이벤트나 상세페이지 상단에 '무료반품/특가' 강조 문구를 배치하세요.")
            else:
                st.write(f"- **현재 CVR({avg_cvr:.2%}) 우수**: 유입된 고객이 만족하고 있습니다. 유입량만 더 늘리면 매출은 폭발합니다.")

        # [3] 광고 수익성(ROAS) 및 입찰가 제안
        with t_col3:
            st.error("💰 **수익성(ROAS) 분석**")
            roas = total_perf['ROAS']
            if roas < 3.0:
                st.write(f"- **수익성 적자 주의**: 현재 ROAS({roas:.1%})는 광고비 소진이 과도합니다. **목표 입찰가를 10~20% 하향** 조절하세요.")
                st.write("- **액션**: 효율이 낮은 비검색 지면의 노출 비중을 줄이세요.")
            elif roas > 6.0:
                st.write(f"- **고효율 구간**: 현재 매우 공격적으로 투자해도 되는 시점입니다. **입찰가를 10% 증액**하여 점유율을 뺏어오세요.")
            else:
                st.write("- **현상 유지**: 현재 안정적인 수익 구간입니다.")

        st.divider()
        
        # [4] 지면 최적화 정밀 분석 (검색 vs 비검색)
        st.subheader("🎯 지면 최적화 가이드")
        if search_data is not None and non_search_data is not None:
            c1, c2 = st.columns(2)
            
            with c1:
                st.markdown("### **검색 영역 성과**")
                st.write(f"ROAS: **{search_data['ROAS']:.1%}** / CTR: **{search_data['클릭률(CTR)']:.2%}**")
                if search_data['ROAS'] > non_search_data['ROAS']:
                    st.write("👉 **전략**: 검색 결과 상단 점유가 유리합니다. 메인 키워드 입찰가를 높여 1페이지 상단을 사수하세요.")
                else:
                    st.write("👉 **전략**: 검색 광고 입찰 경쟁이 너무 치열합니다. 수동 광고에서 키워드별로 입찰가를 미세하게 깎아야 합니다.")

            with c2:
                st.markdown("### **비검색 영역 성과**")
                st.write(f"ROAS: **{non_search_data['ROAS']:.1%}** / CVR: **{non_search_data['구매전환율(CVR)']:.2%}**")
                if non_search_data['노출수'] > search_data['노출수'] * 5:
                    st.write("👉 **경고**: 비검색 지면 노출이 너무 많습니다. 상세페이지 하단 광고로 예산이 새고 있을 수 있으니 비검색 지면 제외 처리를 검토하세요.")
                else:
                    st.write("👉 **전략**: 비검색 지면 비중이 적절합니다. 타사 상품을 보던 고객들을 잘 뺏어오고 있습니다.")

        st.success("💡 훈프로님, 위 가이드를 수강생들에게 '그대로 따라하는 매뉴얼'로 배포하시면 질문 공세를 확실히 줄일 수 있습니다!")

    except Exception as e:
        st.error(f"오류가 발생했습니다: {e}")