/**
 * 课表与自定义日程合并工具
 * 将课表 ICS 和自定义日程 JSON 合并为一个统一的 ICS 文件
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  scheduleIcsPath: './schedule.ics',
  customEventsPath: './custom-events.json',
  outputIcsPath: './merged-schedule.ics',
  timeZone: 'Asia/Shanghai'
};

/**
 * 解析 ICS 文件
 */
function parseICS(icsData) {
  const events = [];
  const lines = icsData.split('\n');
  let currentEvent = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'BEGIN:VEVENT') {
      currentEvent = { type: 'schedule' };
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
          currentEvent.dtstart = `${match[1]}${match[2]}${match[3]}T${match[4]}${match[5]}00`;
        }
      } else if (trimmed.startsWith('DTEND')) {
        const match = trimmed.match(/DTEND.*?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
        if (match) {
          currentEvent.dtend = `${match[1]}${match[2]}${match[3]}T${match[4]}${match[5]}00`;
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
  
  return events;
}

/**
 * 解析自定义日程 JSON
 */
function parseCustomEvents(jsonData) {
  const events = JSON.parse(jsonData);
  return events.map(event => ({
    type: 'custom',
    uid: event.id || `custom-${Date.now()}`,
    summary: event.title,
    dtstart: event.start.replace(/[-:]/g, '').replace('T', 'T'),
    dtend: event.end ? event.end.replace(/[-:]/g, '').replace('T', 'T') : event.start.replace(/[-:]/g, '').replace('T', 'T'),
    location: event.location || '',
    description: event.description || '',
    category: event.category || 'custom',
    reminder: event.reminder || 0
  }));
}

/**
 * 生成 ICS 文件
 */
function generateICS(events, config) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HDU Calendar//Merged Schedule//EN',
    'X-WR-CALNAME:课表（已合并）',
    `X-WR-TIMEZONE:${config.timeZone}`,
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:' + config.timeZone,
    'BEGIN:STANDARD',
    'DTSTART:19890917T020000',
    'TZNAME:GMT+8',
    'TZOFFSETFROM:+0800',
    'TZOFFSETTO:+0800',
    'END:STANDARD',
    'END:VTIMEZONE'
  ];
  
  // 添加课表事件
  const scheduleEvents = events.filter(e => e.type === 'schedule');
  for (const event of scheduleEvents) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;TZID=${config.timeZone}:${formatICSDate(event.dtstart)}`,
      `DTEND;TZID=${config.timeZone}:${formatICSDate(event.dtend)}`,
      `SUMMARY:${event.summary}`,
      event.location ? `LOCATION:${event.location}` : '',
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      'END:VEVENT'
    );
  }
  
  // 添加自定义事件（带颜色标记）
  const customEvents = events.filter(e => e.type === 'custom');
  for (const event of customEvents) {
    const categoryEmoji = getCategoryEmoji(event.category);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;TZID=${config.timeZone}:${formatICSDate(event.dtstart)}`,
      `DTEND;TZID=${config.timeZone}:${formatICSDate(event.dtend)}`,
      `SUMMARY:${categoryEmoji} ${event.summary}`,
      event.location ? `LOCATION:${event.location}` : '',
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      event.reminder ? `BEGIN:VALARM\\nTRIGGER:-PT${event.reminder}M\\nACTION:DISPLAY\\nDESCRIPTION:提醒\\nEND:VALARM` : '',
      'END:VEVENT'
    );
  }
  
  lines.push('END:VCALENDAR');
  
  return lines.filter(l => l).join('\r\n');
}

/**
 * 格式化日期
 */
function formatICSDate(dateStr) {
  // 20260425T151500 -> 20260425T151500
  return dateStr.replace(/[-:]/g, '');
}

/**
 * 获取分类图标
 */
function getCategoryEmoji(category) {
  const emojis = {
    exam: '📝',
    homework: '📋',
    activity: '🎯',
    personal: '⭐',
    other: '📌'
  };
  return emojis[category] || '📌';
}

/**
 * 主函数
 */
function main() {
  try {
    // 读取课表 ICS
    const scheduleIcs = fs.readFileSync(CONFIG.scheduleIcsPath, 'utf-8');
    const scheduleEvents = parseICS(scheduleIcs);
    console.log(`✅ 读取课表: ${scheduleEvents.length} 个事件`);
    
    // 读取自定义日程
    let customEvents = [];
    if (fs.existsSync(CONFIG.customEventsPath)) {
      const customJson = fs.readFileSync(CONFIG.customEventsPath, 'utf-8');
      customEvents = parseCustomEvents(customJson);
      console.log(`✅ 读取自定义日程: ${customEvents.length} 个事件`);
    }
    
    // 合并事件
    const allEvents = [...scheduleEvents, ...customEvents];
    console.log(`✅ 合并总计: ${allEvents.length} 个事件`);
    
    // 生成新的 ICS
    const mergedIcs = generateICS(allEvents, CONFIG);
    fs.writeFileSync(CONFIG.outputIcsPath, mergedIcs, 'utf-8');
    console.log(`✅ 已生成合并日历: ${CONFIG.outputIcsPath}`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
