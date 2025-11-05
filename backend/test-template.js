const { UploadService } = require('./dist/services/UploadService');

async function testTemplate() {
  try {
    console.log('Testing template generation...');
    const uploadService = new UploadService();
    const buffer = await uploadService.generateOffDaysTemplate();
    console.log('Template generated successfully, buffer size:', buffer.length);
    
    // 파일로 저장
    const fs = require('fs');
    fs.writeFileSync('test-template-output.xlsx', buffer);
    console.log('Template saved to test-template-output.xlsx');
  } catch (error) {
    console.error('Error:', error);
  }
}

testTemplate();