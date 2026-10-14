const API_URL = "https://script.google.com/macros/s/AKfycbwSC7Aq9aeLfiVSFkzWv-WzSUcCLi2s9odl6bY1a2d-hp00QHWP-H9lq1f0n2BdjGp6tQ/exec";
let allQuestions = [];
let currentQuizData = [];
let currentLevelGlobal = "";
let currentTypeGlobal = "";
let currentLessonGlobal = "";

async function fetchQuestions() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        allQuestions = rawData.map(row => {
            let cleanRow = {};
            for (let key in row) {
                let cleanKey = key.trim().toUpperCase();
                cleanRow[cleanKey] = row[key];
            }
            return cleanRow;
        });
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
    }
}

function loadLevel(level) {
    document.getElementById('welcome-section').style.display = 'none';
    const container = document.getElementById('quiz-container');
    container.style.display = 'block';

    if (allQuestions.length === 0) {
        container.innerHTML = '<div class="loading-text">Dữ liệu đang được tải về...</div>';
        return;
    }

    const levelQuestions = allQuestions.filter(q => {
        let capDoSheet = String(q["CẤP ĐỘ"]).replace(/\D/g, ''); 
        return capDoSheet == level;
    });
    
    if (levelQuestions.length === 0) {
        container.innerHTML = `<div class="loading-text">Chưa có dữ liệu cho HSK ${level}.</div>`;
        return;
    }

    const types = [...new Set(levelQuestions.map(q => q["DẠNG BÀI"]).filter(Boolean))];
    let html = `<h2 style="text-align: center; font-weight: 600; color: var(--chu-chinh);">HSK ${level} - Chọn dạng bài luyện tập</h2>
                <div class="type-grid">`;
    types.forEach(type => {
        html += `<button class="type-card" onclick="loadType('${level}', '${type}')">${type}</button>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function loadType(level, type) {
    const container = document.getElementById('quiz-container');
    const typeQuestions = allQuestions.filter(q => {
        let capDoSheet = String(q["CẤP ĐỘ"]).replace(/\D/g, ''); 
        return capDoSheet == level && q["DẠNG BÀI"] === type;
    });

    const lessons = [...new Set(typeQuestions.map(q => q["TÊN BÀI"] || "Bài tập chung").filter(Boolean))];

    let html = `<div style="display:flex; justify-content: space-between; align-items:center; border-bottom: 2px dashed var(--vien-co); padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="font-weight: 600; color: var(--chu-chinh);">${type}</h2>
                    <button onclick="loadLevel('${level}')" class="btn-submit" style="padding: 8px 15px; font-size:15px;">⬅ Quay lại</button>
                </div>
                <div class="type-grid">`;
    lessons.forEach(lesson => {
        html += `<button class="type-card" onclick="loadQuiz('${level}', '${type}', '${lesson}')">${lesson}</button>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function loadQuiz(level, type, lesson) {
    currentLevelGlobal = level;
    currentTypeGlobal = type;
    currentLessonGlobal = lesson;
    const container = document.getElementById('quiz-container');
    
    currentQuizData = allQuestions.filter(q => {
        let capDoSheet = String(q["CẤP ĐỘ"]).replace(/\D/g, ''); 
        let tenBaiSheet = q["TÊN BÀI"] || "Bài tập chung";
        return capDoSheet == level && q["DẠNG BÀI"] === type && tenBaiSheet === lesson;
    });

    let html = `<div style="display:flex; justify-content: space-between; align-items:center; border-bottom: 2px dashed var(--vien-co); padding-bottom: 15px; margin-bottom: 30px;">
                    <h2 style="font-weight: 600; color: var(--thuy-chinh);">${lesson}</h2>
                    <button onclick="loadType('${level}', '${type}')" class="btn-submit" style="padding: 8px 15px; font-size:15px;">⬅ Chọn bài khác</button>
                </div>`;
    
    currentQuizData.forEach((q, index) => {
        let questionContent = '';
        if (type.includes("Sắp xếp câu") || type.includes("Điền từ") || type.includes("Đặt câu")) {
            let words = q["CÂU HỎI"].split('/');
            let wordSpans = words.map(w => `<span class="word-chip">${w.trim()}</span>`).join('');
            questionContent = `
                <div class="words-container">${wordSpans}</div>
                <input type="text" id="ans_${index}" class="answer-input" placeholder="Viết đáp án của bạn vào đây...">
            `;
        } else {
            questionContent = `
                <p class="chinese-text" style="margin-bottom: 15px;">${q["CÂU HỎI"]}</p>
                <ul style="list-style: none;">
                    <li style="padding: 8px 0; font-family: 'Noto Serif SC', serif;"><input type="radio" name="ans_${index}" value="A"> A. ${q["A"] || ""}</li>
                    <li style="padding: 8px 0; font-family: 'Noto Serif SC', serif;"><input type="radio" name="ans_${index}" value="B"> B. ${q["B"] || ""}</li>
                    <li style="padding: 8px 0; font-family: 'Noto Serif SC', serif;"><input type="radio" name="ans_${index}" value="C"> C. ${q["C"] || ""}</li>
                    <li style="padding: 8px 0; font-family: 'Noto Serif SC', serif;"><input type="radio" name="ans_${index}" value="D"> D. ${q["D"] || ""}</li>
                </ul>
            `;
        }

        html += `
            <div class="question-block" id="block_${index}">
                <h4 style="margin-bottom: 15px;">Câu ${index + 1}:</h4>
                ${questionContent}
                <div id="result_${index}" class="result-box"></div>
            </div>
        `;
    });

    html += `
        <div style="background: rgba(255,255,255,0.6); padding: 20px; border-radius: 8px; text-align: center; margin-top: 40px; border: 1px dashed var(--vien-co);">
            <h4 style="margin-bottom: 15px; color: var(--chu-chinh);">Xác nhận nộp bài</h4>
            <input type="text" id="studentName" placeholder="Nhập tên của bạn..." style="padding: 10px; font-size: 16px; border: 1px solid var(--vien-co); border-radius: 4px; width: 60%; margin-bottom: 15px; outline: none;"><br>
            <button class="btn-submit" onclick="submitQuiz()" id="submitBtn">Hoàn tất Khảo thí</button>
            <div id="loading-submit" style="display:none; color: var(--thuy-chinh); margin-top:10px; font-style:italic;">Đang truyền thư báo điểm về Thư Quán...</div>
        </div>
    `;
    container.innerHTML = html;
}

async function submitQuiz() {
    const studentName = document.getElementById('studentName').value.trim();
    if (!studentName) { alert("Vui lòng lưu danh tính (nhập tên) trước khi nộp bài!"); return; }

    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('loading-submit').style.display = 'block';

    let score = 0;
    let total = currentQuizData.length;
    let wrongDetails = []; // Mảng chứa chi tiết câu sai gửi về sheet

    currentQuizData.forEach((q, index) => {
        let isCorrect = false;
        let userAnswer = "";
        let correctAnswer = String(q["ĐÁP ÁN"]).trim();

        if (currentTypeGlobal.includes("Sắp xếp câu") || currentTypeGlobal.includes("Điền từ") || currentTypeGlobal.includes("Đặt câu")) {
            let inputEl = document.getElementById(`ans_${index}`);
            userAnswer = inputEl ? inputEl.value.trim() : "";
            if (userAnswer.replace(/\s+/g, '') === correctAnswer.replace(/\s+/g, '')) {
                isCorrect = true;
            }
        } else {
            let selectedRadio = document.querySelector(`input[name="ans_${index}"]:checked`);
            userAnswer = selectedRadio ? selectedRadio.value : "";
            if (userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                isCorrect = true;
            }
        }

        let resultBox = document.getElementById(`result_${index}`);
        
        if (isCorrect) {
            score++;
            resultBox.innerHTML = `✅ Tuyệt vời! Bạn đã làm đúng.`;
            resultBox.className = "result-box correct";
        } else {
            // Hiển thị ra web cho học sinh xem
            let displayAnswer = userAnswer === "" ? "Chưa làm" : userAnswer;
            resultBox.innerHTML = `❌ Đáp án của bạn: <b>${displayAnswer}</b><br>👉 Đáp án chính xác: <b>${correctAnswer}</b>`;
            resultBox.className = "result-box incorrect";
            
            // Xử lý logic gộp chữ gửi về Google Sheet đúng ý bạn
            if (userAnswer === "") {
                wrongDetails.push(`Câu ${index + 1}: chưa làm (${correctAnswer})`);
            } else {
                wrongDetails.push(`Câu ${index + 1}: ${userAnswer} (${correctAnswer})`);
            }
        }
    });

    const payload = {
        tenHocVien: studentName,
        capDo: `HSK ${currentLevelGlobal} | ${currentTypeGlobal} | ${currentLessonGlobal}`,
        diemSo: `${score}/${total}`,
        chiTiet: wrongDetails.length > 0 ? wrongDetails.join("\n") : ""
    };

    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        document.getElementById('loading-submit').innerHTML = `<b>🎉 Đã nộp bài! Bạn đạt ${score}/${total} điểm.</b>`;
    } catch (error) {
        document.getElementById('loading-submit').innerHTML = `⚠️ Lỗi mạng: Chưa thể lưu lên hệ thống.`;
    }
}

window.onload = fetchQuestions;