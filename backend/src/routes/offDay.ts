import { Router, Request, Response, NextFunction } from 'express';
import { OffDayRepository } from '../repositories/OffDayRepository';
import { InstructorRepository } from '../repositories/InstructorRepository';
import { ValidationError, NotFoundError, ConflictError } from '../errors';

const router = Router();

/**
 * GET /api/off-days
 * 휴무일 조회 (교관별 필터링 지원)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instructorId } = req.query;
    const offDayRepo = new OffDayRepository();

    // 교관별 필터링
    if (instructorId) {
      const id = Number(instructorId);
      
      if (isNaN(id)) {
        throw new ValidationError('instructorId는 숫자여야 합니다.');
      }

      const offDays = await offDayRepo.findByInstructorWithDetails(id);
      return res.status(200).json({
        success: true,
        offDays
      });
    }

    // 전체 휴무일 조회
    const offDays = await offDayRepo.findAll();
    return res.status(200).json({
      success: true,
      offDays
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/off-days
 * 휴무일 추가
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instructorId, date } = req.body;

    // 필수 파라미터 검증
    if (!instructorId || !date) {
      throw new ValidationError('필수 파라미터가 누락되었습니다. (instructorId, date)');
    }

    // 데이터 타입 검증
    if (typeof instructorId !== 'number') {
      throw new ValidationError('instructorId는 숫자여야 합니다.');
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

    const instructorRepo = new InstructorRepository();
    const offDayRepo = new OffDayRepository();

    // 교관 존재 확인
    const instructor = await instructorRepo.findById(instructorId);
    if (!instructor) {
      throw new NotFoundError('교관을 찾을 수 없습니다.');
    }

    // 중복 휴무일 확인
    const isDuplicate = await offDayRepo.isInstructorOffDay(instructorId, date);
    if (isDuplicate) {
      throw new ConflictError('해당 날짜에 이미 휴무일이 등록되어 있습니다.');
    }

    // 휴무일 생성
    const offDay = await offDayRepo.create({
      instructor_id: instructorId,
      date: date
    });

    return res.status(201).json({
      success: true,
      offDay
    });
  } catch (error) {
    // SQLite UNIQUE 제약조건 위반 처리
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      next(new ConflictError('해당 날짜에 이미 휴무일이 등록되어 있습니다.'));
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/off-days/:id
 * 휴무일 삭제
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const offDayRepo = new OffDayRepository();

    // 휴무일 존재 확인
    const existing = await offDayRepo.findById(Number(id));
    if (!existing) {
      throw new NotFoundError('휴무일을 찾을 수 없습니다.');
    }

    // 휴무일 삭제
    const deleted = await offDayRepo.delete(Number(id));

    if (!deleted) {
      throw new NotFoundError('휴무일을 찾을 수 없습니다.');
    }

    return res.status(200).json({
      success: true,
      message: '휴무일이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
