import { Request, Response, NextFunction } from 'express';
import { ValidationError, ScheduleGenerationError, NotFoundError, ConflictError } from '../errors';
import { ExcelParseError } from '../services/ExcelParser';
import multer from 'multer';

/**
 * 전역 에러 핸들러 미들웨어
 * 모든 에러를 일관된 형식으로 처리하여 클라이언트에 반환
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 에러 로깅
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Multer 파일 업로드 에러 처리
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message: '파일 크기가 너무 큽니다 (최대 10MB)',
        details: null
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `파일 업로드 오류: ${err.message}`,
      details: null
    });
    return;
  }

  // ValidationError 처리
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
    return;
  }

  // ScheduleGenerationError 처리
  if (err instanceof ScheduleGenerationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
    return;
  }

  // NotFoundError 처리
  if (err instanceof NotFoundError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
    return;
  }

  // ConflictError 처리
  if (err instanceof ConflictError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
    return;
  }

  // ExcelParseError 처리
  if (err instanceof ExcelParseError) {
    res.status(400).json({
      success: false,
      message: err.message,
      details: err.details
    });
    return;
  }

  // 기본 에러 처리
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null
  });
}
