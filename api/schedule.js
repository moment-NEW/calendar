// 杭电课表 API 服务
// 提供 JSON 格式的课表数据，方便外部系统集成

const API_BASE = 'https://api.hduhelp.com/calendar/schedule';

// 默认的 staffId（示例）
const DEFAULT_STAFF_ID = 'QrSIjTjegpeEPC2Ng13uPA==';

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 处理预检请求
  if (event.request.method === 'OPTIONS') {
    return event.respondWith(new Response(null, { headers: corsHeaders }));
  }

  // 路由处理
  if (url.pathname === '/api/schedule' || url.pathname === '/schedule.json') {
    event.respondWith(handleScheduleRequest(event.request));
  } else if (url.pathname === '/api/courses') {
    event.respondWith(handleCoursesRequest(event.request));
  } else if (url.pathname === '/api/today') {
    event.respondWith(handleTodayRequest(event.request));
  } else if (url.pathname === '/api/week') {
    event.respondWith(handleWeekRequest(event.request));
  } else if (url.pathname === '/health') {
    event.respondWith(new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } else {
    event.respondWith(new Response('Not Found', { status: 404 }));
  }
});

async function handleScheduleRequest(request) {
  const url = new URL(request.url);
  const staffId = url.searchParams.get('staffId') || DEFAULT_STAFF_ID;
  
  try {
    const icsResponse = await fetch(`${API_BASE}?staffId=${staffId}`, {
      headers: { 'Accept': 'text/calendar' }
    });
    
    const icsData = await icsResponse.text();
    const events = parseICS(icsData);
    
    return new Response(JSON.stringify({
      success: true,
      count: events.length,
      data: events
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleCoursesRequest(request) {
  const url = new URL(request.url);
  const staffId = url.searchParams.get('staffId') || DEFAULT_STAFF_ID;
  
  try {
    const icsResponse = await fetch(`${API_BASE}?staffId=${staffId}`, {
      headers: { 'Accept': 'text/calendar' }
    });
    
    const icsData = await icsResponse.text();
    const courses = extractCourses(icsData);
    
    return new Response(JSON.stringify({
      success: true,
      count: courses.length,
      data: courses
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleTodayRequest(request) {
  const url = new URL(request.url);
  const staffId = url.searchParams.get('staffId') || DEFAULT_STAFF_ID;
  
  try {
    const icsResponse = await fetch(`${API_BASE}?staffId=${staffId}`, {
      headers: { 'Accept': 'text/calendar' }
    });
    
    const icsData = await icsResponse.text();
    const todayEvents = getTodayEvents(icsData);
    
    return new Response(JSON.stringify({
      success: true,
      date: new Date().toISOString().split('T')[0],
      count: todayEvents.length,
      data: todayEvents
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleWeekRequest(request) {
  const url = new URL(request.url);
  const staffId = url.searchParams.get('staffId') || DEFAULT_STAFF_ID;
  
  try {
    const icsResponse = await fetch(`${API_BASE}?staffId=${staffId}`, {
      headers: { 'Accept': 'text/calendar' }
    });
    
    const icsData = await icsResponse.text();
    const weekEvents = getWeekEvents(icsData);
    
    return new Response(JSON.stringify({
      success: true,
      weekStart: weekEvents.weekStart,
      weekEnd: weekEvents.weekEnd,
      count: weekEvents.events.length,
      data: weekEvents.events
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 解析 ICS 数据
function parseICS(icsData) {
  const events = [];
  const lines = icsData.split('\n');
  let currentEvent = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT' && currentEvent) {
      if (currentEvent.summary && currentEvent.dtstart) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (trimmed.startsWith('SUMMARY:')) {
        currentEvent.summary = trimmed.substring(8);
      } else if (trimmed.startsWith('DTSTART')) {
        const match = trimmed.match(/DTSTART.*?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
        if (match) {
          currentEvent.dtstart = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00`;
          currentEvent.date = match[3];
          currentEvent.time = `${match[4]}:${match[5]}`;
        }
      } else if (trimmed.startsWith('DTEND')) {
        const match = trimmed.match(/DTEND.*?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
        if (match) {
          currentEvent.dtend = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00`;
        }
      } else if (trimmed.startsWith('LOCATION:')) {
        currentEvent.location = trimmed.substring(9);
      } else if (trimmed.startsWith('DESCRIPTION:')) {
        currentEvent.description = trimmed.substring(12).replace(/\\n/g, '\n');
      } else if (trimmed.startsWith('UID:')) {
        currentEvent.uid = trimmed.substring(4);
      }
    }
  }
  
  return events.sort((a, b) => a.dtstart.localeCompare(b.dtstart));
}

// 提取课程列表（去重）
function extractCourses(icsData) {
  const events = parseICS(icsData);
  const courses = new Map();
  
  for (const event of events) {
    const courseName = event.summary;
    if (!courses.has(courseName)) {
      courses.set(courseName, {
        name: courseName,
        location: event.location,
        firstDate: event.dtstart,
        uid: event.uid
      });
    }
  }
  
  return Array.from(courses.values());
}

// 获取今天的课程
function getTodayEvents(icsData) {
  const events = parseICS(icsData);
  const today = new Date().toISOString().split('T')[0];
  
  return events.filter(event => event.dtstart && event.dtstart.startsWith(today));
}

// 获取本周课程
function getWeekEvents(icsData) {
  const events = parseICS(icsData);
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  
  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    events: events.filter(event => {
      if (!event.dtstart) return false;
      const eventDate = event.dtstart.split('T')[0];
      return eventDate >= weekStartStr && eventDate < weekEndStr;
    })
  };
}
