/**
 * 검증 오류 클래스
 * 사용자 입력이나 비즈니스 규칙 검증 실패 시 사용
 */
export class ValidationError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, details: any = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
    
    // TypeScript에서 Error를 상속할 때 필요
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 시간표 생성 오류 클래스
 * 시간표 자동 생성 중 발생하는 오류
 */
export class ScheduleGenerationError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, details: any = null) {
    super(message);
    this.name = 'ScheduleGenerationError';
    this.statusCode = 500;
    this.details = details;
    
    // TypeScript에서 Error를 상속할 때 필요
    Object.setPrototypeOf(this, ScheduleGenerationError.prototype);
  }
}

/**
 * 리소스를 찾을 수 없을 때 사용하는 오류 클래스
 */
export class NotFoundError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, details: any = null) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.details = details;
    
    // TypeScript에서 Error를 상속할 때 필요
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 충돌 오류 클래스
 * 중복된 데이터나 충돌하는 작업 시 사용
 */
export class ConflictError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, details: any = null) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.details = details;
    
    // TypeScript에서 Error를 상속할 때 필요
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
