import sys
import subprocess

# 1. 자동 설치 로직 (프로그램 실행 전 부품 확인)
def install_and_import(package):
    try:
        __import__(package)
    except ImportError:
        print(f"📦 {package} 라이브러리가 없습니다. 자동으로 설치를 시작합니다...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} 설치 완료!")

# 수강생에게 필요한 핵심 라이브러리들
required = ["pandas", "openpyxl", "ipywidgets"]
for lib in required:
    install_and_import(lib)

# ---------------------------------------------------------
# 2. 여기서부터 실제 분석 프로그램 코드
# ---------------------------------------------------------
import pandas as pd
import io
from IPython.display import display, clear_output
import ipywidgets as widgets

# 파일 업로드 위젯 및 버튼 생성
upload = widgets.FileUpload(accept='.csv, .xlsx', multiple=False)
run_btn = widgets.Button(description="📊 광고 분석 및 제안 실행", button_style='success')
output = widgets.Output()

print("🚀 쿠팡 광고 성과 분석기 (자동 설치 버전)")
print("보고서 파일을 업로드한 후 버튼을 눌러주세요.")
display(upload, run_btn, output)

def on_click(b):
    with output:
        clear_output()
        if not upload.value:
            print("❌ 파일을 먼저 업로드해주세요!")
            return
        
        # 파일 읽기
        input_file = list(upload.value.values())[0]
        content = input_file['content']
        name = input_file['metadata']['name']
        
        try:
            # 확장자에 따라 읽기
            df = pd.read_csv(io.BytesIO(content)) if name.endswith('.csv') else pd.read_excel(io.BytesIO(content))
            
            # 분석 로직 (14일/1일 자동 감지)
            col_qty = '총 판매수량(14일)' if '총 판매수량(14일)' in df.columns else '총 판매수량(1일)'
            col_rev = '총 전환매출액(14일)' if '총 전환매출액(14일)' in df.columns else '총 전환매출액(1일)'
            
            summary = df.groupby('광고 노출 지면').agg({
                '노출수':'sum', '클릭수':'sum', '광고비':'sum', col_qty:'sum', col_rev:'sum'
            }).reset_index()
            
            summary.columns = ['지면', '노출', '클릭', '광고비', '판매수량', '매출액']
            summary['CPC'] = (summary['광고비'] / summary['클릭']).fillna(0).astype(int)
            summary['ROAS'] = (summary['매출액'] / summary['광고비']).fillna(0)
            
            # 합계 추가
            total = summary.sum(numeric_only=True)
            total_row = pd.DataFrame([['전체 합계'] + total.tolist()], columns=summary.columns)
            total_row.at[0, 'CPC'] = int(total['광고비'] / total['클릭']) if total['클릭'] > 0 else 0
            total_row.at[0, 'ROAS'] = total['매출액'] / total['광고비'] if total['광고비'] > 0 else 0
            summary = pd.concat([summary, total_row], ignore_index=True)

            # 결과 출력
            display(summary.style.format({
                '노출':'{:,}', '클릭':'{:,}', '광고비':'{:,}원', 
                '매출액':'{:,}원', 'CPC':'{:,}원', 'ROAS':'{:.2%}'
            }))
            
            # 전략 제안
            st_roas = total_row.at[0, 'ROAS']
            print("\n💡 [전략 제안]")
            if st_roas < 3.0: 
                print("- ROAS가 낮습니다. 유입 대비 구매 전환이 안 되는 원인(상세페이지, 가격 등)을 점검하세요.")
            elif st_roas > 5.0: 
                print("- 수익률이 매우 좋습니다! 광고 예산을 증액하여 더 많은 노출을 확보하는 것을 추천합니다.")
            else:
                print("- 현재 안정적인 수익률을 유지 중입니다. 지면별 성과를 세부적으로 조정해 보세요.")
                
        except Exception as e:
            print(f"오류 발생: {e}")

run_btn.on_click(on_click)