import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="훈프로 쿠팡 광고 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 성과 분석기")
st.markdown("쿠팡 보고서(CSV 또는 XLSX)를 업로드하면 훈프로의 정밀 운영 전략이 자동으로 생성됩니다.")

# --- 2. 사이드바: 수익성 계산 설정 ---
st.sidebar.header("💰 마진 계산 설정")
unit_price = st.sidebar.number_input("상품 판매가 (원)", min_value=0, value=0, step=100)
unit_cost = st.sidebar.number_input("원가 + 수수료 등 지출 (원)", min_value=0, value=0, step=100)

net_unit_margin = unit_price - unit_cost
st.sidebar.divider()
st.sidebar.write(f"**💡 개당 예상 마진:** {net_unit_margin:,.0f}원")

# 3. 파일 업로드
uploaded_file = st.file_uploader("보고서 파일을 선택하세요 (CSV 또는 XLSX)", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        # 파일 확장자에 따른 읽기 방식
        if uploaded_file.name.endswith('.csv'):
            try:
                df = pd.read_csv(uploaded_file, encoding='utf-8-sig')
            except:
                df = pd.read_csv(uploaded_file, encoding='cp949')
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 데이터 전처리: 컬럼명 공백 제거
        df.columns = df.columns.str.strip()

        # 컬럼명 대응 (14일/1일 기준)
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'

        if '광고 노출 지면' in df.columns:
            # 4. 데이터 요약 분석
            target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum'}
            summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
            summary.columns = ['지면', '노출수', '클릭수', '광고비', '판매수량']

            # 실제 매출액 및 실제 ROAS 계산 (사용자 입력 판매가 기준)
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
                '판매수량': tot['판매수량'], '실제매출액': total_real_revenue,
                '클릭률(CTR)': tot['클릭수'] / tot['노출수'] if tot['노출수'] > 0 else 0,
                '구매전환율(CVR)': tot['판매수량'] / tot['클릭수'] if tot['클릭수'] > 0 else 0,
                'CPC': int(tot['광고비'] / tot['클릭수']) if tot['클릭수'] > 0 else 0,
                '실제ROAS': total_real_roas,
                '실질순이익': total_profit
            }
            total_row = pd.DataFrame([total_data])
            display_df = pd.concat([summary, total_row], ignore_index=True)

            # 5. 성과 요약 대시보드
            st.subheader("📌 핵심 성과 지표")
            m1, m2, m3, m4 = st.columns(4)
            profit_color = "#FF4B4B" if total_profit >= 0 else "#1C83E1"

            metrics = [
                ("최종 실질 순이익", f"{total_profit:,.0f}원", profit_color),
                ("총 광고비", f"{tot['광고비']:,.0f}원", "#31333F"),
                ("실제 ROAS", f"{total_real_roas:.2%}", "#31333F"),
                ("총 판매수량", f"{tot['판매수량']:,.0f}개", "#31333F")
            ]
            
            for col, (label, value, color) in zip([m1, m2, m3, m4], metrics):
                col.markdown(f"""<div style="background-color: #f0f2f6; padding: 15px; border-radius: 10px; text-align: center;">
                    <p style="margin:0; font-size:14px; color:#555;">{label}</p>
                    <h2 style="margin:0; color:{color};">{value}</h2>
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

            # --- 7. 돈되는 키워드 (수정된 로직) ---
            if '키워드' in df.columns:
                st.divider()
                st.subheader("💰 돈되는 키워드 (순이익 발생)")
                
                kw_agg_all = df.groupby('키워드').agg({'광고비': 'sum', col_qty: 'sum', '노출수': 'sum', '클릭수': 'sum'}).reset_index()
                kw_agg_all.columns = ['키워드', '광고비', '판매수량', '노출수', '클릭수']
                
                kw_agg_all['실제매출액'] = kw_agg_all['판매수량'] * unit_price
                kw_agg_all['실제ROAS'] = (kw_agg_all['실제매출액'] / kw_agg_all['광고비']).fillna(0)
                kw_agg_all['실질순이익'] = (kw_agg_all['판매수량'] * net_unit_margin) - kw_agg_all['광고비']
                
                # 판매수량이 있고, 실질순이익이 0 이상인 키워드만 필터링 + 광고비 내림차순 정렬
                good_kws = kw_agg_all[(kw_agg_all['판매수량'] > 0) & (kw_agg_all['실질순이익'] >= 0)].sort_values(by='광고비', ascending=False)
                
                if not good_kws.empty:
                    st.success(f"✅ 현재 총 **{len(good_kws)}개**의 키워드에서 플러스 순이익이 발생하고 있습니다. 이 키워드들이 진짜 효자입니다!")
                    st.dataframe(good_kws.style.format({
                        '광고비': '{:,.0f}원', '판매수량': '{:,.0f}개', '실제매출액': '{:,.0f}원', 
                        '실제ROAS': '{:.2%}', '실질순이익': '{:,.0f}원', '노출수': '{:,.0f}', '클릭수': '{:,.0f}'
                    }).applymap(color_profit, subset=['실질순이익']), use_container_width=True)
                else:
                    st.info("플러스 순이익이 발생한 키워드가 아직 없습니다.")

                # 8. 광고비 도둑 키워드 (기존 유지)
                st.divider()
                st.subheader("✂️ 돈먹는 키워드 (제외 대상 제안)")
                bad_mask = (kw_agg_all['광고비'] > 0) & (kw_agg_all['판매수량'] == 0)
                bad_kws = kw_agg_all[bad_mask].sort_values(by='광고비', ascending=False)

                if not bad_kws.empty:
                    total_waste_spend = bad_kws['광고비'].sum()
                    st.error(f"⚠️ 현재 총 **{len(bad_kws)}개**의 키워드가 매출 없이 **{total_waste_spend:,.0f}원**의 광고비를 소진했습니다.")
                    bad_names = bad_kws['키워드'].astype(str).tolist()
                    st.text_area("📋 아래 키워드를 복사 후 '제외 키워드'에 등록하세요:", value=", ".join(bad_names), height=120)
                    st.dataframe(bad_kws[['키워드', '광고비', '판매수량', '노출수', '클릭수']].style.format({
                        '광고비': '{:,.0f}원', '판매수량': '{:,.0f}개', '노출수': '{:,.0f}', '클릭수': '{:,.0f}'
                    }), use_container_width=True)

            # 9. 훈프로의 정밀 운영 제안
            st.divider()
            st.subheader("💡 훈프로의 정밀 운영 제안")
            col1, col2, col3 = st.columns(3)

            with col1:
                st.info("🖼️ **CTR 분석 (썸네일)**")
                ctr_val = total_data['클릭률(CTR)']
                st.write(f"- **현재 CTR: {ctr_val:.2%}**")
                if ctr_val < 0.01:
                    st.write("- **상태**: 낮은 클릭률. 썸네일 개선이 시급합니다.")
                else:
                    st.write("- **상태**: 시각적 매력이 충분합니다.")

            with col2:
                st.warning("🛒 **CVR 분석 (상세페이지)**")
                cvr_val = total_data['구매전환율(CVR)']
                st.write(f"- **현재 CVR: {cvr_val:.2%}**")
                if cvr_val < 0.05:
                    st.write("- **상태**: 설득력이 부족해 구매로 이어지지 않습니다.")
                else:
                    st.write("- **상태**: 상세페이지 전환 능력이 탁월합니다.")

            with col3:
                st.error("💰 **목표수익률 최적화 가이드**")
                st.write(f"- **현재 실제 ROAS: {total_real_roas:.2%}**")
                
                if total_real_roas < 2.0:
                    st.write("🔴 **목표수익률을 즉시 100%p~200%p 상향 설정하세요.**")
                elif 2.0 <= total_real_roas < 4.0:
                    st.write("🟡 **목표수익률을 30~50%p 상향하여 누수를 막으세요.**")
                elif 4.0 <= total_real_roas < 6.0:
                    st.write("🟢 **안정적인 상태입니다. 현재 설정을 유지하세요.**")
                else:
                    st.write("🚀 **효율 극상! 목표수익률을 낮춰 볼륨을 키우세요.**")
        else:
            st.warning("⚠️ 업로드된 파일에 '광고 노출 지면' 컬럼이 없습니다. 쿠팡 광고 보고서 원본을 올려주세요.")

    except Exception as e:
        st.error(f"데이터 처리 중 오류 발생: {e}")

st.divider()
st.markdown("<div style='text-align: center;'><a href='https://hoonpro.liveklass.com/' target='_blank'>🏠 쇼크트리 훈프로 홈페이지 바로가기</a></div>", unsafe_allow_html=True)