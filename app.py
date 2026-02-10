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
        # 파일 읽기
        if uploaded_file.name.endswith('.csv'):
            try:
                df = pd.read_csv(uploaded_file, encoding='utf-8-sig')
            except:
                df = pd.read_csv(uploaded_file, encoding='cp949')
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 데이터 전처리: 컬럼명 공백 제거 및 정리
        df.columns = [str(c).strip() for c in df.columns]

        # --- [강화된 컬럼 매칭 로직] ---
        # 1. 판매수량으로 추정되는 모든 이름 체크
        qty_keywords = ['판매수량', '판매 수량', '전환판매수량', '전환 수량', '수량', 'Qty', 'Sales Quantity']
        col_qty = None
        for c in df.columns:
            if any(k in c for k in qty_keywords):
                col_qty = c
                break
        
        # 2. 분석 기준(그룹) 컬럼 찾기
        group_keywords = ['지면', '키워드', '캠페인', '상품명', '광고그룹']
        col_group = None
        for c in df.columns:
            if any(k in c for k in group_keywords):
                col_group = c
                break
        if not col_group: col_group = df.columns[0] # 못 찾으면 첫 번째 컬럼 사용

        # 3. 필수 숫자 데이터 찾기
        col_imp = next((c for c in df.columns if '노출' in c), None)
        col_clk = next((c for c in df.columns if '클릭' in c), None)
        col_cost = next((c for c in df.columns if '광고비' in c or '비용' in c), None)

        # 검증 로직
        if not col_qty:
            st.error(f"⚠️ '판매수량' 관련 컬럼을 찾지 못했습니다. 현재 파일의 컬럼명: {list(df.columns)}")
        elif not all([col_imp, col_clk, col_cost]):
            st.error("⚠️ 노출수, 클릭수, 광고비 중 누락된 항목이 있습니다. 보고서를 다시 확인해주세요.")
        else:
            # 4. 데이터 요약 분석
            summary = df.groupby(col_group).agg({
                col_imp: 'sum', 
                col_clk: 'sum', 
                col_cost: 'sum', 
                col_qty: 'sum'
            }).reset_index()
            summary.columns = ['항목', '노출수', '클릭수', '광고비', '판매수량']

            # 수익 지표 계산
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
            
            # 5. 성과 요약 대시보드
            st.subheader("📌 핵심 성과 지표")
            m1, m2, m3, m4 = st.columns(4)
            profit_color = "#FF4B4B" if total_profit >= 0 else "#1C83E1"

            box_style = """<div style="background-color: #f0f2f6; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #ddd;">
                <p style="margin:0; font-size:14px; color:#555;">{label}</p>
                <h2 style="margin:0; color:{color};">{value}</h2>
            </div>"""

            m1.markdown(box_style.format(label="최종 실질 순이익", color=profit_color, value=f"{total_profit:,.0f}원"), unsafe_allow_html=True)
            m2.markdown(box_style.format(label="총 광고비", color="#31333F", value=f"{tot['광고비']:,.0f}원"), unsafe_allow_html=True)
            m3.markdown(box_style.format(label="실제 ROAS", color="#31333F", value=f"{total_real_roas:.2%}"), unsafe_allow_html=True)
            m4.markdown(box_style.format(label="총 판매수량", color="#31333F", value=f"{tot['판매수량']:,.0f}개"), unsafe_allow_html=True)

            # 6. 상세 분석 표
            st.write("")
            st.subheader(f"📍 {col_group}별 상세 분석")
            
            def color_profit(val):
                if isinstance(val, (int, float)):
                    color = 'red' if val >= 0 else 'blue'
                    return f'color: {color}; font-weight: bold;'
                return ''

            st.dataframe(summary.style.format({
                '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
                '판매수량': '{:,.0f}', '실제매출액': '{:,.0f}원', 'CPC': '{:,.0f}원',
                '클릭률(CTR)': '{:.2%}', '구매전환율(CVR)': '{:.2%}', '실제ROAS': '{:.2%}',
                '실질순이익': '{:,.0f}원'
            }).applymap(color_profit, subset=['실질순이익']), use_container_width=True)

            # 7. 훈프로 제안
            st.divider()
            st.subheader("💡 훈프로의 정밀 운영 제안")
            c1, c2, c3 = st.columns(3)
            with c1:
                ctr = tot['클릭수']/tot['노출수'] if tot['노출수']>0 else 0
                st.info(f"🖼️ CTR: {ctr:.2%}\n\n1% 미만일 경우 썸네일 교체가 필수입니다.")
            with c2:
                cvr = tot['판매수량']/tot['클릭수'] if tot['클릭수']>0 else 0
                st.warning(f"🛒 CVR: {cvr:.2%}\n\n5% 미만일 경우 상세페이지를 점검하세요.")
            with c3:
                st.error(f"💰 목표수익률 가이드\n\n현재 실제 ROAS는 {total_real_roas:.2%}입니다. 수익성에 따라 목표 설정을 30~100%p 조절하세요.")

    except Exception as e:
        st.error(f"데이터 처리 중 오류 발생: {e}")

st.divider()
st.markdown("<div style='text-align: center;'><a href='https://hoonpro.liveklass.com/' target='_blank'>🏠 쇼크트리 훈프로 홈페이지 바로가기</a></div>", unsafe_allow_html=True)