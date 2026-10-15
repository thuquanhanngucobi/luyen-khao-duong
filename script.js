const API_URL = "https://script.google.com/macros/s/AKfycbwSC7Aq9aeLfiVSFkzWv-WzSUcCLi2s9odl6bY1a2d-hp00QHWP-H9lq1f0n2BdjGp6tQ/exec";
let allQuestions = [];
let currentQuizData = [];
let currentLevelGlobal = "";
let currentTypeGlobal = "";
let currentLessonGlobal = "";
// HÀM ĐÓNG MỞ MENU TRÊN ĐIỆN THOẠI
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    // Khi sidebar mở, màng che cũng sẽ hiện nhờ CSS
}
// HÀM AI ĐỌC TIẾNG TRUNG TỰ ĐỘNG
function speakChinese(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Dừng câu trước đó nếu đang đọc
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'zh-CN'; // Giọng Trung Quốc chuẩn
        msg.rate = 0.9; // Tốc độ đọc vừa phải
        window.speechSynthesis.speak(msg);
    } else {
        alert("Trình duyệt của bạn không hỗ trợ âm thanh. Hãy dùng Google Chrome hoặc Safari.");
    }
}

async function fetchQuestions() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        allQuestions = rawData.map(row => {
            let cleanRow = {};
            for (let key in row) {
                cleanRow[key.trim().toUpperCase()] = row[key];
            }
            return cleanRow;
        });
    } catch (error) { console.error("Lỗi:", error); }
}

function loadLevel(level) {
    // Ẩn menu đi nếu đang dùng điện thoại
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
    
    document.getElementById('welcome-section').style.display = 'none';
    const container = document.getElementById('quiz-container');
    container.style.display = 'block';

    // ... (Phần còn lại của hàm loadLevel giữ nguyên)
    if (allQuestions.length === 0) { container.innerHTML = '<div class="loading-text">Đang kết nối...</div>'; return; }
    
    const levelQuestions = allQuestions.filter(q => String(q["CẤP ĐỘ"]).replace(/\D/g, '') == level);
    if (levelQuestions.length === 0) { container.innerHTML = `<div class="loading-text">Chưa có dữ liệu.</div>`; return; }

    const types = [...new Set(levelQuestions.map(q => q["DẠNG BÀI"]).filter(Boolean))];
    let html = `<h2 class="center-title">HSK ${level}</h2><div class="type-grid">`;
    types.forEach(type => html += `<button class="type-card" onclick="loadType('${level}', '${type}')">${type}</button>`);
    container.innerHTML = html + `</div>`;
}

function loadType(level, type) {
    const typeQuestions = allQuestions.filter(q => String(q["CẤP ĐỘ"]).replace(/\D/g, '') == level && q["DẠNG BÀI"] === type);
    const lessons = [...new Set(typeQuestions.map(q => q["TÊN BÀI"] || "Bài tập chung").filter(Boolean))];
    
    let html = `<div style="display:flex; justify-content: space-between; margin-bottom: 20px;">
                    <h2 class="center-title">${type}</h2>
                    <button onclick="loadLevel('${level}')" class="btn-submit" style="padding: 5px 15px;">⬅ Quay lại</button>
                </div><div class="type-grid">`;
    lessons.forEach(lesson => html += `<button class="type-card" onclick="loadQuiz('${level}', '${type}', '${lesson}')">${lesson}</button>`);
    document.getElementById('quiz-container').innerHTML = html + `</div>`;
}

function loadQuiz(level, type, lesson) {
    currentLevelGlobal = level; currentTypeGlobal = type; currentLessonGlobal = lesson;
    const container = document.getElementById('quiz-container');
    currentQuizData = allQuestions.filter(q => String(q["CẤP ĐỘ"]).replace(/\D/g, '') == level && q["DẠNG BÀI"] === type && (q["TÊN BÀI"] || "Bài tập chung") === lesson);

    let html = `<div style="display:flex; justify-content: space-between; margin-bottom: 20px;">
                    <h2 style="color: var(--thuy-chinh); font-weight: bold;">${lesson}</h2>
                    <button onclick="loadType('${level}', '${type}')" class="btn-submit" style="padding: 5px 15px;">⬅ Trở lại</button>
                </div>`;
    
    let lastPassage = "";
    
    // Nếu là dạng NỐI, ta render kiểu Dropdown để đơn giản hóa giao diện học viên trên cả máy tính lẫn điện thoại
    let isMatching = type.toLowerCase().includes("nối");
    let rightColumnAnswers = [];
    if (isMatching) {
        rightColumnAnswers = currentQuizData.map(q => q["ĐÁP ÁN"]).sort(() => Math.random() - 0.5); // Xáo trộn vế phải
    }

    currentQuizData.forEach((q, index) => {
        // Xử lý Đoạn văn chung & Ảnh chung
        let currentPassage = q["ĐOẠN VĂN CHUNG"] ? String(q["ĐOẠN VĂN CHUNG"]).trim() : "";
        if (currentPassage !== "" && currentPassage !== lastPassage) {
            html += `<div class="passage-box"><div class="passage-label">📖 Nội dung:</div><div class="passage-text">${currentPassage.replace(/\n/g, '<br>')}</div></div>`;
            lastPassage = currentPassage;
        }
        
        let mediaHtml = q["MEDIA"] ? `<img src="${q["MEDIA"]}" class="question-image" alt="Hình ảnh bài tập">` : "";
        let cauHoiText = q["CÂU HỎI"] ? String(q["CÂU HỎI"]).trim() : "";
        let hasOptions = q["A"] || q["B"] || q["C"] || q["D"];
        let isAudioType = type.toLowerCase().includes("nghe");
        
        let questionContent = '';

        if (isMatching) {
            // DẠNG 3 & 5: NỐI (Hiển thị Vế trái và Dropdown chọn Vế phải)
            questionContent = `
                <div style="display:flex; align-items:center; gap: 15px;">
                    <button class="btn-audio" onclick="speakChinese('${cauHoiText}')">🔊 Nghe</button>
                    <span class="chinese-text">${cauHoiText}</span>
                </div>
                <select id="ans_${index}" class="match-select">
                    <option value="">-- Chọn đáp án để ghép nối --</option>
                    ${rightColumnAnswers.map(ans => `<option value="${ans}">${ans}</option>`).join('')}
                </select>
            `;
        } 
        else if (isAudioType) {
            // DẠNG 1, 2, 6: NGHE (Ẩn text câu hỏi, chỉ hiện loa)
            questionContent = `${mediaHtml}
                <div style="margin-bottom: 15px;">
                    <button class="btn-audio" onclick="speakChinese('${cauHoiText}')">🔊 Bấm để nghe câu hỏi</button>
                </div>
            `;
            if (hasOptions) {
                questionContent += `<ul style="list-style: none;">`;
                ['A', 'B', 'C', 'D'].forEach(opt => {
                    if (q[opt]) questionContent += `<li class="mcq-option"><input type="radio" name="ans_${index}" value="${opt}"> ${opt}. ${q[opt]}</li>`;
                });
                questionContent += `</ul>`;
            } else {
                questionContent += `<input type="text" id="ans_${index}" class="answer-input" placeholder="Nghe và gõ đáp án vào đây...">`;
            }
        } 
        else if (type.toLowerCase().includes("đặt câu")) {
            // DẠNG 4: NHÌN TRANH ĐẶT CÂU (Tự luận hoàn toàn)
            questionContent = `${mediaHtml}
                <p class="chinese-text">${cauHoiText}</p>
                <textarea id="ans_${index}" class="answer-input" rows="3" placeholder="Viết câu của bạn vào đây..."></textarea>
            `;
        } 
        else {
            // CÁC DẠNG BÌNH THƯỜNG (Điền từ, trắc nghiệm)
            questionContent = mediaHtml;
            if (!hasOptions) {
                let words = cauHoiText.split('/');
                questionContent += words.length > 1 
                    ? `<div class="words-container">${words.map(w => `<span class="word-chip">${w.trim()}</span>`).join('')}</div>`
                    : `<p class="chinese-text" style="margin-bottom: 15px;">${cauHoiText}</p>`;
                questionContent += `<input type="text" id="ans_${index}" class="answer-input" placeholder="Viết đáp án...">`;
            } else {
                questionContent += `<p class="chinese-text" style="margin-bottom: 15px;">${cauHoiText}</p><ul style="list-style: none;">`;
                ['A', 'B', 'C', 'D'].forEach(opt => {
                    if (q[opt]) questionContent += `<li class="mcq-option"><input type="radio" name="ans_${index}" value="${opt}"> ${opt}. ${q[opt]}</li>`;
                });
                questionContent += `</ul>`;
            }
        }

        html += `<div class="question-block" id="block_${index}"><h4 style="margin-bottom: 15px; color: var(--thuy-chinh);">Câu ${index + 1}:</h4>${questionContent}<div id="result_${index}" class="result-box"></div></div>`;
    });

    html += `<div style="background: rgba(255,255,255,0.8); padding: 20px; border-radius: 8px; text-align: center; border: 1px dashed var(--vien-co);">
                <h4>Xác nhận nộp bài</h4>
                <input type="text" id="studentName" placeholder="Nhập tên..." style="padding:10px; width:60%; margin-bottom:15px; border:1px solid #ccc; border-radius:4px;"><br>
                <button class="btn-submit" onclick="submitQuiz()" id="submitBtn">Nộp bài</button>
                <div id="loading-submit" style="display:none; color: var(--thuy-chinh); margin-top:10px;">Đang gửi kết quả...</div>
            </div>`;
    container.innerHTML = html;
}

async function submitQuiz() {
    const studentName = document.getElementById('studentName').value.trim();
    if (!studentName) { alert("Vui lòng nhập tên!"); return; }

    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('loading-submit').style.display = 'block';

    let score = 0;
    let total = 0; // Đếm số câu có chấm điểm
    let wrongDetails = []; 

    currentQuizData.forEach((q, index) => {
        let userAnswer = "";
        let correctAnswer = String(q["ĐÁP ÁN"] || "").trim();
        let isMatching = currentTypeGlobal.toLowerCase().includes("nối");
        let isWriting = currentTypeGlobal.toLowerCase().includes("đặt câu");
        let hasOptions = q["A"] || q["B"] || q["C"] || q["D"];
        let resultBox = document.getElementById(`result_${index}`);

        // Lấy đáp án của HS
        if (isMatching || !hasOptions) {
            let inputEl = document.getElementById(`ans_${index}`);
            userAnswer = inputEl ? inputEl.value.trim() : "";
        } else {
            let selectedRadio = document.querySelector(`input[name="ans_${index}"]:checked`);
            userAnswer = selectedRadio ? selectedRadio.value : "";
        }

        // Xử lý Chấm Điểm
        if (isWriting) {
            // Dạng Tự luận Đặt câu: KHÔNG CHẤM ĐÚNG SAI
            resultBox.innerHTML = `⏳ Câu này đang chờ Giáo viên chấm. <br>Bài làm của bạn: <b>${userAnswer}</b>`;
            resultBox.className = "result-box correct";
            resultBox.style.background = "#fff3e0"; // Màu cam nhạt
            resultBox.style.color = "#e65100";
            
            wrongDetails.push(`Câu ${index + 1} [HS Tự luận]: ${userAnswer === "" ? "Bỏ trống" : userAnswer}`);
        } 
        else {
            total++; // Tính vào tổng số câu
            let isCorrect = (userAnswer.replace(/\s+/g, '').toUpperCase() === correctAnswer.replace(/\s+/g, '').toUpperCase());

            if (isCorrect) {
                score++;
                resultBox.innerHTML = `✅ Tuyệt vời! Bạn đã làm đúng.`;
                resultBox.className = "result-box correct";
            } else {
                let displayAnswer = userAnswer === "" ? "chưa làm" : userAnswer;
                resultBox.innerHTML = `❌ Đáp án của bạn: <b>${displayAnswer}</b><br>👉 Đáp án chính xác: <b>${correctAnswer}</b>`;
                resultBox.className = "result-box incorrect";
                
                wrongDetails.push(`Câu ${index + 1}: ${displayAnswer} (${correctAnswer})`);
            }
        }
    });

    let displayScore = total > 0 ? `${score}/${total}` : "Chờ chấm tự luận";
    const payload = {
        tenHocVien: studentName,
        capDo: `HSK ${currentLevelGlobal} | ${currentTypeGlobal} | ${currentLessonGlobal}`,
        diemSo: displayScore,
        chiTiet: wrongDetails.length > 0 ? wrongDetails.join("\n") : ""
    };

    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        document.getElementById('loading-submit').innerHTML = `<b>🎉 Đã nộp bài! Kết quả: ${displayScore}</b>`;
    } catch (error) {
        document.getElementById('loading-submit').innerHTML = `⚠️ Lỗi mạng.`;
    }
}

window.onload = fetchQuestions;