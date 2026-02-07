import streamlit as st
import pandas as pd

st.title("🚀 쿠팡 광고 분석기 테스트")

# 서버에 설치된 라이브러리 확인용 (오류 추적용)
try:
    import openpyxl
    st.success("✅ openpyxl 라이브러리가 정상적으로 설치되었습니다.")
except ImportError:
    st.error("❌ openpyxl이 아직 설치되지 않았습니다. requirements.txt를 확인하세요.")

uploaded_file = st.file_uploader("엑셀 파일을 올려보세요", type=['xlsx', 'csv'])

if uploaded_file:
    try:
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            # engine을 지정하지 않고 읽어봅니다.
            df = pd.read_excel(uploaded_file)
        st.write("데이터 읽기 성공!")
        st.dataframe(df.head())
    except Exception as e:
        st.error(f"오류 내용: {e}")