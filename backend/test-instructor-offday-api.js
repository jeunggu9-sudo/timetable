/**
 * Simple test script to verify instructor and off-day API endpoints
 * Run this after starting the server with: node test-instructor-offday-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Instructor and Off-Day API Endpoints\n');

  try {
    // Test 1: GET /api/instructors
    console.log('1️⃣  Testing GET /api/instructors');
    const instructorsResponse = await makeRequest('GET', '/api/instructors');
    console.log(`   Status: ${instructorsResponse.status}`);
    console.log(`   Response:`, JSON.stringify(instructorsResponse.data, null, 2));
    
    if (instructorsResponse.status === 200 && instructorsResponse.data.success) {
      console.log('   ✅ GET /api/instructors works!\n');
    } else {
      console.log('   ❌ GET /api/instructors failed!\n');
      return;
    }

    // Check if we have any instructors
    const instructors = instructorsResponse.data.instructors;
    if (instructors.length === 0) {
      console.log('   ⚠️  No instructors found. Please upload course data first.\n');
      return;
    }

    const testInstructor = instructors[0];
    console.log(`   Using instructor: ${testInstructor.name} (ID: ${testInstructor.id})\n`);

    // Test 2: GET /api/off-days (all)
    console.log('2️⃣  Testing GET /api/off-days (all)');
    const allOffDaysResponse = await makeRequest('GET', '/api/off-days');
    console.log(`   Status: ${allOffDaysResponse.status}`);
    console.log(`   Response:`, JSON.stringify(allOffDaysResponse.data, null, 2));
    
    if (allOffDaysResponse.status === 200 && allOffDaysResponse.data.success) {
      console.log('   ✅ GET /api/off-days works!\n');
    } else {
      console.log('   ❌ GET /api/off-days failed!\n');
      return;
    }

    // Test 3: GET /api/off-days?instructorId=X
    console.log(`3️⃣  Testing GET /api/off-days?instructorId=${testInstructor.id}`);
    const filteredOffDaysResponse = await makeRequest('GET', `/api/off-days?instructorId=${testInstructor.id}`);
    console.log(`   Status: ${filteredOffDaysResponse.status}`);
    console.log(`   Response:`, JSON.stringify(filteredOffDaysResponse.data, null, 2));
    
    if (filteredOffDaysResponse.status === 200 && filteredOffDaysResponse.data.success) {
      console.log('   ✅ GET /api/off-days with filter works!\n');
    } else {
      console.log('   ❌ GET /api/off-days with filter failed!\n');
      return;
    }

    // Test 4: POST /api/off-days
    const testDate = '2025-11-15';
    console.log(`4️⃣  Testing POST /api/off-days (adding off-day for ${testDate})`);
    const createOffDayResponse = await makeRequest('POST', '/api/off-days', {
      instructorId: testInstructor.id,
      date: testDate
    });
    console.log(`   Status: ${createOffDayResponse.status}`);
    console.log(`   Response:`, JSON.stringify(createOffDayResponse.data, null, 2));
    
    if (createOffDayResponse.status === 201 && createOffDayResponse.data.success) {
      console.log('   ✅ POST /api/off-days works!\n');
    } else if (createOffDayResponse.status === 409) {
      console.log('   ℹ️  Off-day already exists (duplicate prevention works!)\n');
    } else {
      console.log('   ❌ POST /api/off-days failed!\n');
      return;
    }

    const createdOffDayId = createOffDayResponse.data.offDay?.id;

    // Test 5: POST /api/off-days (duplicate - should fail)
    console.log(`5️⃣  Testing POST /api/off-days (duplicate - should fail)`);
    const duplicateOffDayResponse = await makeRequest('POST', '/api/off-days', {
      instructorId: testInstructor.id,
      date: testDate
    });
    console.log(`   Status: ${duplicateOffDayResponse.status}`);
    console.log(`   Response:`, JSON.stringify(duplicateOffDayResponse.data, null, 2));
    
    if (duplicateOffDayResponse.status === 409) {
      console.log('   ✅ Duplicate prevention works!\n');
    } else {
      console.log('   ❌ Duplicate prevention failed!\n');
    }

    // Test 6: DELETE /api/off-days/:id
    if (createdOffDayId) {
      console.log(`6️⃣  Testing DELETE /api/off-days/${createdOffDayId}`);
      const deleteOffDayResponse = await makeRequest('DELETE', `/api/off-days/${createdOffDayId}`);
      console.log(`   Status: ${deleteOffDayResponse.status}`);
      console.log(`   Response:`, JSON.stringify(deleteOffDayResponse.data, null, 2));
      
      if (deleteOffDayResponse.status === 200 && deleteOffDayResponse.data.success) {
        console.log('   ✅ DELETE /api/off-days/:id works!\n');
      } else {
        console.log('   ❌ DELETE /api/off-days/:id failed!\n');
      }
    }

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Make sure the server is running on port 5000');
  }
}

runTests();
