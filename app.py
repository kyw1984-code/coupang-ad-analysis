import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="훈프로 쿠팡 광고 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 성과 분석기")
st.markdown("쿠팡 보고서를 업로드하면 실질 수익성과 훈프로의 정밀 운영 전략이 자동으로 생성됩니다.")

# --- 2. 사이드바: 수익성 계산을 위한 기본 정보 입력 ---
st.sidebar.header("💰 마진 및 수익 설정")
st.sidebar.info("정확한 순이익 계산을 위해 정보를 입력해주세요.")

unit_price = st.sidebar.number_input("1. 상품 판매가 (원)", min_value=0, value=20000, step=100)
coupon_discount = st.sidebar.number_input("2. 쿠폰/즉시할인 금액 (개당/원)", min_value=0, value=0, step=100)
unit_cost = st.sidebar.number_input("3. 원가 + 수수료 + 배송비 (개당/원)", min_value=0, value=12000, step=100)

# 개당 순마진 계산 (광고비 집행 전 마진)
net_unit_margin = unit_price - coupon_discount - unit_cost

st.sidebar.divider()
st.sidebar.write(f"**💡 개당 예상 마진:** {net_unit_margin:,.0f}원")
st.sidebar.caption("※ 실질 순이익 = (판매수량 × 개당 예상 마진) - 광고비")

# 3. 파일 업로드
uploaded_file = st.file_uploader("보고서 파일을 선택하세요 (CSV 또는 XLSX)", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        # 파일 읽기
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 컬럼명 대응 (14일/1일 기준)
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_rev = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        # 4. 데이터 요약 분석
        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_rev: 'sum'}
        summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
        summary.columns = ['지면', '노출수', '클릭수', '광고비', '판매수량', '매출액']

        # 지표 계산
        summary['클릭률(CTR)'] = (summary['클릭수'] / summary['노출수']).fillna(0)
        summary['구매전환율(CVR)'] = (summary['판매수량'] / summary['클릭수']).fillna(0)
        summary['CPC'] = (summary['광고비'] / summary['클릭수']).fillna(0).astype(int)
        summary['ROAS'] = (summary['매출액'] / summary['광고비']).fillna(0)
        
        # [수익 계산 추가]
        summary['실질순이익'] = (summary['판매수량'] * net_unit_margin) - summary['광고비']

        # 전체 합계 계산
        tot = summary.sum(numeric_only=True)
        total_profit = (tot['판매수량'] * net_unit_margin) - tot['광고비']
        
        total_data = {
            '지면': '🏢 전체 합계',
            '노출수': tot['노출수'], '클릭수': tot['클릭수'], '광고비': tot['광고비'],
            '판매수량': tot['판매수량'], '매출액': tot['매출액'],
            '클릭률(CTR)': tot['클릭수'] / tot['노출수'] if tot['노출수'] > 0 else 0,
            '구매전환율(CVR)': tot['판매수량'] / tot['클릭수'] if tot['클릭수'] > 0 else 0,
            'CPC': int(tot['광고비'] / tot['클릭수']) if tot['클릭수'] > 0 else 0,
            'ROAS': tot['매출액'] / tot['광고비'] if tot['광고비'] > 0 else 0,
            '실질순이익': total_profit
        }
        total_row = pd.DataFrame([total_data])
        display_df = pd.concat([summary, total_row], ignore_index=True)

        # 5. 성과 요약 카드 대시보드
        st.subheader("📌 비즈니스 성과 요약")
        m1, m2, m3, m4 = st.columns(4)
        
        with m1:
            color = "normal" if total_profit > 0 else "inverse"
            st.metric("최종 실질 순이익", f"{total_profit:,.0f}원", delta=f"{total_profit:,.0f}원")
        with m2:
            st.metric("총 광고비", f"{tot['광고비']:,.0f}원")
        with m3:
            st.metric("평균 ROAS", f"{total_data['ROAS']:.2%}")
        with m4:
            st.metric("판매수량", f"{tot['판매수량']:,.0f}개")

        # 6. 성과 상세 지표 출력
        st.subheader("📍 지면별 상세 분석 (수익 포함)")
        st.dataframe(display_df.style.format({
            '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
            '판매수량': '{:,.0f}', '매출액': '{:,.0f}원', 'CPC': '{:,.0f}원',
            '클릭률(CTR)': '{:.2%}', '구매전환율(CVR)': '{:.2%}', 'ROAS': '{:.2%}',
            '실질순이익': '{:,.0f}원'
        }), use_container_width=True)

        # 7. 광고비 도둑 키워드
        st.divider()
        st.subheader("✂️ 돈먹는 키워드 (제외 대상 제안)")
        
        if '키워드' in df.columns:
            kw_agg = df.groupby('키워드').agg({'광고비': 'sum', col_qty: 'sum'}).reset_index()
            bad_mask = (kw_agg['광고비'] > 0) & (kw_agg[col_qty] == 0)
            bad_kws = kw_agg[bad_mask].sort_values(by='광고비', ascending=False)

            if not bad_kws.empty:
                total_waste_spend = bad_kws['광고비'].sum()
                st.error(f"⚠️ 현재 총 **{len(bad_kws)}개**의 키워드가 매출 없이 **{total_waste_spend:,.0f}원**의 광고비를 소진했습니다.")
                bad_names = bad_kws['키워드'].astype(str).tolist()
                copy_text = ", ".join(bad_names)
                st.text_area("📋 아래 키워드를 복사 후 '제외 키워드'에 등록하세요:", value=copy_text, height=120)
                st.dataframe(bad_kws.style.format({'광고비': '{:,.0f}원', col_qty: '{:,.0f}개'}), use_container_width=True)
            else:
                st.success("🎉 모든 집행 키워드에서 매출이 발생하고 있습니다!")
        else:
            st.info("💡 '키워드 보고서'를 업로드하시면 상세 분석이 가능합니다.")

        # 8. 훈프로의 정밀 운영 제안
        st.divider()
        st.subheader("💡 훈프로의 수익 최적화 제안")
        
        t_perf = total_row.iloc[0]
        col1, col2, col3 = st.columns(3)

        with col1:
            st.info("🖼️ **CTR 분석 (썸네일)**")
            ctr_val = t_perf['클릭률(CTR)']
            st.write(f"- **현재 CTR: {ctr_val:.2%}**")
            if ctr_val < 0.01:
                st.write("- **분석**: 노출 대비 고객의 선택을 받지 못하고 있습니다.")
                st.write("- **액션**: 썸네일 배경 제거, 다른 이미지 활용을 고려해보세요.")
            else:
                st.write("- **분석**: 시각적 소구력이 충분합니다. 현재 이미지를 유지하세요.")

        with col2:
            st.warning("🛒 **CVR 분석 (상세페이지)**")
            cvr_val = t_perf['구매전환율(CVR)']
            st.write(f"- **현재 CVR: {cvr_val:.2%}**")
            if cvr_val < 0.05:
                st.write("- **분석**: 들어온 고객이 그냥 나갑니다. 상세페이지 설득력이 부족합니다.")
                st.write("- **액션**: 상단 3초 안에 핵심 혜택을 배치하고 리뷰를 관리하세요.")
            else:
                st.write("- **분석**: 상세페이지가 훌륭합니다. 유입량 확대에 집중하세요.")

        with col3:
            st.error("💰 **수익성 종합 분석**")
            roas_val = t_perf['ROAS']
            st.write(f"- **현재 ROAS: {roas_val:.2%}**")
            
            if total_profit < 0:
                st.write("🆘 **[경고] 적자 운영 중**")
                st.write(f"- 현재 팔수록 **{abs(total_profit):,.0f}원** 손해입니다.")
                st.write("- **액션**: 목표 ROAS를 즉시 높이고, 효율 없는 키워드를 칼같이 제외하세요.")
            elif roas_val < 3.0:
                st.write("⚠️ **[주의] 저효율 구간**")
                st.write("- 매출은 나지만 광고비 빼면 남는게 적습니다.")
                st.write("- **액션**: CPC를 낮추거나 고효율 지면으로 예산을 재배치하세요.")
            else:
                st.write("🚀 **[성공] 고효율 구간**")
                st.write("- 수익성이 매우 좋습니다.")
                st.write("- **액션**: 예산을 증액하여 시장 점유율을 더 가져오세요.")

    except Exception as e:
        st.error(f"데이터 처리 중 오류 발생: {e}")

# 푸터
st.divider()
st.markdown("<div style='text-align: center;'><a href='https://hoonpro.liveklass.com/' target='_blank'>🏠 쇼크트리 훈프로 홈페이지 바로가기</a></div>", unsafe_allow_html=True)