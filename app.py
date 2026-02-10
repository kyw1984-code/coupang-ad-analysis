import streamlit as st
import pandas as pd

# 1. 페이지 설정
st.set_page_config(page_title="훈프로 쿠팡 광고 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 성과 분석기")
st.markdown("쿠팡 보고서(CSV 또는 XLSX)를 업로드하면 훈프로의 정밀 운영 전략이 자동으로 생성됩니다.")

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

        # --- [오류 해결: 컬럼 자동 매칭 로직] ---
        # 1. 판매수량 컬럼 찾기
        possible_qty_cols = ['총 판매수량(14일)', '총 판매수량(1일)', '총 판매수량', '전환 판매수량', '판매수량']
        col_qty = next((c for c in possible_qty_cols if c in df.columns), None)
        
        # 2. 지면/키워드 등 그룹화 기준 컬럼 찾기
        possible_group_cols = ['광고 노출 지면', '키워드', '캠페인명', '광고그룹명']
        col_group = next((c for c in possible_group_cols if c in df.columns), df.columns[0])

        # 필수 숫자 컬럼 확인
        required_nums = ['노출수', '클릭수', '광고비']
        missing_nums = [c for c in required_nums if c not in df.columns]

        if not col_qty:
            st.error("⚠️ 보고서에서 '판매수량' 컬럼을 찾을 수 없습니다. 쿠팡에서 받은 원본 보고서가 맞는지 확인해주세요.")
        elif missing_nums:
            st.error(f"⚠️ 필수 데이터({', '.join(missing_nums)})가 보고서에 없습니다.")
        else:
            # 4. 데이터 요약 분석
            summary = df.groupby(col_group).agg({
                '노출수': 'sum', 
                '클릭수': 'sum', 
                '광고비': 'sum', 
                col_qty: 'sum'
            }).reset_index()
            summary.columns = ['항목', '노출수', '클릭수', '광고비', '판매수량']

            # 실제 매출 및 ROAS 계산
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
                '항목': '🏢 전체 합계',
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

            # 6. 상세 분석 표
            st.write("")
            st.subheader(f"📍 {col_group}별 상세 분석")
            
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

            # 7. 돈먹는 키워드 (보고서에 '키워드' 컬럼이 있을 때만 표시)
            if '키워드' in df.columns:
                st.divider()
                st.subheader("✂️ 돈먹는 키워드 (제외 대상)")
                kw_agg = df.groupby('키워드').agg({'광고비': 'sum', col_qty: 'sum'}).reset_index()
                bad_mask = (kw_agg['광고비'] > 0) & (kw_agg[col_qty] == 0)
                bad_kws = kw_agg[bad_mask].sort_values(by='광고비', ascending=False)

                if not bad_kws.empty:
                    st.error(f"⚠️ 총 **{len(bad_kws)}개**의 키워드가 매출 없이 광고비만 쓰고 있습니다.")
                    st.text_area("📋 제외 키워드 목록:", value=", ".join(bad_kws['키워드'].tolist()), height=100)
                    st.dataframe(bad_kws.style.format({'광고비': '{:,.0f}원', col_qty: '{:,.0f}개'}), use_container_width=True)

            # 8. 훈프로의 정밀 운영 제안
            st.divider()
            st.subheader("💡 훈프로의 정밀 운영 제안")
            col1, col2, col3 = st.columns(3)

            with col1:
                st.info("🖼️ **CTR 분석 (썸네일)**")
                ctr_val = total_data['클릭률(CTR)']
                st.write(f"- 현재 CTR: **{ctr_val:.2%}**")
                if ctr_val < 0.01:
                    st.write("- **진단**: 클릭률이 낮습니다. 썸네일 교체가 필요합니다.")
                else:
                    st.write("- **진단**: 클릭률이 좋습니다. 현재 이미지 유지.")

            with col2:
                st.warning("🛒 **CVR 분석 (상세페이지)**")
                cvr_val = total_data['구매전환율(CVR)']
                st.write(f"- 현재 CVR: **{cvr_val:.2%}**")
                if cvr_val < 0.05:
                    st.write("- **진단**: 상세페이지 설득력이 부족합니다.")
                else:
                    st.write("- **진단**: 전환율이 훌륭합니다.")

            with col3:
                st.error("💰 **목표수익률 가이드**")
                st.write(f"- 실제 ROAS: **{total_real_roas:.2%}**")
                if total_real_roas < 2.0:
                    st.write("🔴 **목표수익률 100~200%p 즉시 상향하세요.**")
                elif total_real_roas < 4.0:
                    st.write("🟡 **목표수익률 30~50%p 상향하세요.**")
                else:
                    st.write("🚀 **수익성 최고! 목표수익률을 낮춰 매출을 키우세요.**")

    except Exception as e:
        st.error(f"데이터 처리 중 오류 발생: {e}")

# 푸터
st.divider()
st.markdown("<div style='text-align: center;'><a href='https://hoonpro.liveklass.com/' target='_blank'>🏠 쇼크트리 훈프로 홈페이지 바로가기</a></div>", unsafe_allow_html=True)