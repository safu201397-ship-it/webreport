// ======== Google Sheets API Configuration ========
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxKD4ibthTcOPhAhbGTlGc1WqIn4bXlvGGZIM1_Owx3_sq9v-MuREu2jtXsJAB_iSE/exec"; // TODO: 在這裡填入您的 Web App URL
const urlParams = new URLSearchParams(window.location.search);
const USER_TOKEN = urlParams.get('token');
let currentUserData = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化頁面時檢查名額與讀取個人資料
    checkCapacityAndUser();

    // 1. Initialize Particles.js
    if (window.particlesJS) {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": ["#6366f1", "#ec4899", "#06b6d4", "#ffffff"] },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#ffffff",
                    "opacity": 0.2,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": { "enable": true, "mode": "grab" },
                    "onclick": { "enable": true, "mode": "push" },
                    "resize": true
                },
                "modes": {
                    "grab": { "distance": 200, "line_linked": { "opacity": 0.8 } },
                    "push": { "particles_nb": 4 }
                }
            },
            "retina_detect": true
        });
    }

    // 2. Removed 3D Tilt Effect per user request // 3. Typewriter Effect
    const typeWriterElement = document.getElementById('typewriter');
    const textToType = "活動報名表單";
    let typeIndex = 0;

    function type() {
        if (typeIndex < textToType.length) {
            typeWriterElement.textContent += textToType.charAt(typeIndex);
            typeIndex++;
            setTimeout(type, 150); // Typing speed
        }
    }
    // Start typing after initial load
    setTimeout(type, 500);

    // 4. SPA View Switching Logic
    const viewIntro = document.getElementById('view-intro');
    const viewForm = document.getElementById('view-form');
    const btnGoToForm = document.getElementById('btnGoToForm');
    const btnBackToIntro = document.getElementById('btnBackToIntro');

    if (btnGoToForm && btnBackToIntro && viewIntro && viewForm) {
        btnGoToForm.addEventListener('click', () => {
            viewIntro.classList.add('hidden-view');
            viewForm.classList.remove('hidden-view');
        });

        btnBackToIntro.addEventListener('click', () => {
            viewForm.classList.add('hidden-view');
            viewIntro.classList.remove('hidden-view');
        });
    }

    // 5. Multi-step Form Logic & Cascading Dropdowns
    const formSteps = document.querySelectorAll('.form-step');
    const nextBtns = document.querySelectorAll('.btn-next');
    const prevBtns = document.querySelectorAll('.btn-prev');
    const progressSteps = document.querySelectorAll('.step');
    const progressBar = document.getElementById('progressBar');
    
    // Cascading dropdown elements
    const unitTypeSelect = document.getElementById('unitType');
    const collegeGroup = document.getElementById('collegeGroup');
    const collegeSelect = document.getElementById('college');
    const departmentGroup = document.getElementById('departmentGroup');
    const departmentLabel = document.getElementById('departmentLabel');
    const departmentSelect = document.getElementById('department');

    // Populate dropdowns based on unitData (from unitData.js)
    if (typeof unitData !== 'undefined') {
        unitTypeSelect.addEventListener('change', (e) => {
            const type = e.target.value;
            
            // Reset fields
            collegeSelect.innerHTML = '<option value="" disabled selected>請選擇學院</option>';
            departmentSelect.innerHTML = '<option value="" disabled selected>請選擇</option>';
            
            if (type === '行政單位') {
                collegeGroup.classList.add('hidden');
                collegeSelect.required = false;
                
                departmentGroup.classList.remove('hidden');
                departmentLabel.innerHTML = '單位 <span class="required">*</span>';
                
                unitData['行政單位'].forEach(unit => {
                    const option = document.createElement('option');
                    option.value = unit;
                    option.textContent = unit;
                    departmentSelect.appendChild(option);
                });
            } else if (type === '學術單位') {
                collegeGroup.classList.remove('hidden');
                collegeSelect.required = true;
                
                departmentGroup.classList.remove('hidden');
                departmentLabel.innerHTML = '系所 <span class="required">*</span>';
                
                Object.keys(unitData['學術單位']).forEach(college => {
                    const option = document.createElement('option');
                    option.value = college;
                    option.textContent = college;
                    collegeSelect.appendChild(option);
                });
            }
        });

        collegeSelect.addEventListener('change', (e) => {
            const college = e.target.value;
            departmentSelect.innerHTML = '<option value="" disabled selected>請選擇系所</option>';
            
            if (unitData['學術單位'][college]) {
                unitData['學術單位'][college].forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept;
                    option.textContent = dept;
                    departmentSelect.appendChild(option);
                });
            }
        });
    }

    // Fix for campus select staying focused
    const campusSelect = document.getElementById('campus');
    if (campusSelect) {
        campusSelect.addEventListener('change', function() {
            this.blur();
        });
    }

    let currentStep = 0;

    function updateFormSteps() {
        // Update Form Display
        formSteps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('form-step-active');
            } else {
                step.classList.remove('form-step-active');
            }
        });

        // Update Progress Bar
        progressSteps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active');
                step.classList.remove('completed');
            }
        });

        const progressPercent = (currentStep / (progressSteps.length - 1)) * 100;
        progressBar.style.width = progressPercent + '%';
    }

    // Validate inputs in current step before moving forward
    function validateStep(stepIndex) {
        const step = formSteps[stepIndex];
        const inputs = step.querySelectorAll('input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
            }
        });
        
        return isValid;
    }

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                updateFormSteps();
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            updateFormSteps();
        });
    });

    // 5. Form Submission & Confetti
    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const resetBtn = document.getElementById('resetBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateStep(currentStep)) return;

        if (!SCRIPT_URL) {
            alert("系統提示：尚未設定 Google Apps Script URL，報名功能無法使用。");
            return;
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.remove('hidden');

        try {
            // 收集表單資料
            const sessionInput = document.querySelector('input[name="session"]:checked');
            const formData = {
                "token": USER_TOKEN || "",
                "frontendUrl": window.location.href.split('?')[0],
                "場次": sessionInput ? sessionInput.value : '',
                "單位類型": document.getElementById('unitType').value,
                "學院": document.getElementById('college').value || '',
                "單位/系所": document.getElementById('department').value || '',
                "姓名": document.getElementById('name').value,
                "職號": document.getElementById('employeeId').value,
                "電子郵件": document.getElementById('email').value,
                "分機": document.getElementById('campus').value + ' ' + (document.getElementById('extension').value || '')
            };

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(formData),
                mode: 'no-cors' // Google Apps Script Web App default workaround
            });

            // 因為 no-cors 無法讀取 response body，我們假設請求送出即成功
            loadingOverlay.classList.add('hidden');
            
            // 隱藏表單，顯示成功畫面
            form.style.display = 'none';
            document.querySelector('.progress-container').style.display = 'none';
            document.querySelector('.form-header').style.display = 'none';
            
            successMessage.classList.remove('hidden');
            triggerConfetti();

            form.reset();
            currentStep = 0;
            updateFormSteps();
        } catch (error) {
            loadingOverlay.classList.add('hidden');
            alert("發生錯誤，請稍後再試！");
            console.error(error);
        }
    });

    // Dashboard 儲存按鈕邏輯
    const btnSaveDashboard = document.getElementById('btnSaveDashboard');
    if (btnSaveDashboard) {
        btnSaveDashboard.addEventListener('click', async () => {
            if (!currentUserData) return;
            
            const dashGroup = document.getElementById('dashboardSessionGroup');
            const selectedSession = dashGroup.querySelector('input:checked');
            if (!selectedSession) {
                alert('請選擇一個場次');
                return;
            }
            
            btnSaveDashboard.classList.add('loading');
            
            const payload = { ...currentUserData };
            payload['場次'] = selectedSession.value;
            payload['token'] = USER_TOKEN;
            payload['frontendUrl'] = window.location.href.split('?')[0];
            
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    document.getElementById('editDashboard').classList.add('hidden');
                    document.getElementById('successMessage').classList.remove('hidden');
                    document.getElementById('successMessage').querySelector('h2').textContent = '修改成功！';
                    document.getElementById('successMessage').querySelector('p').textContent = '您的報名資料已經成功更新完畢。';
                } else {
                    alert('修改失敗：' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('發生錯誤，請稍後再試。');
            } finally {
                btnSaveDashboard.classList.remove('loading');
            }
        });
    }

    async function checkCapacityAndUser() {
        if (!SCRIPT_URL) return;
        
        try {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (USER_TOKEN) {
                if (loadingOverlay) {
                    loadingOverlay.classList.remove('hidden');
                    const lt = loadingOverlay.querySelector('.loading-text');
                    if (lt) lt.textContent = "讀取報名資料中...";
                }
            }

            const t = new Date().getTime();
            
            let data = null;
            let userDataRes = null;
            
            try {
                const capRes = await fetch(SCRIPT_URL);
                data = await capRes.json();
            } catch (fetchErr) {
                console.error('容量 API 失敗:', fetchErr);
            }
            
            if (USER_TOKEN) {
                try {
                    const userRes = await fetch(`${SCRIPT_URL}?action=get_user&token=${USER_TOKEN}`);
                    userDataRes = await userRes.json();
                } catch (userErr) {
                    console.error('使用者 API 失敗:', userErr);
                }
            }
            
            if (data && data.isAllFull && !USER_TOKEN) {
                const btnGoToForm = document.getElementById('btnGoToForm');
                if (btnGoToForm) {
                    btnGoToForm.textContent = '所有場次皆已額滿';
                    btnGoToForm.disabled = true;
                    btnGoToForm.style.background = '#64748b';
                    btnGoToForm.style.cursor = 'not-allowed';
                }
            }

            if (data && data.counts) {
                const maxCapacity = data.maxCapacity || 40;
                for (const [session, count] of Object.entries(data.counts)) {
                    const radio = document.querySelector(`input[name="session"][value="${session}"]`);
                    if (radio) {
                        const titleSpan = radio.parentElement.querySelector('.session-title');
                        const remaining = Math.max(0, maxCapacity - count);
                        if (titleSpan && !titleSpan.textContent.includes('剩餘') && !titleSpan.textContent.includes('已額滿')) {
                            let isMySession = false;
                            if (userDataRes && userDataRes.data && userDataRes.data['場次'] === session) {
                                isMySession = true;
                            }
                            if (remaining === 0 && !isMySession) {
                                radio.disabled = true;
                                titleSpan.innerHTML += ' <span style="color: #ef4444; font-size: 0.9em;">(已額滿)</span>';
                                radio.parentElement.style.opacity = '0.5';
                                radio.parentElement.style.cursor = 'not-allowed';
                            } else {
                                titleSpan.innerHTML += ` <span style="color: #10b981; font-size: 0.9em;">(剩餘 ${remaining} 名額)</span>`;
                            }
                        }
                    }
                }
            }

            // 處理資料回填與 Dashboard 顯示
            if (USER_TOKEN && userDataRes && userDataRes.status === 'success' && userDataRes.data) {
                try {
                    const uData = userDataRes.data;
                    currentUserData = uData;
                    
                    // 隱藏原始首頁與精靈表單，顯示 Dashboard
                    const viewIntro = document.getElementById('view-intro');
                    const viewForm = document.getElementById('view-form');
                    if (viewIntro) viewIntro.classList.add('hidden-view');
                    if (viewForm) viewForm.classList.remove('hidden-view');
                    
                    const regForm = document.getElementById('registrationForm');
                    const progressC = document.querySelector('.progress-container');
                    const formHeader = document.querySelector('.form-header');
                    const backBtn = document.getElementById('btnBackToIntro');
                    
                    if (regForm) regForm.style.display = 'none';
                    if (progressC) progressC.style.display = 'none';
                    if (formHeader) formHeader.style.display = 'none';
                    if (backBtn) backBtn.style.display = 'none';
                    
                    const editDash = document.getElementById('editDashboard');
                    if (editDash) editDash.style.display = 'block';
                    
                    // 填入基本資料
                    const greet = document.getElementById('dashboardGreeting');
                    if (greet) greet.textContent = `歡迎回來，${uData['姓名']}！`;
                    
                    const dn = document.getElementById('dispName');
                    if (dn) dn.textContent = uData['姓名'] || '';
                    
                    const du = document.getElementById('dispUnit');
                    if (du) du.textContent = `${uData['單位類型'] || ''} - ${uData['單位/系所'] || uData['學院'] || ''}`;
                    
                    const de = document.getElementById('dispEmpId');
                    if (de) de.textContent = uData['職號'] || '';
                    
                    const dc = document.getElementById('dispContact');
                    if (dc) dc.textContent = `${uData['電子郵件'] || ''} / ${uData['分機'] || ''}`;
                    
                    // 複製場次選項到 Dashboard
                    const originalGroup = document.querySelector('.form-step[data-step="3"] .radio-group-advanced');
                    const dashGroup = document.getElementById('dashboardSessionGroup');
                    if (originalGroup && dashGroup) {
                        dashGroup.innerHTML = originalGroup.innerHTML;
                        const dashRadios = dashGroup.querySelectorAll('input[type="radio"]');
                        dashRadios.forEach(radio => radio.name = "dashboardSession");

                        const savedSession = uData['場次'];
                        if (savedSession) {
                            const dashRadio = dashGroup.querySelector(`input[value="${savedSession}"]`);
                            if (dashRadio) {
                                dashRadio.disabled = false;
                                dashRadio.checked = true;
                                const titleSpan = dashRadio.parentElement.querySelector('.session-title');
                                if (titleSpan) {
                                    titleSpan.innerHTML = `<span style="color:#f59e0b;font-weight:bold;">★ </span>` + titleSpan.innerHTML;
                                }
                            }
                        }
                    }
                    
                } catch (dashErr) {
                    console.error('Dashboard 渲染失敗:', dashErr);
                }
            } else if (USER_TOKEN) {
                console.warn('Token 無效或資料不存在');
            }

            // 隱藏 loading overlay
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        } catch (error) {
            console.error("無法檢查或讀取資料", error);
            console.error('無法檢查或讀取資料', error);
            const lo = document.getElementById('loadingOverlay');
            if (lo) lo.classList.add('hidden');
        }
    }

    resetBtn.addEventListener('click', () => {
        // Reset everything to initial state
        successMessage.classList.add('hidden');
        form.style.display = 'block';
        document.querySelector('.progress-container').style.display = 'block';
        document.querySelector('.form-header').style.display = 'block';
        
        updateFormSteps();
    });

    function triggerConfetti() {
        if (!window.confetti) return;
        
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#6366f1', '#ec4899', '#06b6d4']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#6366f1', '#ec4899', '#06b6d4']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
});
