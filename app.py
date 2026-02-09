import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="훈프로 쿠팡 광고 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 성과 분석기")
st.markdown("쿠팡 보고서를 업로드하면 훈프로의 정밀 운영 전략이 자동으로 생성됩니다.")

# --- 2. 사이드바: 수익성 계산 설정 ---
st.sidebar.header("💰 마진 계산 설정")
unit_price = st.sidebar.number_input("상품 판매가 (원)", min_value=0, value=20000, step=100)
unit_cost = st.sidebar.number_input("원가 + 수수료 등 지출 (원)", min_value=0, value=12000, step=100)

net_unit_margin = unit_price - unit_cost
st.sidebar.divider()
st.sidebar.write(f"**💡 개당 예상 마진:** {net_unit_margin:,.0f}원")

# 3. 파일 업로드
uploaded_file = st.file_uploader("보고서 파일을 선택하세요 (CSV 또는 XLSX)", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_rev = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        # 4. 데이터 요약 분석
        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_rev: 'sum'}
        summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
        summary.columns = ['지면', '노출수', '클릭수', '광고비', '판매수량', '매출액']

        # [실제 ROAS 계산 로직 변경]
        # 실제 매출액 = 판매수량 * 입력한 상품 판매가
        # 실제 ROAS = 실제 매출액 / 광고비
        summary['실제매출액'] = summary['판매수량'] * unit_price
        summary['실제ROAS'] = (summary['실제매출액'] / summary['광고비']).fillna(0)
        
        summary['클릭률(CTR)'] = (summary['클릭수'] / summary['노출수']).fillna(0)
        summary['구매전환율(CVR)'] = (summary['판매수량'] / summary['클릭수']).fillna(0)
        summary['CPC'] = (summary['광고비'] / summary['클릭수']).fillna(0).astype(int)
        summary['실질순이익'] = (summary['판매수량'] * net_unit_margin) - summary['광고비']

        # 전체 합계 계산
        tot = summary.sum(numeric_only=True)
        total_real_revenue = tot['판매수량'] * unit_price
        total_real_roas = total_real_revenue / tot['광고비'] if tot['광고비'] > 0 else 0
        total_profit = (tot['판매수량'] * net_unit_margin) - tot['광고비']
        
        total_data = {
            '지면': '🏢 전체 합계',
            '노출수': tot['노출수'], '클릭수': tot['클릭수'], '광고비': tot['광고비'],
            '판매수량': tot['판매수량'], '매출액': total_real_revenue, # 합계 매출도 실제 판매가 기준으로 표시
            '클릭률(CTR)': tot['클릭수'] / tot['노출수'] if tot['노출수'] > 0 else 0,
            '구매전환율(CVR)': tot['판매수량'] / tot['클릭수'] if tot['클릭수'] > 0 else 0,
            'CPC': int(tot['광고비'] / tot['클릭수']) if tot['클릭수'] > 0 else 0,
            'ROAS': total_real_roas,
            '실질순이익': total_profit
        }
        total_row = pd.DataFrame([total_data])
        display_df = pd.concat([summary[['지면', '노출수', '클릭수', '광고비', '판매수량', '실제매출액', '클릭률(CTR)', '구매전환율(CVR)', 'CPC', '실제ROAS', '실질순이익']], total_row.rename(columns={'매출액':'실제매출액', 'ROAS':'실제ROAS'})], ignore_index=True)

        # 5. 성과 요약 대시보드
        st.subheader("📌 핵심 성과 지표")
        m1, m2, m3, m4 = st.columns(4)
        
        profit_color = "#FF4B4B" if total_profit >= 0 else "#1C83E1"

        with m1:
            st.markdown(f"""<div style="background-color: #f0f2f6; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="margin:0; font-size:14px; color:#555;">최종 실질 순이익</p>
                <h2 style="margin:0; color:{profit_color};">{total_profit:,.0f}원</h2>
            </div>""", unsafe_allow_html=True)
        
        with m2:
            st.markdown(f"""<div style="background-color: #f0f2f6; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="margin:0; font-size:14px; color:#555;">총 광고비</p>
                <h2 style="margin:0; color:#31333F;">{tot['광고비']:,.0f}원</h2>
            </div>""", unsafe_allow_html=True)
            
        with m3:
            st.markdown(f"""<div style="background-color: #f0f2f6; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="margin:0; font-size:14px; color:#555;">실제 ROAS</p>
                <h2 style="margin:0; color:#31333F;">{total_real_roas:.2%}</h2>
            </div>""", unsafe_allow_html=True)
            
        with m4:
            st.markdown(f"""<div style="background-color: #f0f2f6; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="margin:0; font-size:14px; color:#555;">총 판매수량</p>
                <h2 style="margin:0; color:#31333F;">{tot['판매수량']:,.0f}개</h2>
            </div>""", unsafe_allow_html=True)

        st.write("")

        # 6. 지면별 상세 분석
        st.subheader("📍 지면별 상세 분석")
        
        def color_profit(val):
            if isinstance(val, (int, float)):
                color = 'red' if val >= 0 else 'blue'
                return f'color: {color}; font-weight: bold;'
            return ''

        st.dataframe(display_df.style.format({
            '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
            '판매수량': '{:,.0f}', '실제매출액': '{:,.0f}원', 'CPC': '{:,.0f}원',
            '클릭률(CTR)': '{:.2%}', '구매전환율(CVR)': '{:.2%}', '실제ROAS': '{:.2%}',
            '실질순이익': '{:,.0f}원'
        }).applymap(color_profit, subset=['실질순이익']), use_container_width=True)

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
                st.text_area("📋 아래 키워드를 복사 후 '제외 키워드'에 등록하세요:", value=", ".join(bad_names), height=120)
                st.dataframe(bad_kws.style.format({'광고비': '{:,.0f}원', col_qty: '{:,.0f}개'}), use_container_width=True)

        # 8. 훈프로의 정밀 운영 제안
        st.divider()
        st.subheader("💡 훈프로의 정밀 운영 제안")
        
        t_perf = total_row.iloc[0]
        col1, col2, col3 = st.columns(3)

        with col1:
            st.info("🖼️ **CTR 분석 (썸네일)**")
            ctr_val = t_perf['클릭률(CTR)']
            st.write(f"- **현재 CTR: {ctr_val:.2%}**")
            if ctr_val < 0.01:
                st.write("- **분석**: 노출 대비 고객의 선택을 받지 못하고 있습니다.")
                st.write("- **액션**: 썸네일 변경 혹은 상품명 최적화가 필요합니다.")
            else:
                st.write("- **분석**: 시각적 소구력이 충분합니다.")

        with col2:
            st.warning("🛒 **CVR 분석 (상세페이지)**")
            cvr_val = t_perf['구매전환율(CVR)']
            st.write(f"- **현재 CVR: {cvr_val:.2%}**")
            if cvr_val < 0.05:
                st.write("- **분석**: 상세페이지 설득력이 부족합니다.")
                st.write("- **액션**: 핵심 혜택 및 베스트 리뷰를 상단에 배치하세요.")
            else:
                st.write("- **분석**: 상세페이지가 매우 훌륭합니다.")

        with col3:
            st.error("💰 **ROAS 분석 (수익성 및 목표설정)**")
            # 제안 로직에서도 실제 ROAS 기준(total_real_roas)으로 판단
            st.write(f"- **실제 ROAS: {total_real_roas:.2%}**")
            
            if total_real_roas < 2.0:
                st.write("🆘 **[심각] 손실 구간**")
                st.write("- **목표수익률 조정**: 즉시 50~100%p 상향 설정하세요.")
            elif 2.0 <= total_real_roas < 4.0:
                st.write("⚠️ **[주의] 저효율 구간**")
                st.write("- **목표수익률 조정**: 20~30%p 상향하여 보수적으로 운영하세요.")
            elif 4.0 <= total_real_roas < 6.0:
                st.write("✅ **[안정] 수익 유지 구간**")
                st.write("- **운영**: 현 설정을 유지하거나 미세 조정을 시도하세요.")
            else:
                st.write("🚀 **[확장] 고효율 성장 구간**")
                st.write("- **목표수익률 조정**: 20~50%p 하향하여 노출을 대폭 늘리세요.")

    except Exception as e:
        st.error(f"데이터 처리 중 오류 발생: {e}")

st.divider()
st.markdown("<div style='text-align: center;'><a href='https://hoonpro.liveklass.com/' target='_blank'>🏠 쇼크트리 훈프로 홈페이지 바로가기</a></div>", unsafe_allow_html=True)