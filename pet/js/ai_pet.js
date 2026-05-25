(function() {
  var API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

  // ── Auth check ──
  var token = localStorage.getItem('studybuddy_token');
  var username = localStorage.getItem('studybuddy_username');
  if (!token || !username) {
    document.cookie = 'studybuddy_token=;path=/;max-age=0';
    window.location.replace('login.html');
    return;
  }

  var currentSessionId = localStorage.getItem('studybuddy_session_id') || null;

  // ── Pet State Machine (aligned with petmvp PRD) ──
  // States: IDLE, LISTENING, FAREWELL, COMFORT, HAPPY
  // Priority: COMFORT > LISTENING > FAREWELL > IDLE
  var PetState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    FAREWELL: 'farewell',
    COMFORT: 'comfort',
    HAPPY: 'happy'
  };
  var STATE_PRIORITY = {};
  STATE_PRIORITY[PetState.IDLE] = 0;
  STATE_PRIORITY[PetState.FAREWELL] = 1;
  STATE_PRIORITY[PetState.LISTENING] = 2;
  STATE_PRIORITY[PetState.COMFORT] = 3;
  STATE_PRIORITY[PetState.HAPPY] = 4;

  var currentPetState = PetState.IDLE;
  var stateTimer = null;
  var idleMoveTimer = null;
  var IDLE_TIMEOUT = 10000;       // LISTENING → IDLE after 10s silence
  var FAREWELL_DURATION = 3000;   // PRD: 1-2s animation + pause
  var COMFORT_DURATION = 4000;    // PRD: comfort GIF
  var HAPPY_DURATION = 4000;      // PRD: 3-5s happy after comfort

  var stateBadgeMap = {};
  stateBadgeMap[PetState.IDLE] = '💤 默认';
  stateBadgeMap[PetState.LISTENING] = '👂 聆听';
  stateBadgeMap[PetState.FAREWELL] = '👋 欢送';
  stateBadgeMap[PetState.COMFORT] = '🫂 安抚';
  stateBadgeMap[PetState.HAPPY] = '💕 开心';

  function setPetState(newState, force) {
    // Priority guard: lower-priority states cannot interrupt higher ones
    // 'force' bypasses guard for internal timeout transitions
    if (currentPetState === newState) return;
    if (!force) {
      var curPrio = STATE_PRIORITY[currentPetState] || 0;
      var newPrio = STATE_PRIORITY[newState] || 0;
      if (newPrio < curPrio) return;
    }

    var prevState = currentPetState;
    currentPetState = newState;
    clearTimeout(stateTimer);
    clearTimeout(idleMoveTimer);
    petStateBadge.textContent = stateBadgeMap[newState] || newState;
    petStage.classList.remove('pet-breathing', 'pet-happy');

    switch (newState) {
      case PetState.IDLE:
        petVideo.classList.remove('show');
        petImage.src = 'ttyaotou.gif';
        petImage.style.opacity = '1';
        petStage.classList.add('pet-breathing');
        startIdleMicroMovements();
        break;

      case PetState.LISTENING:
        petVideo.classList.remove('show');
        petImage.style.opacity = '1';
        stateTimer = setTimeout(function() {
          setPetState(PetState.IDLE, true);
        }, IDLE_TIMEOUT);
        break;

      case PetState.FAREWELL:
        petImage.style.opacity = '0';
        petVideo.src = 'tthello.gif';
        petVideo.classList.add('show');
        stateTimer = setTimeout(function() {
          setPetState(PetState.IDLE, true);
        }, FAREWELL_DURATION);
        break;

      case PetState.COMFORT:
        petImage.src = 'comfort.gif';
        petImage.style.opacity = '1';
        petVideo.classList.remove('show');
        stateTimer = setTimeout(function() {
          petImage.src = 'ttyaotou.gif';
          setPetState(PetState.HAPPY, true); // PRD: COMFORT → HAPPY 3-5s
        }, COMFORT_DURATION);
        break;

      case PetState.HAPPY:
        petVideo.classList.remove('show');
        petImage.style.opacity = '1';
        petStage.classList.add('pet-happy');
        stateTimer = setTimeout(function() {
          setPetState(PetState.IDLE, true);
        }, HAPPY_DURATION);
        break;
    }
    // Sync state to backend
    fetch(API_BASE + '/api/pet/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pet_state: newState,
        token_id: token,
        session_id: currentSessionId || ''
      })
    }).catch(function() {});
  }

  // PRD: IDLE random micro-movements for "活物感"
  function startIdleMicroMovements() {
    clearTimeout(idleMoveTimer);
    function tick() {
      if (currentPetState !== PetState.IDLE) return;
      var moves = ['pet-twitch', 'pet-tilt', ''];
      var move = moves[Math.floor(Math.random() * moves.length)];
      petStage.classList.remove('pet-twitch', 'pet-tilt');
      if (move) petStage.classList.add(move);
      idleMoveTimer = setTimeout(tick, 3000 + Math.random() * 5000);
    }
    idleMoveTimer = setTimeout(tick, 4000 + Math.random() * 4000);
  }

  function resetStateTimer() {
    clearTimeout(stateTimer);
    if (currentPetState === PetState.IDLE) {
      setPetState(PetState.LISTENING);
    }
    stateTimer = setTimeout(function() {
      setPetState(PetState.IDLE, true);
    }, IDLE_TIMEOUT);
  }

  // ── DOM refs ──
  var petImage = document.getElementById('petImage');
  var petVideo = document.getElementById('petVideo');
  var petStage = document.getElementById('petStage');
  var petMood = document.getElementById('petMood');
  var welcomeBubble = document.getElementById('welcomeBubble');
  var chatInput = document.getElementById('chatInput');
  var sendBtn = document.getElementById('sendBtn');
  var plusBtn = document.getElementById('plusBtn');
  var chatMessages = document.getElementById('chatMessages');
  var moodToggleBtn = document.getElementById('moodToggleBtn');
  var aiResponseBubble = document.getElementById('aiResponseBubble');
  var aiResponseText = document.getElementById('aiResponseText');
  var petStateBadge = document.getElementById('petStateBadge');

  // ── Helpers ──
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatThinkTags(text) {
    var escaped = escapeHtml(text);
    // Replace <think>...</think> with block-level Doubao-style think section
    escaped = escaped.replace(
      /&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/g,
      '<div class="think-block"><div class="think-header">思考过程</div><div class="think-body">$1</div></div>'
    );
    return escaped;
  }

  var petBubbleTimer = null;

  function openPetBubble() {
    aiResponseText.textContent = '';
    aiResponseBubble.classList.add('show');
    clearTimeout(petBubbleTimer);
  }

  function streamPetBubble(text) {
    aiResponseText.textContent += text;
  }

  function closePetBubble() {
    petBubbleTimer = setTimeout(hidePetBubble, 8000);
  }

  function showPetBubble(text) {
    // Strip <think> / <thinking> blocks (both formats)
    var cleanText = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').trim();
    if (!cleanText) cleanText = text;
    aiResponseText.textContent = cleanText;
    aiResponseBubble.classList.add('show');
    clearTimeout(petBubbleTimer);
    petBubbleTimer = setTimeout(hidePetBubble, 8000);
  }

  function hidePetBubble() {
    aiResponseBubble.classList.remove('show');
    clearTimeout(petBubbleTimer);
  }

  function spawnFloatBubble(text) {
    var phoneFrame = document.querySelector('.phone-frame');
    var phoneRect = phoneFrame.getBoundingClientRect();
    var bubble = document.createElement('div');
    bubble.className = 'float-bubble';
    bubble.textContent = text;
    bubble.style.right = (window.innerWidth - phoneRect.right + 20) + 'px';
    bubble.style.bottom = (window.innerHeight - phoneRect.bottom + 100) + 'px';
    document.body.appendChild(bubble);
    setTimeout(function() {
      bubble.remove();
    }, 2000);
  }

  function addMessage(text, isUser) {
    var row = document.createElement('div');
    row.className = isUser ? 'msg-row end' : 'msg-row';

    if (!isUser) {
      var avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = '🐶';
      row.appendChild(avatar);
    }

    var bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    if (isUser) {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = formatThinkTags(text);
    }
    row.appendChild(bubble);

    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function addSystemFeedback(text) {
    var div = document.createElement('div');
    div.className = 'system-feedback';
    var span = document.createElement('span');
    span.textContent = text;
    div.appendChild(span);
    chatMessages.appendChild(div);
    scrollToBottom();
  }

  // ── Load latest session messages ──
  function loadLatestSession() {
    var sessionsJson = localStorage.getItem('studybuddy_sessions');
    var sessions = [];
    try {
      sessions = JSON.parse(sessionsJson) || [];
    } catch (e) {
      sessions = [];
    }

    // Prefer stored session_id; fall back to most recent
    var storedSessionId = localStorage.getItem('studybuddy_session_id');
    if (storedSessionId) {
      currentSessionId = storedSessionId;
    } else if (sessions.length > 0) {
      currentSessionId = sessions[0][0];
    }

    if (!currentSessionId) {
      chatMessages.innerHTML =
        '<div class="msg-row end"><div class="msg-bubble">你好呀！</div></div>' +
        '<div class="msg-row"><div class="avatar">🐶</div><div class="msg-bubble">欢迎来到 StudyBuddy！我是你的 AI 宠物伙伴。</div></div>' +
        '<div class="system-feedback"><span>和它说第一句话吧</span></div>';
      return;
    }

    chatMessages.innerHTML = '<div class="system-feedback"><span>加载中…</span></div>';

    fetch(API_BASE + '/api/session/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_id: token, session_id: currentSessionId })
    })
    .then(function(res) {
      if (res.status === 429) {
        showToast('发言太快啦，休息一下再和桃桃聊天吧');
        setPetState(PetState.IDLE);
        throw new Error('rate_limited');
      }
      if (!res.ok) throw new Error('server_error');
      return res.json();
    })
    .then(function(data) {
      chatMessages.innerHTML = '';
      if (data.status === 'ok' && data.data.messages.length > 0) {
        var messages = data.data.messages;
        for (var i = 0; i < messages.length; i++) {
          var msg = messages[i];
          addMessage(msg.content, msg.role === 'user');
        }
        addSystemFeedback('已加载最近一次会话');
      } else {
        chatMessages.innerHTML =
          '<div class="msg-row end"><div class="msg-bubble">你好呀！</div></div>' +
          '<div class="msg-row"><div class="avatar">🐶</div><div class="msg-bubble">欢迎回来！想聊什么呢？</div></div>' +
          '<div class="system-feedback"><span>和它说第一句话吧</span></div>';
      }
    })
    .catch(function() {
      chatMessages.innerHTML =
        '<div class="system-feedback"><span>加载失败，请刷新页面重试</span></div>';
    });
  }

  // ── Mood panel state ──
  var moodPanel = document.getElementById('moodPanel');
  var moodDatesEl = document.getElementById('moodDates');
  var moodChartEl = document.getElementById('moodChart');
  var moodLogListEl = document.getElementById('moodLogList');
  var moodMonthTitle = document.getElementById('moodMonthTitle');
  var moodDisplayMonth = new Date().getMonth(); // 0-indexed
  var moodDisplayYear = new Date().getFullYear();

  // Mock mood data keyed by "YYYY-MM-DD"
  var moodData = {};
  var moodEmojis = ['😄', '😊', '😐', '😢', '😡'];
  var moodLabels = ['开心', '不错', '一般', '难过', '生气'];
  var moodColors = ['mood-great', 'mood-good', 'mood-normal', 'mood-bad', 'mood-terrible'];

  function randomMood() {
    var weights = [0.2, 0.35, 0.25, 0.15, 0.05];
    var r = Math.random();
    var acc = 0;
    for (var i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r <= acc) return i;
    }
    return 1;
  }

  function getDateKey(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function ensureMoodData(y, m) {
    var days = new Date(y, m + 1, 0).getDate();
    for (var d = 1; d <= days; d++) {
      var key = getDateKey(y, m, d);
      if (!(key in moodData)) {
        moodData[key] = randomMood();
      }
    }
  }

  function renderCalendar() {
    ensureMoodData(moodDisplayYear, moodDisplayMonth);
    moodMonthTitle.textContent = moodDisplayYear + '年' + (moodDisplayMonth + 1) + '月';

    var today = new Date();
    var todayKey = getDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    var firstDay = new Date(moodDisplayYear, moodDisplayMonth, 1).getDay(); // 0=Sun
    // Convert to Mon=0 ... Sun=6
    var startOffset = firstDay === 0 ? 6 : firstDay - 1;

    var daysInMonth = new Date(moodDisplayYear, moodDisplayMonth + 1, 0).getDate();
    var daysInPrevMonth = new Date(moodDisplayYear, moodDisplayMonth, 0).getDate();

    var html = '';

    // Previous month tail
    for (var i = startOffset - 1; i >= 0; i--) {
      var d = daysInPrevMonth - i;
      html += '<div class="mood-date-cell other-month"><span>' + d + '</span></div>';
    }

    // Current month
    for (var d = 1; d <= daysInMonth; d++) {
      var key = getDateKey(moodDisplayYear, moodDisplayMonth, d);
      var moodIdx = moodData[key] || 1;
      var isToday = key === todayKey ? ' today' : '';
      html += '<div class="mood-date-cell' + isToday + '">';
      html += '<span>' + d + '</span>';
      html += '<span class="mood-emoji-dot">' + moodEmojis[moodIdx] + '</span>';
      html += '</div>';
    }

    // Next month head (fill remaining grid cells to complete row)
    var totalCells = startOffset + daysInMonth;
    var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (var d2 = 1; d2 <= remaining; d2++) {
      html += '<div class="mood-date-cell other-month"><span>' + d2 + '</span></div>';
    }

    moodDatesEl.innerHTML = html;
  }

  function renderWeeklyChart() {
    var today = new Date();
    var dayOfWeek = today.getDay(); // 0=Sun
    var mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    var html = '';
    var emojiList = ['😄', '😊', '😐', '😢', '😡'];
    var heights = [56, 44, 28, 18, 10];

    for (var i = 0; i < 7; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() - mondayOffset + i);
      var key = getDateKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (!(key in moodData)) moodData[key] = randomMood();
      var moodIdx = moodData[key];
      var barH = heights[moodIdx];
      var barEmoji = emojiList[moodIdx];
      var barColor = moodColors[moodIdx];

      var isToday = i === mondayOffset;
      var opacityStyle = isToday ? '' : 'opacity:0.65;';

      html += '<div class="mood-bar-wrap">';
      html += '<span class="mood-bar-emoji">' + barEmoji + '</span>';
      html += '<div class="mood-bar ' + barColor + '" style="height:' + barH + 'px;' + opacityStyle + '"></div>';
      html += '</div>';
    }

    moodChartEl.innerHTML = html;
  }

  function renderMoodLogs() {
    var today = new Date();
    var entries = [
      { emoji: '😊', text: '今天学习效率很高，完成了计划中的所有任务', time: '今天 14:30' },
      { emoji: '😐', text: '有点累，但坚持完成了复习计划', time: '今天 10:15' },
      { emoji: '😄', text: '解决了困扰已久的问题，心情超好', time: '昨天 21:00' },
      { emoji: '😢', text: '遇到了一些困难，但宠物给了安慰', time: '昨天 16:45' },
    ];

    var html = '';
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      html += '<div class="mood-log-entry">';
      html += '<span class="mood-log-emoji">' + e.emoji + '</span>';
      html += '<div class="mood-log-content">';
      html += '<span class="mood-log-text">' + e.text + '</span>';
      html += '<span class="mood-log-time">' + e.time + '</span>';
      html += '</div></div>';
    }
    moodLogListEl.innerHTML = html;
  }

  function showMoodPanel() {
    moodPanel.style.display = 'flex';
    renderCalendar();
    renderWeeklyChart();
    renderMoodLogs();
  }

  function showChatPanel() {
    moodPanel.style.display = 'none';
  }

  // ── Toast ──
  var toast = document.getElementById('toast');
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
      toast.classList.remove('show');
    }, 2000);
  }

  // ── Intent Detection ──
  var farewellKeywords = ['上班', '出门', '出去', '走了', '拜拜', '再见', '我走啦', '出门啦', '上班去', '外出', '我出门', '出去了', '先走了', '去上班', '上班啦'];
  var comfortKeywords = ['累', '疲惫', '困', '倦', '乏', '辛苦', '疲劳', '好累', '好困', '没精神', '没力气', '想睡', '酸', '痛', '难受', '不舒服', '扛不住', '撑不住', '熬', '加班', '通宵', '难过', '伤心', '不开心', '低落', '郁闷', '压力', '崩溃', 'emo', '好烦'];

  function detectFarewell(text) {
    for (var i = 0; i < farewellKeywords.length; i++) {
      if (text.indexOf(farewellKeywords[i]) !== -1) return true;
    }
    return false;
  }

  function detectComfort(text) {
    for (var i = 0; i < comfortKeywords.length; i++) {
      if (text.indexOf(comfortKeywords[i]) !== -1) return true;
    }
    return false;
  }

  var farewellBubbleTexts = {
    '上班': '我会乖乖等你回来～今天也要好好加油哦',
    'default': '我在家等你回来哦'
  };

  function getFarewellText(text) {
    if (text.indexOf('上班') !== -1) return farewellBubbleTexts['上班'];
    return farewellBubbleTexts['default'];
  }

  // ── Send message ──
	function sendMessage() {
	    var text = chatInput.value.trim();
	    if (!text) return;

	    var isFarewell = detectFarewell(text);
	    var isComfort = detectComfort(text);

	    setPetState(PetState.LISTENING);
	    addMessage(text, true);
	    spawnFloatBubble(text);
	    chatInput.value = '';

	    fetch(API_BASE + '/api/chat', {
	      method: 'POST',
	      headers: { 'Content-Type': 'application/json' },
	      body: JSON.stringify({
	        prompt: text,
	        token_id: token,
	        session_id: currentSessionId || ''
	      })
	    })
	    .then(function(res) {
	      if (!res.ok) throw new Error('server_error');
	      return res.json();
	    })
	    .then(function(data) {
	      if (data.status === 'ok') {
	        if (data.data.session_id) {
	          currentSessionId = data.data.session_id;
	          localStorage.setItem('studybuddy_session_id', currentSessionId);
	        }
	        addMessage(data.data.response, false);
	        showPetBubble(data.data.response);

	        if (isFarewell) {
	          setPetState(PetState.FAREWELL);
	          petMood.textContent = '👋 等你回来';
	        } else if (isComfort) {
	          setPetState(PetState.COMFORT);
	          petMood.textContent = '🫂 安抚中…';
	          addSystemFeedback('检测到低落情绪，桃桃在安慰你…');
	        } else {
	          addSystemFeedback('宠物情绪：开心 \u00b7 亲密度 +1');
	          petMood.textContent = '😊 心情 ' + Math.floor(Math.random() * 10 + 80);
	          setPetState(PetState.IDLE);
	        }
	      } else {
	        addMessage('唔…我走神了，能再说一次吗？', false);
	        addSystemFeedback('回复失败，请重试');
	        setPetState(PetState.IDLE);
	      }
	    })
	    .catch(function() {
	      addMessage('网络好像不太好，稍等下再试试？', false);
	      addSystemFeedback('网络错误，请检查连接');
	      setPetState(PetState.IDLE);
	    });
	  }

  // ── Event bindings ──
  chatInput.addEventListener('focus', function() {
    setPetState(PetState.LISTENING);
    hidePetBubble();
  });

  chatInput.addEventListener('input', function() {
    resetStateTimer();
    hidePetBubble();
  });

  chatInput.addEventListener('blur', function() {
    if (!chatInput.value.trim()) {
      setPetState(PetState.IDLE);
    }
  });

  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  sendBtn.addEventListener('click', sendMessage);

  plusBtn.addEventListener('click', function() {
    chatInput.focus();
  });

  // ── Action buttons: feed / sleep / play ──
  var actionBtns = document.querySelectorAll('.action-btn');
  var actionCooldown = false;

  var actionMessages = {
    feed: ['🍼 你给豆包喂了好吃的～它开心地摇着尾巴', '🍼 豆包吃得很满足，亲密度 +3', '🍼 吃饱啦！豆包蹭了蹭你的手'],
    sleep: ['😴 豆包打了个哈欠，准备睡觉了…', '😴 豆包蜷成一团，进入了甜美的梦乡', '😴 嘘…豆包睡着了，精力值恢复了'],
    play: ['⚽ 你和豆包玩了会儿球，它超兴奋！', '⚽ 豆包追着球跑来跑去，亲密度 +3', '⚽ 玩得好开心！豆包累得吐舌头']
  };

  var actionEmojis = {
    feed: ['🍼', '🍖', '🦴'],
    sleep: ['😴', '💤', '🌙'],
    play:  ['⚽', '🎾', '🦮']
  };

  // Preload action GIFs
  var actionGifs = {
    feed: '../UI/feed.gif',
    sleep: '',
    play: ''
  };
  var preloadedGifs = {};
  Object.keys(actionGifs).forEach(function(key) {
    if (actionGifs[key]) {
      var img = new Image();
      img.src = actionGifs[key];
      preloadedGifs[key] = img;
    }
  });

  actionBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (actionCooldown) return;
      actionCooldown = true;

      var action = this.dataset.action;
      var msgs = actionMessages[action];
      var msg = msgs[Math.floor(Math.random() * msgs.length)];

      resetStateTimer();
      addSystemFeedback(msg);

      var emojis = actionEmojis[action];
      var emoji = emojis[Math.floor(Math.random() * emojis.length)];
      petMood.textContent = emoji + ' 心情 ' + Math.floor(Math.random() * 10 + 80);

      // Trigger action GIF
      if (preloadedGifs[action]) {
        petVideo.classList.remove('show');
        var prevSrc = petImage.src;
        petStage.style.transform = 'scale(0.82)';
        petImage.style.opacity = '0';
        petImage.src = preloadedGifs[action].src;
        petImage.style.width = '355px';
        petImage.style.filter = 'brightness(0.92) saturate(0.75) sepia(0.2) hue-rotate(-5deg)';
        petImage.offsetHeight;
        petImage.style.opacity = '1';
        setTimeout(function() {
          showPetBubble('我吃饱饱啦～');
          petImage.style.opacity = '0';
          petImage.src = prevSrc;
          petImage.style.width = '';
          petImage.style.filter = '';
          petStage.style.transform = '';
          petImage.offsetHeight;
          petImage.style.opacity = '1';
          actionCooldown = false;
          setPetState(PetState.IDLE, true);
        }, 7000);
      } else {
        if (action === 'play' || action === 'sleep') showToast('功能建设中');
        setTimeout(function() { actionCooldown = false; }, 2000);
      }

      fetch(API_BASE + '/api/pet_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          token_id: token,
          session_id: currentSessionId || ''
        })
      }).catch(function() {});
    });
  });

  petImage.addEventListener('click', function() {
    var moodEmojis = ['😊', '🥰', '😄', '🤗'];
    var emoji = moodEmojis[Math.floor(Math.random() * moodEmojis.length)];
    petMood.textContent = emoji + ' 心情 ' + Math.floor(Math.random() * 20 + 75);
    resetStateTimer();
  });

  // ── Think block expand/collapse (event delegation) ──
  chatMessages.addEventListener('click', function(e) {
    var header = e.target.closest('.think-header');
    if (!header) return;
    var body = header.nextElementSibling;
    if (!body || !body.classList.contains('think-body')) return;
    var isCollapsed = body.style.display === 'none';
    if (isCollapsed) {
      body.style.display = 'block';
      header.style.marginBottom = '8px';
      header.classList.remove('collapsed');
    } else {
      body.style.display = 'none';
      header.style.marginBottom = '0';
      header.classList.add('collapsed');
    }
  });

  // ── Mood toggle ──
  var moodPanelVisible = false;

  moodToggleBtn.addEventListener('click', function() {
    if (moodPanelVisible) {
      showChatPanel();
      moodPanelVisible = false;
    } else {
      showMoodPanel();
      moodPanelVisible = true;
    }
  });

  // ── Month navigation ──
  document.getElementById('moodPrev').addEventListener('click', function() {
    moodDisplayMonth--;
    if (moodDisplayMonth < 0) { moodDisplayMonth = 11; moodDisplayYear--; }
    renderCalendar();
  });
  document.getElementById('moodNext').addEventListener('click', function() {
    moodDisplayMonth++;
    if (moodDisplayMonth > 11) { moodDisplayMonth = 0; moodDisplayYear++; }
    renderCalendar();
  });

  // ── Memories Drawer ──
  var memoriesOverlay = document.getElementById('memoriesOverlay');
  var memoriesEntryBtn = document.getElementById('memoriesEntryBtn');
  var memoriesCloseBtn = document.getElementById('memoriesCloseBtn');

  memoriesEntryBtn.addEventListener('click', function() {
    memoriesOverlay.classList.add('open');
  });

  memoriesCloseBtn.addEventListener('click', function() {
    memoriesOverlay.classList.remove('open');
  });

  memoriesOverlay.addEventListener('click', function(e) {
    if (e.target === memoriesOverlay) {
      memoriesOverlay.classList.remove('open');
    }
  });

  // ── Video Player ──
  var videoOverlay = document.getElementById('videoOverlay');
  var videoCloseBtn = document.getElementById('videoCloseBtn');
  var memoryVideo = document.getElementById('memoryVideo');
  var yellowNote = document.querySelector('.mem-sticky-yellow');

  yellowNote.addEventListener('click', function() {
    videoOverlay.classList.add('open');
  });

  videoCloseBtn.addEventListener('click', function() {
    videoOverlay.classList.remove('open');
    memoryVideo.pause();
  });

  videoOverlay.addEventListener('click', function(e) {
    if (e.target === videoOverlay) {
      videoOverlay.classList.remove('open');
      memoryVideo.pause();
    }
  });

  // ── Clock ──
  function updateTime() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var el = document.querySelector('.status-left span');
    if (el) el.textContent = h + ':' + m;
  }
  updateTime();
  setInterval(updateTime, 30000);

  // ── Boot: default state, show welcome bubble briefly ──
  setPetState(PetState.IDLE);
  welcomeBubble.textContent = '欢迎' + username + '回来～今天也要好好加油哦';
  welcomeBubble.classList.add('show');

  setTimeout(function() {
    welcomeBubble.classList.remove('show');
  }, 4000);
  loadLatestSession();
})();
