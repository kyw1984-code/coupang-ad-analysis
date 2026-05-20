import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';

export interface AdReportRow {
  지면?: string;
  노출수?: number;
  클릭수?: number;
  클릭률?: number;
  광고비?: number;
  CPC?: number;
  판매수량?: number;
  매출?: number;
  전환율?: number;
  ROAS?: number;
  옵션?: string;
  키워드?: string;
}

export interface ParsedAdData {
  raw: AdReportRow[];
  summary: {
    totalImpressions: number;
    totalClicks: number;
    totalAdCost: number;
    totalSales: number;
    totalQuantity: number;
    avgCTR: number;
    avgCVR: number;
    avgROAS: number;
  };
}

const LOCAL_FILE_URI_PATTERN = /^(file|content):\/\//i;

async function readWorkbook(uri: string): Promise<XLSX.WorkBook> {
  if (LOCAL_FILE_URI_PATTERN.test(uri)) {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return XLSX.read(base64, { type: 'base64' });
    } catch (error) {
      console.warn('Local Excel read failed, falling back to fetch:', error);
    }
  }

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: 'array' });
}

async function readTextFile(uri: string): Promise<string> {
  if (LOCAL_FILE_URI_PATTERN.test(uri)) {
    try {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.warn('Local CSV read failed, falling back to fetch:', error);
    }
  }

  const response = await fetch(uri);
  return response.text();
}

/**
 * 엑셀/CSV 파일을 파싱하여 광고 데이터 추출
 */
export async function parseExcelFile(uri: string): Promise<ParsedAdData> {
  try {
    const workbook = await readWorkbook(uri);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // JSON으로 변환
    const jsonData = XLSX.utils.sheet_to_json<AdReportRow>(worksheet);

    // 데이터 정제 및 요약 계산
    const parsedData = processAdData(jsonData);

    return parsedData;
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error('파일 파싱 중 오류가 발생했습니다.');
  }
}

/**
 * CSV 파일 파싱 (간단한 구현)
 */
export async function parseCSVFile(uri: string): Promise<ParsedAdData> {
  try {
    const text = await readTextFile(uri);

    // CSV를 행으로 분리
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const jsonData: AdReportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const row: AdReportRow = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (value) {
          // 숫자로 변환 가능하면 변환
          const numValue = parseFloat(value.replace(/,/g, ''));
          (row as any)[header] = isNaN(numValue) ? value : numValue;
        }
      });

      jsonData.push(row);
    }

    return processAdData(jsonData);
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error('CSV 파일 파싱 중 오류가 발생했습니다.');
  }
}

/**
 * 쿠팡 WING 엑셀 컬럼명 → 내부 필드명 매핑
 * 우선순위: 14일 > 1일 > 기본
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  '지면': ['광고 노출 지면'],
  '판매수량': ['총 판매수량(14일)', '총 판매수량(1일)', '총 판매수량', '전환 판매수량'],
  '매출': ['총 전환매출액(14일)', '총 전환매출액(1일)', '총 전환매출액'],
  '옵션': ['광고집행 상품명'],
  // 동일 이름은 매핑 불필요: 노출수, 클릭수, 광고비, 키워드
};

/**
 * 엑셀 row 객체의 키를 내부 필드명으로 변환
 */
function mapRowColumns(row: Record<string, unknown>): AdReportRow {
  const mapped: Record<string, unknown> = { ...row };

  for (const [targetKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (mapped[targetKey] !== undefined) continue; // 이미 존재하면 스킵
    for (const alias of aliases) {
      if (mapped[alias] !== undefined) {
        mapped[targetKey] = mapped[alias];
        break; // 첫 번째 매칭 사용 (우선순위)
      }
    }
  }

  return mapped as unknown as AdReportRow;
}

/**
 * 광고 데이터 처리 및 요약
 */
function processAdData(data: AdReportRow[]): ParsedAdData {
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalAdCost = 0;
  let totalSales = 0;
  let totalQuantity = 0;

  // 데이터 정제 및 합계 계산
  const cleanedData = data.map(rawRow => {
    const row = mapRowColumns(rawRow as unknown as Record<string, unknown>);
    const impressions = row.노출수 || 0;
    const clicks = row.클릭수 || 0;
    const adCost = row.광고비 || 0;
    const sales = row.매출 || 0;
    const quantity = row.판매수량 || 0;

    totalImpressions += impressions;
    totalClicks += clicks;
    totalAdCost += adCost;
    totalSales += sales;
    totalQuantity += quantity;

    return {
      ...row,
      노출수: impressions,
      클릭수: clicks,
      광고비: adCost,
      매출: sales,
      판매수량: quantity,
      클릭률: impressions > 0 ? (clicks / impressions) * 100 : 0,
      전환율: clicks > 0 ? (quantity / clicks) * 100 : 0,
      ROAS: adCost > 0 ? (sales / adCost) * 100 : 0,
    };
  });

  return {
    raw: cleanedData,
    summary: {
      totalImpressions,
      totalClicks,
      totalAdCost,
      totalSales,
      totalQuantity,
      avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgCVR: totalClicks > 0 ? (totalQuantity / totalClicks) * 100 : 0,
      avgROAS: totalAdCost > 0 ? (totalSales / totalAdCost) * 100 : 0,
    },
  };
}
