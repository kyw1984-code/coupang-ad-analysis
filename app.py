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
        # 데이터 읽기
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 3. 데이터 분석 (컬럼 감지 및 집계)
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_rev = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_rev: 'sum'}
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

        # 4. 결과 출력
        st.subheader("📍 성과 상세 지표")
        st.dataframe(display_df.style.format({
            '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
            '판매수량': '{:,.0f}', '매출액': '{:,.0f}원', 'CPC': '{:,.0f}원',
            '클릭률(CTR)': '{:.2%}', '구매전환율(CVR)': '{:.2%}', 'ROAS': '{:.2%}'
        }), use_container_width=True)

        # 5. 전략 제안 로직
        st.divider()
        st.subheader("💡 훈프로의 정밀 운영 제안")
        
        total_perf = total_row.iloc[0]
        col1, col2, col3 = st.columns(3)

        with col1:
            st.info("🖼️ **CTR 분석 (썸네일)**")
            if total_perf['클릭률(CTR)'] < 0.01:
                st.write("- **경고**: 클릭률이 낮습니다. 썸네일 이미지를 즉시 점검하세요.")
            else:
                st.write("- **양호**: 클릭률이 안정적입니다. 유입량을 더 늘리세요.")

        with col2:
            st.warning("🛒 **CVR 분석 (상세페이지)**")
            if total_perf['구매전환율(CVR)'] < 0.05:
                st.write("- **경고**: 전환율이 낮습니다. 상세페이지 상단 혜택을 강조하세요.")
            else:
                st.write("- **양호**: 전환율이 좋습니다. 공격적인 마케팅이 가능합니다.")

        with col3:
            st.error("💰 **ROAS 분석 (수익성)**")
            if total_perf['ROAS'] < 3.0:
                st.write("- **조정**: 수익성이 낮습니다. 입찰가를 15% 하향하세요.")
            elif total_perf['ROAS'] > 6.0:
                st.write("- **확장**: 고효율 구간입니다. 입찰가를 높여 노출을 선점하세요.")
            else:
                st.write("- **유지**: 현재 수익 구조가 안정적입니다.")

    except Exception as e:
        st.error(f"오류 발생: {e}")