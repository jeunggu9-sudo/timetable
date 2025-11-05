import { Router, Request, Response, NextFunction } from 'express';
import { CourseRepository } from '../repositories/CourseRepository';
import { EvaluationDisplayService } from '../services/EvaluationDisplayService';

const router = Router();

/**
 * GET /api/courses
 * 교과목 목록 조회
 * Query Parameters:
 *   - preAssignment: 1 | 2 (optional) - 선배정 값으로 필터링
 *   - displayFormat: 'true' | 'false' (optional) - true일 경우 평가 필드를 "평가"/"무시험"으로 변환
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { preAssignment, displayFormat } = req.query;
    const courseRepo = new CourseRepository();

    let courses;
    if (preAssignment) {
      const preAssignmentValue = parseInt(preAssignment as string);
      if (preAssignmentValue !== 1 && preAssignmentValue !== 2) {
        return res.status(400).json({
          success: false,
          message: 'preAssignment 값은 1 또는 2여야 합니다.'
        });
      }
      courses = await courseRepo.findByPreAssignment(preAssignmentValue as 1 | 2);
    } else {
      courses = await courseRepo.findAll();
    }

    // displayFormat이 true인 경우 평가 필드를 사용자 친화적 형태로 변환
    const shouldDisplayFormat = displayFormat === 'true';
    const responseCourses = shouldDisplayFormat 
      ? EvaluationDisplayService.formatCoursesForDisplay(courses)
      : courses;

    return res.status(200).json({
      success: true,
      courses: responseCourses
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/courses/:id
 * 특정 교과목 조회
 * Query Parameters:
 *   - displayFormat: 'true' | 'false' (optional) - true일 경우 평가 필드를 "평가"/"무시험"으로 변환
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { displayFormat } = req.query;
    const courseRepo = new CourseRepository();
    
    const course = await courseRepo.findById(parseInt(id));
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '교과목을 찾을 수 없습니다.'
      });
    }

    // displayFormat이 true인 경우 평가 필드를 사용자 친화적 형태로 변환
    const shouldDisplayFormat = displayFormat === 'true';
    const responseCourse = shouldDisplayFormat 
      ? EvaluationDisplayService.formatCourseForDisplay(course)
      : course;

    return res.status(200).json({
      success: true,
      course: responseCourse
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/courses
 * 교과목 추가
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 구분, 과목, 시수, 담당교관, 선배정, 평가, excel_order } = req.body;

    // Validation
    if (!구분 || !과목 || !시수 || !담당교관 || !선배정 || !평가) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.'
      });
    }

    if (선배정 !== 1 && 선배정 !== 2) {
      return res.status(400).json({
        success: false,
        message: '선배정 값은 1 또는 2여야 합니다.'
      });
    }

    if (시수 <= 0) {
      return res.status(400).json({
        success: false,
        message: '시수는 양수여야 합니다.'
      });
    }

    const courseRepo = new CourseRepository();
    const course = await courseRepo.create({
      구분,
      과목,
      시수: parseInt(시수),
      담당교관,
      선배정,
      평가,
      excel_order: excel_order || 999
    });

    return res.status(201).json({
      success: true,
      message: '교과목이 추가되었습니다.',
      course
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/courses/:id
 * 교과목 수정
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { 구분, 과목, 시수, 담당교관, 선배정, 평가, excel_order } = req.body;

    const courseRepo = new CourseRepository();
    
    // Check if course exists
    const existingCourse = await courseRepo.findById(parseInt(id));
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: '교과목을 찾을 수 없습니다.'
      });
    }

    // Validation
    if (선배정 && 선배정 !== 1 && 선배정 !== 2) {
      return res.status(400).json({
        success: false,
        message: '선배정 값은 1 또는 2여야 합니다.'
      });
    }

    if (시수 && 시수 <= 0) {
      return res.status(400).json({
        success: false,
        message: '시수는 양수여야 합니다.'
      });
    }

    await courseRepo.update(parseInt(id), {
      구분,
      과목,
      시수: 시수 ? parseInt(시수) : undefined,
      담당교관,
      선배정,
      평가,
      excel_order
    });

    const updatedCourse = await courseRepo.findById(parseInt(id));

    return res.status(200).json({
      success: true,
      message: '교과목이 수정되었습니다.',
      course: updatedCourse
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/courses/:id
 * 교과목 삭제
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const courseRepo = new CourseRepository();
    
    // Check if course exists
    const existingCourse = await courseRepo.findById(parseInt(id));
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: '교과목을 찾을 수 없습니다.'
      });
    }

    await courseRepo.delete(parseInt(id));

    return res.status(200).json({
      success: true,
      message: '교과목이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
