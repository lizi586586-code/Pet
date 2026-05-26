(function() {
  var usernameInput = document.getElementById('usernameInput');
  var passwordInput = document.getElementById('passwordInput');
  var togglePwd = document.getElementById('togglePwd');
  var loginBtn = document.getElementById('loginBtn');
  var usernameError = document.getElementById('usernameError');
  var pwdError = document.getElementById('pwdError');
  var toast = document.getElementById('toast');

  var usernameValid = false;
  var pwdValid = false;
  var loading = false;
  var maskTimer = null;

  var API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://' + window.location.hostname + ':8000'
    : '';
  
  // ── Username validation ──
  function validateUsername(value) {
    var trimmed = value.trim();
    if (trimmed.length === 0) {
      usernameError.textContent = '';
      usernameInput.classList.remove('error');
      return false;
    }
    if (trimmed.length < 2) {
      usernameError.textContent = '用户名至少2个字符';
      usernameInput.classList.add('error');
      return false;
    }
    usernameError.textContent = '';
    usernameInput.classList.remove('error');
    return true;
  }

  // ── Password validation ──
  function validatePassword(value) {
    if (value.length === 0) {
      pwdError.textContent = '';
      passwordInput.classList.remove('error');
      return false;
    }
    if (value.length < 6) {
      pwdError.textContent = '密码长度不少于6位';
      passwordInput.classList.add('error');
      return false;
    }
    pwdError.textContent = '';
    passwordInput.classList.remove('error');
    return true;
  }

  // ── Button state ──
  function updateButton() {
    if (loading) return;
    if (usernameValid && pwdValid) {
      loginBtn.classList.add('active');
      loginBtn.disabled = false;
    } else {
      loginBtn.classList.remove('active');
      loginBtn.disabled = true;
    }
  }

  // ── Toast ──
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
      toast.classList.remove('show');
    }, 3000);
  }

  // ── Events ──
  usernameInput.addEventListener('input', function() {
    usernameValid = validateUsername(this.value);
    updateButton();
  });

  usernameInput.addEventListener('blur', function() {
    var val = this.value.trim();
    if (val.length > 0 && val.length < 2) {
      usernameError.textContent = '用户名至少2个字符';
      usernameInput.classList.add('error');
      usernameValid = false;
    } else {
      usernameValid = validateUsername(val);
    }
    updateButton();
  });

  passwordInput.addEventListener('input', function() {
    pwdValid = validatePassword(this.value);
    updateButton();
  });

  passwordInput.addEventListener('blur', function() {
    if (this.value.length > 0 && this.value.length < 6) {
      pwdError.textContent = '密码长度不少于6位';
      passwordInput.classList.add('error');
      pwdValid = false;
    } else {
      pwdValid = validatePassword(this.value);
    }
    updateButton();
  });

  togglePwd.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      togglePwd.textContent = '🙈';
      clearTimeout(maskTimer);
      maskTimer = setTimeout(function() {
        passwordInput.type = 'password';
        togglePwd.textContent = '👁';
      }, 2000);
    } else {
      passwordInput.type = 'password';
      togglePwd.textContent = '👁';
      clearTimeout(maskTimer);
    }
  });

  // ── Login ──
  loginBtn.addEventListener('click', function() {
    if (loading || !usernameValid || !pwdValid) return;

    loading = true;
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    var username = usernameInput.value.trim();
    var password = passwordInput.value;

    fetch(API_BASE + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('server_error');
      return res.json();
    })
    .then(function(data) {
      if (data.status === 'ok') {
        var tokenId = data.data.token_id;
        localStorage.setItem('studybuddy_token', tokenId);
        localStorage.setItem('studybuddy_username', username);
        // 同时设置 cookie，供服务端中间件校验
        document.cookie = 'studybuddy_token=' + tokenId + ';path=/;max-age=86400;SameSite=Lax';
        // call /api/recent to fetch last 10 sessions
        return fetch(API_BASE + '/api/recent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token_id: tokenId })
        }).then(function(res) {
          if (!res.ok) throw new Error('server_error');
          return res.json();
        }).then(function(recentData) {
          if (recentData.status === 'ok') {
            localStorage.setItem('studybuddy_sessions', JSON.stringify(recentData.data.sessions));
            // 存储最新会话 session_id，后续对话复用
            var sessions = recentData.data.sessions;
            if (sessions && sessions.length > 0) {
              localStorage.setItem('studybuddy_session_id', sessions[0][0]);
            }
          }
          // proceed to pet page
          showToast('登录成功，正在跳转…');
          setTimeout(function() {
            window.location.href = 'ai_pet.html';
          }, 500);
        });
      } else if (data.status === 'fail') {
        throw new Error('auth_fail');
      } else if (data.status === 'error') {
        throw new Error('validation_error');
      }
    })
    .catch(function(err) {
      loading = false;
      loginBtn.classList.remove('loading');
      updateButton();

      if (err.message === 'auth_fail') {
        showToast('用户名或密码错误');
      } else if (err.message === 'validation_error') {
        showToast('请输入用户名和密码');
      } else if (!navigator.onLine) {
        showToast('当前无网络连接，请检查网络设置');
      } else {
        showToast('服务器繁忙，请稍后再试');
      }
    });
  });

  // detect existing token on load
  (function checkToken() {
    var token = localStorage.getItem('studybuddy_token');
    if (!token) return;
    // verify token is still valid by calling /api/recent
    fetch(API_BASE + '/api/recent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_id: token })
    })
    .then(function(res) {
      if (!res.ok) { clearAuth(); return; }
      return res.json();
    })
    .then(function(data) {
      if (data && data.status === 'ok') {
        localStorage.setItem('studybuddy_sessions', JSON.stringify(data.data.sessions));
        var sessions = data.data.sessions;
        if (sessions && sessions.length > 0) {
          localStorage.setItem('studybuddy_session_id', sessions[0][0]);
        }
        window.location.replace('ai_pet.html');
      } else {
        clearAuth();
      }
    })
    .catch(function() {
      clearAuth();
    });
  })();

  function clearAuth() {
    localStorage.removeItem('studybuddy_token');
    localStorage.removeItem('studybuddy_username');
    localStorage.removeItem('studybuddy_sessions');
    localStorage.removeItem('studybuddy_session_id');
    document.cookie = 'studybuddy_token=;path=/;max-age=0';
  }
})();
