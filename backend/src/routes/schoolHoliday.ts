import { Router, Request, Response, NextFunction } from 'express';
import { SchoolHolidayRepository } from '../repositories/SchoolHolidayRepository';
import { ValidationError, NotFoundError } from '../errors';

const router = Router();

/**
 * GET /api/school-holidays
 * 휴관일 조회
 */
router.get('/school-holidays', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const holidayRepo = new SchoolHolidayRepository();

    // 날짜 범위가 제공된 경우
    if (startDate && endDate) {
      const holidays = await holidayRepo.findByDateRange(
        startDate as string,
        endDate as string
      );
      return res.status(200).json({
        success: true,
        holidays
      });
    }

    // 전체 조회
    const holidays = await holidayRepo.findAll();
    return res.status(200).json({
      success: true,
      holidays
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/school-holidays
 * 휴관일 생성
 */
router.post('/school-holidays', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, startPeriod, endPeriod, description } = req.body;

    // 필수 파라미터 검증
    if (!date) {
      throw new ValidationError('날짜(date)가 필요합니다.');
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new ValidationError('날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용하세요.');
    }

    // 유효한 날짜인지 확인
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new ValidationError('유효하지 않은 날짜입니다.');
    }

    // 교시 검증
    if (startPeriod !== null && startPeriod !== undefined) {
      if (typeof startPeriod !== 'number' || startPeriod < 1 || startPeriod > 9) {
        throw new ValidationError('시작 교시는 1-9 사이의 숫자여야 합니다.');
      }
    }

    if (endPeriod !== null && endPeriod !== undefined) {
      if (typeof endPeriod !== 'number' || endPeriod < 1 || endPeriod > 9) {
        throw new ValidationError('종료 교시는 1-9 사이의 숫자여야 합니다.');
      }
    }

    if (startPeriod && endPeriod && startPeriod > endPeriod) {
      throw new ValidationError('시작 교시가 종료 교시보다 클 수 없습니다.');
    }

    const holidayRepo = new SchoolHolidayRepository();
    const holiday = await holidayRepo.create(
      date,
      startPeriod ?? null,
      endPeriod ?? null,
      description ?? null
    );

    return res.status(201).json({
      success: true,
      holiday
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/school-holidays/:id
 * 휴관일 삭제
 */
router.delete('/school-holidays/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const holidayRepo = new SchoolHolidayRepository();
    const deleted = await holidayRepo.delete(Number(id));

    if (!deleted) {
      throw new NotFoundError('휴관일을 찾을 수 없습니다.');
    }

    return res.status(200).json({
      success: true,
      message: '휴관일이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
