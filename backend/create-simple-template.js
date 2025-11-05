const XLSX = require('xlsx');
const fs = require('fs');

try {
  console.log('Creating simple template...');
  
  // 양식 데이터 생성
  const templateData = [
    ['이름', '시작날짜', '종료날짜', '비고'],
    ['김교관', '2024-12-15', '2024-12-17', '개인사유'],
    ['이교관', '2024-12-20', '2024-12-20', '병가'],
    ['박교관', '2025-01-05', '2025-01-10', '연차휴가'],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', '']
  ];

  console.log('Template data:', templateData);

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

  console.log('Workbook created');

  // 엑셀 파일을 버퍼로 변환
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  console.log('Excel buffer created, size:', buffer.length);
  
  // 파일로 저장
  fs.writeFileSync('instructor-offdays-template.xlsx', buffer);
  console.log('Template saved successfully!');
  
} catch (error) {
  console.error('Error:', error);
}