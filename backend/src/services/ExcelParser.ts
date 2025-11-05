import * as XLSX from 'xlsx';
import { Course } from '../types/models';

/**
 * 엑셀 파일 파싱 중 발생하는 에러
 */
export class ExcelParseError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ExcelParseError';
  }
}

/**
 * 파싱된 교과목 데이터 (DB 저장 전)
 */
export interface ParsedCourse {
  구분: string;
  과목: string;
  시수: number;
  담당교관: string;
  선배정: 1 | 2;
  평가: string;
  excel_order: number;
}

/**
 * 엑셀 파일을 파싱하여 교과목 데이터를 추출하는 서비스
 */
export class ExcelParser {
  private static readonly REQUIRED_COLUMNS = [
    '구분',
    '과목',
    '시수',
    '담당교관',
    '선배정',
    '평가'
  ];

  /**
   * 엑셀 파일 버퍼를 파싱하여 교과목 배열로 변환
   * @param buffer 엑셀 파일 버퍼
   * @returns 파싱된 교과목 배열
   */
  static parse(buffer: Buffer): ParsedCourse[] {
    try {
      // 엑셀 파일 읽기
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // 첫 번째 시트 가져오기
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new ExcelParseError('엑셀 파일에 시트가 없습니다');
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // 시트를 JSON으로 변환
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
      
      if (rawData.length === 0) {
        throw new ExcelParseError('엑셀 파일에 데이터가 없습니다');
      }

      // 필수 컬럼 검증
      this.validateColumns(rawData[0]);

      // 데이터 파싱 및 검증
      const parsedCourses: ParsedCourse[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2; // 엑셀 행 번호 (헤더 포함)

        try {
          const parsedCourse = this.parseRow(row, i + 1);
          parsedCourses.push(parsedCourse);
        } catch (error) {
          if (error instanceof ExcelParseError) {
            throw new ExcelParseError(
              `${rowNumber}행 오류: ${error.message}`,
              { row: rowNumber, ...error.details }
            );
          }
          throw error;
        }
      }

      return parsedCourses;
    } catch (error) {
      if (error instanceof ExcelParseError) {
        throw error;
      }
      throw new ExcelParseError(
        '엑셀 파일을 읽을 수 없습니다',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 필수 컬럼이 모두 존재하는지 검증
   */
  private static validateColumns(firstRow: any): void {
    const missingColumns: string[] = [];

    for (const column of this.REQUIRED_COLUMNS) {
      if (!(column in firstRow)) {
        missingColumns.push(column);
      }
    }

    if (missingColumns.length > 0) {
      throw new ExcelParseError(
        '필수 컬럼이 누락되었습니다',
        { missingColumns }
      );
    }
  }

  /**
   * 개별 행을 파싱하여 ParsedCourse 객체로 변환
   */
  private static parseRow(row: any, excelOrder: number): ParsedCourse {
    // 구분 검증
    const 구분 = this.validateString(row['구분'], '구분');

    // 과목 검증
    const 과목 = this.validateString(row['과목'], '과목');

    // 시수 검증 (양의 정수)
    const 시수 = this.validatePositiveInteger(row['시수'], '시수');

    // 담당교관 검증
    const 담당교관 = this.validateString(row['담당교관'], '담당교관');

    // 선배정 검증 (1 또는 2)
    const 선배정 = this.validatePreAssignment(row['선배정']);

    // 평가 검증
    const 평가 = this.validateString(row['평가'], '평가');

    return {
      구분,
      과목,
      시수,
      담당교관,
      선배정,
      평가,
      excel_order: excelOrder
    };
  }

  /**
   * 문자열 필드 검증
   */
  private static validateString(value: any, fieldName: string): string {
    if (value === undefined || value === null || value === '') {
      throw new ExcelParseError(`${fieldName} 값이 비어있습니다`);
    }

    return String(value).trim();
  }

  /**
   * 양의 정수 검증
   */
  private static validatePositiveInteger(value: any, fieldName: string): number {
    const num = Number(value);

    if (isNaN(num)) {
      throw new ExcelParseError(
        `${fieldName} 값이 숫자가 아닙니다`,
        { value }
      );
    }

    if (!Number.isInteger(num)) {
      throw new ExcelParseError(
        `${fieldName} 값이 정수가 아닙니다`,
        { value }
      );
    }

    if (num <= 0) {
      throw new ExcelParseError(
        `${fieldName} 값은 양의 정수여야 합니다`,
        { value }
      );
    }

    return num;
  }

  /**
   * 선배정 값 검증 (1 또는 2)
   */
  private static validatePreAssignment(value: any): 1 | 2 {
    const num = Number(value);

    if (isNaN(num)) {
      throw new ExcelParseError(
        '선배정 값이 숫자가 아닙니다',
        { value }
      );
    }

    if (num !== 1 && num !== 2) {
      throw new ExcelParseError(
        '선배정 값은 1 또는 2여야 합니다',
        { value }
      );
    }

    return num as 1 | 2;
  }
}
