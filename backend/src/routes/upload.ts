import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import upload from '../middleware/upload';
import { UploadService } from '../services/UploadService';
import { ValidationError } from '../errors';
import fs from 'fs';

const router = Router();
const uploadService = new UploadService();

/**
 * POST /api/upload
 * 엑셀 파일을 업로드하고 교과목 데이터를 저장합니다
 */
router.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 파일이 업로드되었는지 확인
    if (!req.file) {
      throw new ValidationError('파일이 업로드되지 않았습니다');
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(req.file.path);

    try {
      // 엑셀 파일 파싱 및 저장
      const result = await uploadService.uploadExcelFile(fileBuffer);

      // 업로드된 파일 삭제 (처리 완료 후)
      fs.unlinkSync(req.file.path);

      res.json(result);
    } catch (error) {
      // 업로드된 파일 삭제 (에러 발생 시)
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/upload-offdays
 * 엑셀 파일을 업로드하고 교관 휴무일 데이터를 저장합니다
 */
router.post('/offdays', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 파일이 업로드되었는지 확인
    if (!req.file) {
      throw new ValidationError('파일이 업로드되지 않았습니다');
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(req.file.path);

    try {
      // 엑셀 파일 파싱 및 저장
      const result = await uploadService.uploadOffDaysExcelFile(fileBuffer);

      // 업로드된 파일 삭제 (처리 완료 후)
      fs.unlinkSync(req.file.path);

      res.json(result);
    } catch (error) {
      // 업로드된 파일 삭제 (에러 발생 시)
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/download-template/offdays
 * 교관 휴무일 업로드용 엑셀 양식 파일을 다운로드합니다
 */
router.get('/download-template/offdays', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templateBuffer = await uploadService.generateOffDaysTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="교관_휴무일_업로드_양식.xlsx"');
    res.send(templateBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * Multer 에러 핸들러
 * 파일 업로드 관련 에러를 전역 에러 핸들러로 전달
 */
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.message && error.message.includes('엑셀 파일만')) {
    next(new ValidationError(error.message));
  } else {
    next(error);
  }
});

export default router;
