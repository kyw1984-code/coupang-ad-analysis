import streamlit as st
import pandas as pd

# 1. 페이지 설정 및 비밀번호 설정
st.set_page_config(page_title="훈프로 쿠팡 광고 분석기", layout="wide")

# 관리용 비밀번호 (김프로님이 원하시는 비밀번호로 수정하세요)
SECRET_PASSWORD = "hoonpro4989" 

# 세션 상태 초기화 (로그인 여부 확인)
if 'auth' not in st.session_state:
    st.session_state['auth'] = False

# --- 로그인 화면 ---
if not st.session_state['auth']:
    st.title("🔐 쇼크트리 수강생 전용 분석기")
    st.markdown("본 프로그램은 **쇼크트리 훈프로** 수강생 전용입니다. 비밀번호를 입력해 주세요.")
    
    password_input = st.text_input("비밀번호", type="password")
    if st.button("접속하기"):
        if password_input == SECRET_PASSWORD:
            st.session_state['auth'] = True
            st.rerun()
        else:
            st.error("비밀번호가 틀렸습니다. 다시 확인해 주세요.")
    st.stop() # 인증 전까지 아래 코드는 실행되지 않음

# --- 인증 후 본 프로그램 화면 ---
st.title("📊 쇼크트리 훈프로 쿠팡 광고 성과 분석")
st.markdown(f"**{SECRET_PASSWORD}**님 환영합니다! 보고서를 업로드하면 정밀 전략이 생성됩니다.")

# 2. 파일 업로드
uploaded_file = st.file_uploader("보고서 파일을 선택하세요 (CSV 또는 XLSX)", type=['csv', 'xlsx'])

if uploaded_file is not None:
    try:
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file, engine='openpyxl')

        # 3. 데이터 분석 로직
        col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        col_rev = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        target_cols = {'노출수': 'sum', '클릭수': 'sum', '광고비': 'sum', col_qty: 'sum', col_rev: 'sum'}
        summary = df.groupby('광고 노출 지면').agg(target_cols).reset_index()
        summary.columns = ['지면', '노출수', '클릭수', '광고비', '판매수량', '매출액']

        summary['클릭률(CTR)'] = (summary['클릭수'] / summary['노출수']).fillna(0)
        summary['구매전환율(CVR)'] = (summary['판매수량'] / summary['클릭수']).fillna(0)
        summary['CPC'] = (summary['광고비'] / summary['클릭수']).fillna(0).astype(int)
        summary['ROAS'] = (summary['매출액'] / summary['광고비']).fillna(0)

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

        st.subheader("📍 성과 상세 지표")
        st.dataframe(display_df.style.format({
            '노출수': '{:,.0f}', '클릭수': '{:,.0f}', '광고비': '{:,.0f}원', 
            '판매수량': '{:,.0f}', '매출액': '{:,.0f}원', 'CPC': '{:,.0f}원',
            '클릭률(CTR)': '{:.2%}', '구매전환율(CVR)': '{:.2%}', 'ROAS': '{:.2%}'
        }), use_container_width=True)

        # 5. 전략 제안 로직 (수익성 강화 버전)
        st.divider()
        st.subheader("💡 훈프로의 정밀 운영 제안")
        
        total_perf = total_row.iloc[0]
        col1, col2, col3 = st.columns(3)

        with col1:
            st.info("🖼️ **CTR 분석 (썸네일)**")
            if total_perf['클릭률(CTR)'] < 0.01:
                st.write(f"- **현재 CTR: {total_perf['클릭률(CTR)']:.2%}** (위험)")
                st.write("- **액션**: 썸네일 이미지나 상품명 앞단 키워드를 직관적으로 수정하세요.")
            else:
                st.write(f"- **현재 CTR: {total_perf['클릭률(CTR)']:.2%}** (양호)")
                st.write("- **분석**: 시각적 매력이 충분합니다. 유입 확대에 집중하세요.")

        with col2:
            st.warning("🛒 **CVR 분석 (상세페이지)**")
            if total_perf['구매전환율(CVR)'] < 0.05:
                st.write(f"- **현재 CVR: {total_perf['구매전환율(CVR)']:.2%}** (저조)")
                st.write("- **액션**: 상세페이지 상단에 '무료배송/특가/증정' 등 핵심 혜택을 강조하세요.")
            else:
                st.write(f"- **현재 CVR: {total_perf['구매전환율(CVR)']:.2%}** (우수)")
                st.write("- **분석**: 상세페이지 설득력이 좋습니다. CPC 관리에 집중하세요.")

        with col3:
            st.error("💰 **ROAS 분석 (수익성)**")
            roas = total_perf['ROAS']
            st.write(f"- **현재 ROAS: {roas:.2%}**")
            
            if roas < 2.0:
                st.write("🆘 **운영**: **목표수익률을 30~50% 상향**하여 광고비를 즉시 절감하세요.")
            elif 2.0 <= roas < 4.0:
                st.write("⚠️ **운영**: **목표수익률을 10~20% 상향** 조정하여 보수적으로 운영하세요.")
            elif 4.0 <= roas < 6.0:
                st.write("✅ **운영**: **현 설정을 유지**하며 데일리 모니터링하세요.")
            else:
                st.write("🚀 **운영**: **목표수익률을 10~20% 하향**하여 매출 규모를 더 공격적으로 키우세요.")

    except Exception as e:
        st.error(f"오류 발생: {e}")