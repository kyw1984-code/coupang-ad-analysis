import streamlit as st
import pandas as pd

# 1. 페이지 기본 설정
st.set_page_config(page_title="훈프로 분석기", layout="wide")
st.title("📊 쇼크트리 훈프로 쿠팡 광고 분석기")

file = st.file_uploader("보고서 업로드 (CSV/XLSX)", type=['csv', 'xlsx'])

if file is not None:
    try:
        # 파일 읽기
        if file.name.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file, engine='openpyxl')

        # 컬럼명 대응 (14일/1일 기준)
        q_col = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
        r_col = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'

        # 1. 지표 요약 계산
        tmp = df.groupby('광고 노출 지면').agg({
            '노출수':'sum','클릭수':'sum','광고비':'sum',q_col:'sum',r_col:'sum'
        }).reset_index()
        tmp.columns = ['지면','노출수','클릭수','광고비','판매수량','매출액']

        # 2. 전체 합계 행 추가
        tot = tmp.sum(numeric_only=True)
        row = pd.DataFrame([{
            '지면':'🏢 합계','노출수':tot['노출수'],'클릭수':tot['클릭수'],
            '광고비':tot['광고비'],'판매수량':tot['판매수량'],'매출액':tot['매출액']
        }])
        res = pd.concat([tmp, row], ignore_index=True)

        # 3. 주요 비율 지표 계산
        res['CTR'] = (res['클릭수'] / res['노출수']).fillna(0)
        res['CVR'] = (res['판매수량'] / res['클릭수']).fillna(0)
        res['ROAS'] = (res['매출액'] / res['광고비']).fillna(0)

        # 4. 성과 지표 화면 출력
        st.subheader("📍 성과 상세 지표")
        st.dataframe(res.style.format({
            '광고비':'{:,.0f}원','매출액':'{:,.0f}원',
            'CTR':'{:.2%}','CVR':'{:.2%}','ROAS':'{:.2%}'
        }), use_container_width=True)

        # 5. 광고비 도둑 키워드 (제외 키워드 추출)
        st.divider()
        st.subheader("✂️ 광고비 도둑 키워드 (제외 대상)")
        if '키워드' in df.columns:
            k_df = df.groupby('키워드').agg({'광고비':'sum', q_col:'sum'}).reset_index()
            # 광고비는 썼는데 판매가 0인 키워드 필터링
            bad = k_df[(k_df['광고비'] > 0) & (k_df[q_col] == 0)].sort_values('광고비', ascending=False)
            
            if not bad.empty:
                st.write(f"총 **{len(bad)}개**의 키워드가 돈만 쓰고 있습니다.")
                txt = ", ".join(bad['키워드'].astype(str).tolist())
                st.text_area("📋 아래를 복사해서 '제외 키워드'에 등록하세요:", value=txt, height=150)
                st.dataframe(bad.style.format({'광고비':'{:,.0f}원', q_col:'{:,.0f}개'}), use_container_width=True)
            else:
                st.success("🎉 모든 키워드가 매출을 내고 있습니다!")
        else:
            st.info("💡 '키워드 보고서'를 업로드하면 상세 키워드 분석이 가능합니다.")

        # 6. 훈프로 정밀 운영 제안
        st.divider()
        st.subheader("💡 훈프로의 운영 제안")
        perf = row.iloc[0]
        roas = (perf['매출액']/perf['광고비']) if perf['광고비']>0 else 0
        
        c1, c2 = st.columns(2)
        c1.metric("현재 평균 ROAS", f"{roas:.2%}")
        
        with c2:
            if roas < 2.0:
                st.error("🆘 [위험] 적자 구간입니다. 즉시 비효율 키워드를 차단하세요!")
            elif roas < 4.0:
                st.warning("⚠️ [주의] 수익이 약합니다. 검색 지면 위주로 필터링하세요.")
            else:
                st.success("🚀 [확장] 효율이 좋습니다! 예산을 증액해 점유율을 높이세요.")

    except Exception as e:
        st.error(f"데이터 처리 중 오류가 발생했습니다: {e}")

# 푸터
st.divider()
st.markdown("<div style='text-align: center;'><a href='https://hoonpro.liveklass.com/' target='_blank'>🏠 쇼크트리 훈프로 홈페이지 바로가기</a></div>", unsafe_allow_html=True)