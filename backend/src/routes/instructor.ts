import { Router, Request, Response, NextFunction } from 'express';
import { InstructorRepository } from '../repositories/InstructorRepository';
import { UploadService } from '../services/UploadService';
import multer from 'multer';

const router = Router();

// Multer 설정 (메모리 저장)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // Excel 파일만 허용
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Excel 파일만 업로드 가능합니다.'));
    }
  }
});

/**
 * GET /api/instructors
 * 모든 교관 조회
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructorRepo = new InstructorRepository();
    const instructors = await instructorRepo.findAll();

    return res.status(200).json({
      success: true,
      instructors
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/instructors/upload-off-days
 * 교관 휴무일 엑셀 파일 업로드
 */
router.post('/upload-off-days', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '파일이 업로드되지 않았습니다.'
      });
    }

    const uploadService = new UploadService();
    const result = await uploadService.uploadOffDaysExcelFile(req.file.buffer);

    return res.status(200).json(result);
  } catch (error) {
    console.error('교관 휴무일 업로드 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/instructors/off-days-template
 * 교관 휴무일 업로드 템플릿 다운로드
 */
router.get('/off-days-template', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = require('path');
    const fs = require('fs');
    
    // 정적 파일 경로
    const templatePath = path.join(__dirname, '../../uploads/instructor-offdays-template.xlsx');
    
    // 파일 존재 확인
    if (!fs.existsSync(templatePath)) {
      // 파일이 없으면 동적으로 생성
      const uploadService = new UploadService();
      const templateBuffer = await uploadService.generateOffDaysTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="instructor-offdays-template.xlsx"');
      
      return res.send(templateBuffer);
    }
    
    // 정적 파일 제공
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="instructor-offdays-template.xlsx"');
    
    return res.sendFile(templatePath);
  } catch (error) {
    console.error('템플릿 다운로드 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '템플릿 파일 다운로드 중 오류가 발생했습니다.'
    });
  }
});

export default router;
