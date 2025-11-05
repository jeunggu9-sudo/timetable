import { ExcelParser, ParsedCourse } from './ExcelParser';
import { CourseRepository } from '../repositories/CourseRepository';
import { InstructorRepository } from '../repositories/InstructorRepository';
import { OffDayRepository } from '../repositories/OffDayRepository';
import { Course } from '../types/models';

/**
 * 업로드 결과
 */
export interface UploadResult {
  success: boolean;
  message: string;
  courseCount?: number;
  instructorCount?: number;
  offDayCount?: number;
  instructorOffDays?: InstructorOffDaysSummary[];
}

/**
 * 교관별 휴무일 요약 정보
 */
export interface InstructorOffDaysSummary {
  instructorName: string;
  offDays: {
    date: string;
    reason: string;
  }[];
}

/**
 * 파싱된 교관 휴무일 데이터
 */
interface ParsedOffDay {
  이름: string;
  시작날짜: string;
  종료날짜: string;
  비고: string;
}

/**
 * 엑셀 파일 업로드 및 데이터 저장을 처리하는 서비스
 */
export class UploadService {
  private courseRepository: CourseRepository;
  private instructorRepository: InstructorRepository;
  private offDayRepository: OffDayRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
    this.instructorRepository = new InstructorRepository();
    this.offDayRepository = new OffDayRepository();
  }

  /**
   * 엑셀 파일을 파싱하고 데이터베이스에 저장
   * @param buffer 엑셀 파일 버퍼
   * @returns 업로드 결과
   */
  async uploadExcelFile(buffer: Buffer): Promise<UploadResult> {
    // 1. 엑셀 파일 파싱
    const parsedCourses = ExcelParser.parse(buffer);

    if (parsedCourses.length === 0) {
      return {
        success: false,
        message: '엑셀 파일에 데이터가 없습니다',
        courseCount: 0,
        instructorCount: 0
      };
    }

    // 2. 기존 교과목 데이터 삭제 (새로운 업로드로 대체)
    await this.courseRepository.deleteAll();

    // 3. 교관 목록 추출 및 생성
    const instructorNames = new Set<string>();
    for (const course of parsedCourses) {
      // 여러 교관이 쉼표로 구분되어 있을 수 있음
      const instructors = course.담당교관.split(',').map(name => name.trim());
      instructors.forEach(name => instructorNames.add(name));
    }

    // 교관 자동 생성 (이미 존재하면 재사용)
    const instructorMap = new Map<string, number>();
    for (const name of instructorNames) {
      const instructor = await this.instructorRepository.findOrCreate(name);
      instructorMap.set(name, instructor.id);
    }

    // 4. 교과목 데이터 저장
    let savedCourseCount = 0;

    for (const parsedCourse of parsedCourses) {
      // 여러 교관이 있는 경우 처리
      const instructors = parsedCourse.담당교관.split(',').map(name => name.trim());

      if (instructors.length === 1) {
        // 단일 교관: 그대로 저장
        await this.courseRepository.create({
          구분: parsedCourse.구분,
          과목: parsedCourse.과목,
          시수: parsedCourse.시수,
          담당교관: parsedCourse.담당교관,
          선배정: parsedCourse.선배정,
          평가: parsedCourse.평가,
          excel_order: parsedCourse.excel_order
        });
        savedCourseCount++;
      } else {
        // 여러 교관: 각 교관별로 별도 레코드 생성
        // 시수를 교관 수로 나누어 분배
        const hoursPerInstructor = Math.floor(parsedCourse.시수 / instructors.length);
        const remainder = parsedCourse.시수 % instructors.length;

        for (let i = 0; i < instructors.length; i++) {
          const instructorName = instructors[i];
          // 첫 번째 교관에게 나머지 시수 할당
          const allocatedHours = hoursPerInstructor + (i === 0 ? remainder : 0);

          await this.courseRepository.create({
            구분: parsedCourse.구분,
            과목: parsedCourse.과목,
            시수: allocatedHours,
            담당교관: instructorName,
            선배정: parsedCourse.선배정,
            평가: parsedCourse.평가,
            excel_order: parsedCourse.excel_order
          });
          savedCourseCount++;
        }
      }
    }

    return {
      success: true,
      message: '엑셀 파일이 성공적으로 업로드되었습니다',
      courseCount: savedCourseCount,
      instructorCount: instructorNames.size
    };
  }

  /**
   * 교관 휴무일 엑셀 파일을 파싱하고 데이터베이스에 저장
   * @param buffer 엑셀 파일 버퍼
   * @returns 업로드 결과
   */
  async uploadOffDaysExcelFile(buffer: Buffer): Promise<UploadResult> {
    // 1. 엑셀 파일 파싱 (교관 휴무일용)
    const parsedOffDays = this.parseOffDaysExcel(buffer);

    if (parsedOffDays.length === 0) {
      return {
        success: false,
        message: '엑셀 파일에 데이터가 없습니다',
        offDayCount: 0,
        instructorOffDays: []
      };
    }

    // 2. 교관 휴무일 데이터 저장 및 요약 정보 생성
    let savedOffDayCount = 0;
    let duplicateCount = 0;
    const instructorOffDaysSummary: InstructorOffDaysSummary[] = [];

    for (const offDayData of parsedOffDays) {
      // 교관 찾기 또는 생성
      const instructor = await this.instructorRepository.findOrCreate(offDayData.이름);

      // 교관별 휴무일 목록 초기화
      let instructorSummary = instructorOffDaysSummary.find(s => s.instructorName === instructor.name);
      if (!instructorSummary) {
        instructorSummary = {
          instructorName: instructor.name,
          offDays: []
        };
        instructorOffDaysSummary.push(instructorSummary);
      }

      // 시작날짜부터 종료날짜까지 각 날짜별로 휴무일 생성
      const startDate = new Date(offDayData.시작날짜);
      const endDate = new Date(offDayData.종료날짜);

      for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식

        // 이미 존재하는 휴무일인지 확인
        const existingOffDay = await this.offDayRepository.findByInstructorAndDate(instructor.id, dateStr);
        
        if (!existingOffDay) {
          await this.offDayRepository.create({
            instructor_id: instructor.id,
            date: dateStr,
            reason: offDayData.비고 || ''
          });
          savedOffDayCount++;
        } else {
          duplicateCount++;
        }

        // 요약 정보에는 중복 여부와 관계없이 모든 날짜 추가 (사용자가 업로드한 내용 표시)
        instructorSummary.offDays.push({
          date: dateStr,
          reason: offDayData.비고 || ''
        });
      }
    }

    // 교관별 휴무일을 날짜순으로 정렬하고 중복 제거
    instructorOffDaysSummary.forEach(summary => {
      // 중복 날짜 제거 (같은 날짜가 여러 번 나올 수 있음)
      const uniqueOffDays = summary.offDays.reduce((acc, current) => {
        const existing = acc.find(item => item.date === current.date);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, [] as { date: string; reason: string; }[]);
      
      summary.offDays = uniqueOffDays.sort((a, b) => a.date.localeCompare(b.date));
    });

    // 교관별로 정렬
    instructorOffDaysSummary.sort((a, b) => a.instructorName.localeCompare(b.instructorName));

    const message = duplicateCount > 0 
      ? `교관 휴무일이 성공적으로 업로드되었습니다. (신규: ${savedOffDayCount}일, 중복: ${duplicateCount}일)`
      : `교관 휴무일이 성공적으로 업로드되었습니다. (총 ${savedOffDayCount}일)`;

    return {
      success: true,
      message,
      offDayCount: savedOffDayCount,
      instructorOffDays: instructorOffDaysSummary
    };
  }

  /**
   * 교관 휴무일 엑셀 파일 파싱
   * @param buffer 엑셀 파일 버퍼
   * @returns 파싱된 휴무일 데이터
   */
  private parseOffDaysExcel(buffer: Buffer): ParsedOffDay[] {
    const XLSX = require('xlsx');
    
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      console.log('엑셀 시트명:', sheetName);
      
      // 엑셀 데이터를 JSON으로 변환
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('파싱된 엑셀 데이터:', jsonData);
      
      if (jsonData.length < 2) {
        throw new Error('엑셀 파일에 데이터가 없습니다');
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      console.log('헤더:', headers);
      console.log('데이터 행 수:', dataRows.length);

      // 필수 컬럼 확인 - 더 유연하게 매칭
      const requiredColumns = ['이름', '시작날짜', '종료날짜'];
      const columnIndexes: { [key: string]: number } = {};

      for (const col of requiredColumns) {
        let index = headers.findIndex(header => 
          header && header.toString().trim() === col
        );
        
        // 대체 컬럼명으로 재시도
        if (index === -1) {
          const alternativeNames: { [key: string]: string[] } = {
            '이름': ['성명', '교관명', '교관', '이름'],
            '시작날짜': ['시작일', '시작날짜', '시작', '휴가시작일', '휴가시작'],
            '종료날짜': ['종료일', '종료날짜', '종료', '휴가종료일', '휴가종료']
          };
          
          for (const altName of alternativeNames[col] || []) {
            index = headers.findIndex(header => 
              header && header.toString().trim() === altName
            );
            if (index !== -1) break;
          }
        }
        
        if (index === -1) {
          console.log(`컬럼 '${col}' 찾기 실패. 사용 가능한 헤더:`, headers);
          throw new Error(`필수 컬럼 '${col}'이 없습니다. 사용 가능한 컬럼: ${headers.join(', ')}`);
        }
        columnIndexes[col] = index;
        console.log(`컬럼 '${col}' 인덱스: ${index}`);
      }

      // 비고 컬럼 (선택사항)
      const remarkIndex = headers.findIndex(header => 
        header && (header.toString().trim() === '비고' || 
                  header.toString().trim() === '사유' ||
                  header.toString().trim() === '휴가사유' ||
                  header.toString().trim() === '내용')
      );
      
      console.log('비고 컬럼 인덱스:', remarkIndex);

      const result: ParsedOffDay[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        console.log(`${i + 2}행 데이터:`, row);
        
        // 빈 행 건너뛰기
        if (!row || row.length === 0 || !row[columnIndexes['이름']]) {
          console.log(`${i + 2}행 건너뛰기 (빈 행)`);
          continue;
        }

        try {
          const parsedOffDay: ParsedOffDay = {
            이름: row[columnIndexes['이름']]?.toString().trim() || '',
            시작날짜: this.parseExcelDate(row[columnIndexes['시작날짜']]),
            종료날짜: this.parseExcelDate(row[columnIndexes['종료날짜']]),
            비고: remarkIndex >= 0 ? (row[remarkIndex]?.toString().trim() || '') : ''
          };

          console.log(`${i + 2}행 파싱 결과:`, parsedOffDay);

          // 데이터 검증
          if (!parsedOffDay.이름) {
            throw new Error('교관 이름이 없습니다');
          }

          if (!parsedOffDay.시작날짜 || !parsedOffDay.종료날짜) {
            throw new Error('날짜 정보가 올바르지 않습니다');
          }

          if (new Date(parsedOffDay.시작날짜) > new Date(parsedOffDay.종료날짜)) {
            throw new Error('시작날짜가 종료날짜보다 늦습니다');
          }

          result.push(parsedOffDay);
        } catch (error: any) {
          console.error(`${i + 2}행 처리 중 오류:`, error);
          throw new Error(`${i + 2}행 처리 중 오류: ${error.message}`);
        }
      }

      console.log('최종 파싱 결과:', result);
      return result;
    } catch (error: any) {
      console.error('엑셀 파일 파싱 오류:', error);
      throw new Error(`엑셀 파일 파싱 오류: ${error.message}`);
    }
  }

  /**
   * 엑셀 날짜 값을 YYYY-MM-DD 형식으로 변환
   */
  private parseExcelDate(value: any): string {
    console.log('날짜 파싱 시도:', value, typeof value);
    
    if (!value && value !== 0) {
      throw new Error('날짜 값이 없습니다');
    }

    // 엑셀 시리얼 날짜인 경우 (숫자)
    if (typeof value === 'number') {
      // 엑셀 시리얼 날짜를 JavaScript Date로 변환
      // 엑셀은 1900-01-01을 1로 시작하지만, JavaScript는 1970-01-01을 기준으로 함
      const excelEpoch = new Date(1900, 0, 1); // 1900-01-01
      const jsDate = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
      
      // 1900년 윤년 버그 보정 (엑셀은 1900년을 윤년으로 잘못 처리)
      if (value > 59) {
        jsDate.setTime(jsDate.getTime() - 24 * 60 * 60 * 1000);
      }
      
      const result = jsDate.toISOString().split('T')[0];
      console.log('엑셀 시리얼 날짜 변환 결과:', result);
      return result;
    }

    // 문자열인 경우
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // 다양한 날짜 형식 시도
      const dateFormats = [
        // YYYY-MM-DD
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        // YYYY/MM/DD
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
        // MM/DD/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // DD/MM/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      ];
      
      // 정규식으로 날짜 형식 확인
      for (const format of dateFormats) {
        const match = trimmed.match(format);
        if (match) {
          let year, month, day;
          
          if (format.source.startsWith('^(\\d{4})')) {
            // YYYY-MM-DD 또는 YYYY/MM/DD
            [, year, month, day] = match;
          } else {
            // MM/DD/YYYY 또는 DD/MM/YYYY
            [, month, day, year] = match;
          }
          
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            const result = date.toISOString().split('T')[0];
            console.log('문자열 날짜 변환 결과:', result);
            return result;
          }
        }
      }
      
      // 일반적인 Date 생성자로 시도 (UTC 시간대 사용)
      const date = new Date(trimmed + 'T00:00:00.000Z');
      if (!isNaN(date.getTime())) {
        const result = date.toISOString().split('T')[0];
        console.log('일반 Date 생성자 변환 결과:', result);
        return result;
      }
      
      throw new Error(`올바르지 않은 날짜 형식입니다: ${trimmed}`);
    }

    // Date 객체인 경우
    if (value instanceof Date) {
      const result = value.toISOString().split('T')[0];
      console.log('Date 객체 변환 결과:', result);
      return result;
    }

    throw new Error(`지원하지 않는 날짜 형식입니다: ${typeof value}`);
  }

  /**
   * 교관 휴무일 업로드용 엑셀 양식 파일을 생성합니다
   * @returns 엑셀 파일 버퍼
   */
  async generateOffDaysTemplate(): Promise<Buffer> {
    try {
      const XLSX = require('xlsx');

      // 현재 날짜 기준으로 예시 데이터 생성
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // 양식 데이터 생성
      const templateData = [
        ['이름', '시작날짜', '종료날짜', '비고'],
        ['김교관', formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15)), formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 17)), '개인사유'],
        ['이교관', formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20)), formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20)), '병가'],
        ['박교관', formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 5)), formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 10)), '연차휴가'],
        ['', '', '', ''], // 빈 행 (사용자가 입력할 수 있도록)
        ['', '', '', ''], // 빈 행
        ['', '', '', ''], // 빈 행
        ['', '', '', ''], // 빈 행
        ['', '', '', '']  // 빈 행
      ];

      console.log('Template data created:', templateData);

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      console.log('Worksheet created');

      // 컬럼 너비 설정
      worksheet['!cols'] = [
        { width: 15 }, // 이름
        { width: 15 }, // 시작날짜
        { width: 15 }, // 종료날짜
        { width: 20 }  // 비고
      ];

      // 워크시트를 워크북에 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '교관휴무일');

      console.log('Workbook created with worksheet');

      // 설명 시트 추가
      const instructionData = [
        ['교관 휴무일 업로드 양식 사용법'],
        [''],
        ['1. 컬럼 설명:'],
        ['   - 이름: 교관의 이름을 입력하세요'],
        ['   - 시작날짜: 휴무 시작 날짜 (YYYY-MM-DD 형식)'],
        ['   - 종료날짜: 휴무 종료 날짜 (YYYY-MM-DD 형식)'],
        ['   - 비고: 휴무 사유 (선택사항)'],
        [''],
        ['2. 주의사항:'],
        ['   - 날짜는 YYYY-MM-DD 형식으로 입력하세요 (예: 2024-01-15)'],
        ['   - 시작날짜는 종료날짜보다 이전이어야 합니다'],
        ['   - 시작날짜부터 종료날짜까지 모든 날짜가 휴무일로 등록됩니다'],
        ['   - 이미 등록된 휴무일은 중복 등록되지 않습니다'],
        [''],
        ['3. 예시:'],
        ['   이름: 김교관'],
        ['   시작날짜: 2024-01-15'],
        ['   종료날짜: 2024-01-17'],
        ['   비고: 개인사유'],
        ['   → 2024-01-15, 2024-01-16, 2024-01-17 총 3일이 휴무일로 등록됩니다']
      ];

      const instructionSheet = XLSX.utils.aoa_to_sheet(instructionData);
      
      // 설명 시트 컬럼 너비 설정
      instructionSheet['!cols'] = [{ width: 80 }];

      XLSX.utils.book_append_sheet(workbook, instructionSheet, '사용법');

      console.log('Instruction sheet added');

      // 엑셀 파일을 버퍼로 변환
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      console.log('Excel buffer created, size:', buffer.length);
      
      return buffer;
    } catch (error) {
      console.error('Error generating template:', error);
      throw new Error(`템플릿 생성 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }}
