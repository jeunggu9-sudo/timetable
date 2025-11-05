import { Router, Request, Response, NextFunction } from 'express';
import { CourseRepository } from '../repositories/CourseRepository';
import { InstructorRepository } from '../repositories/InstructorRepository';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { OffDayRepository } from '../repositories/OffDayRepository';
import { ScheduleGenerator } from '../services/ScheduleGenerator';
import { PreAssignmentValidator } from '../services/PreAssignmentValidator';
import { ScheduleModificationValidator } from '../services/ScheduleModificationValidator';
import { EvaluationDisplayService } from '../services/EvaluationDisplayService';
import { ValidationError, ScheduleGenerationError, NotFoundError } from '../errors';

const router = Router();

/**
 * POST /api/generate-schedule
 * 시간표 자동 생성
 */
router.post('/generate-schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate } = req.body;

    // 시작 날짜 파라미터 검증
    if (!startDate) {
      throw new ValidationError('시작 날짜(startDate)가 필요합니다.');
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      throw new ValidationError('날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용하세요.');
    }

    // 유효한 날짜인지 확인
    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      throw new ValidationError('유효하지 않은 날짜입니다.');
    }

    // ScheduleGenerator 서비스 호출
    const courseRepo = new CourseRepository();
    const instructorRepo = new InstructorRepository();
    const scheduleRepo = new ScheduleRepository();
    const offDayRepo = new OffDayRepository();

    const generator = new ScheduleGenerator(
      courseRepo,
      instructorRepo,
      scheduleRepo,
      offDayRepo
    );

    const result = await generator.generateSchedule(startDate);

    // 생성 결과 반환
    if (result.success) {
      return res.status(200).json(result);
    } else {
      throw new ScheduleGenerationError(result.message, { errors: result.errors });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/schedules
 * 시간표 조회
 * Query Parameters:
 *   - startDate: YYYY-MM-DD (optional)
 *   - endDate: YYYY-MM-DD (optional)
 *   - instructorId: number (optional)
 *   - displayFormat: 'true' | 'false' (optional) - true일 경우 연관된 Course의 평가 필드를 "평가"/"무시험"으로 변환
 */
router.get('/schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, instructorId, displayFormat } = req.query;

    const scheduleRepo = new ScheduleRepository();
    const shouldDisplayFormat = displayFormat === 'true';

    let schedules;

    // 교관별 조회
    if (instructorId) {
      schedules = await scheduleRepo.findByInstructorWithDetails(
        Number(instructorId),
        startDate as string | undefined,
        endDate as string | undefined
      );
    }
    // 날짜 범위가 제공된 경우
    else if (startDate && endDate) {
      schedules = await scheduleRepo.findByDateRangeWithDetails(
        startDate as string,
        endDate as string
      );
    }
    // 날짜 범위가 없으면 전체 조회 (details 포함)
    else {
      schedules = await scheduleRepo.findAllWithDetails();
    }

    // displayFormat이 true인 경우 평가 필드를 사용자 친화적 형태로 변환
    const responseSchedules = shouldDisplayFormat 
      ? EvaluationDisplayService.formatSchedulesForDisplay(schedules)
      : schedules;

    return res.status(200).json({
      success: true,
      schedules: responseSchedules
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/schedules
 * 선배정 일정 생성
 */
router.post('/schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, instructorId, date, startPeriod, endPeriod } = req.body;

    // 필수 파라미터 검증
    if (!courseId || !instructorId || !date || startPeriod === undefined || endPeriod === undefined) {
      throw new ValidationError('필수 파라미터가 누락되었습니다. (courseId, instructorId, date, startPeriod, endPeriod)');
    }

    // 데이터 타입 검증
    if (typeof courseId !== 'number' || typeof instructorId !== 'number' || 
        typeof startPeriod !== 'number' || typeof endPeriod !== 'number') {
      throw new ValidationError('courseId, instructorId, startPeriod, endPeriod는 숫자여야 합니다.');
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

    const courseRepo = new CourseRepository();
    const scheduleRepo = new ScheduleRepository();
    const offDayRepo = new OffDayRepository();

    // 선배정 검증 로직 호출
    const validator = new PreAssignmentValidator(courseRepo, scheduleRepo, offDayRepo);
    const validationResult = await validator.validatePreAssignment(
      courseId,
      instructorId,
      date,
      startPeriod,
      endPeriod
    );

    if (!validationResult.valid) {
      throw new ValidationError(validationResult.message || '선배정 검증에 실패했습니다.');
    }

    // 데이터베이스에 저장 (is_pre_assigned = true)
    const schedule = await scheduleRepo.create({
      course_id: courseId,
      instructor_id: instructorId,
      date,
      start_period: startPeriod,
      end_period: endPeriod,
      is_pre_assigned: true,
      is_exam: false
    });

    return res.status(201).json({
      success: true,
      schedule
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/schedules/:id
 * 일정 수정
 */
router.put('/schedules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date, startPeriod, endPeriod } = req.body;

    // 필수 파라미터 검증
    if (!date || startPeriod === undefined || endPeriod === undefined) {
      throw new ValidationError('필수 파라미터가 누락되었습니다. (date, startPeriod, endPeriod)');
    }

    // 데이터 타입 검증
    if (typeof startPeriod !== 'number' || typeof endPeriod !== 'number') {
      throw new ValidationError('startPeriod와 endPeriod는 숫자여야 합니다.');
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

    const scheduleRepo = new ScheduleRepository();
    const offDayRepo = new OffDayRepository();

    // 일정 존재 확인
    const existing = await scheduleRepo.findById(Number(id));
    if (!existing) {
      throw new NotFoundError('일정을 찾을 수 없습니다.');
    }

    // 검증 로직 호출
    const validator = new ScheduleModificationValidator(scheduleRepo, offDayRepo);
    const validationResult = await validator.validateScheduleModification(
      Number(id),
      date,
      startPeriod,
      endPeriod
    );

    if (!validationResult.valid) {
      throw new ValidationError(validationResult.message || '일정 수정 검증에 실패했습니다.');
    }

    // 데이터베이스 업데이트
    const updated = await scheduleRepo.update(Number(id), {
      date,
      start_period: startPeriod,
      end_period: endPeriod
    });

    return res.status(200).json({
      success: true,
      schedule: updated
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/schedules/:id
 * 일정 삭제
 */
router.delete('/schedules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const scheduleRepo = new ScheduleRepository();

    const deleted = await scheduleRepo.delete(Number(id));

    if (!deleted) {
      throw new NotFoundError('일정을 찾을 수 없습니다.');
    }

    return res.status(200).json({
      success: true,
      message: '일정이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
